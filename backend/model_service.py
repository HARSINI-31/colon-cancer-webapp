import io
import importlib
import importlib.util
import json
from pathlib import Path

from PIL import Image, UnidentifiedImageError


class ModelService:
    CHECKPOINT_NAME = "colon_quick_model.pth"
    LABELS_NAME = "class_names.json"
    EXPECTED_CLASS_NAMES = ["colon_aca", "colon_n"]
    DISPLAY_NAMES = {
        "colon_aca": "Colon Adenocarcinoma",
        "colon_n": "Normal",
    }
    CLASSIFIER_NAME = "SimpleColonCNN"
    IMAGE_SIZE = (128, 128)

    def __init__(self, models_dir):
        self.models_dir = Path(models_dir)
        self._bundle = None

    def _find_file(self, filename):
        direct_path = self.models_dir / filename
        if direct_path.is_file():
            return direct_path

        if self.models_dir.is_dir():
            matches = sorted(self.models_dir.rglob(filename))
            if matches:
                return matches[0]
        return None

    @staticmethod
    def _build_model(torch):
        nn = torch.nn

        class SimpleColonCNN(nn.Module):
            def __init__(self):
                super().__init__()
                self.features = nn.Sequential(
                    nn.Conv2d(3, 16, 3, padding=1),
                    nn.ReLU(),
                    nn.MaxPool2d(2),
                    nn.Conv2d(16, 32, 3, padding=1),
                    nn.ReLU(),
                    nn.MaxPool2d(2),
                    nn.Conv2d(32, 64, 3, padding=1),
                    nn.ReLU(),
                    nn.MaxPool2d(2),
                    nn.AdaptiveAvgPool2d((1, 1)),
                )
                self.classifier = nn.Linear(64, 2)

            def forward(self, x):
                x = self.features(x)
                x = torch.flatten(x, 1)
                return self.classifier(x)

        return SimpleColonCNN()

    @staticmethod
    def _extract_state_dict(checkpoint):
        if not isinstance(checkpoint, dict):
            raise ValueError("The checkpoint must contain a PyTorch state dictionary.")

        for key in ("state_dict", "model_state_dict", "model"):
            nested_state = checkpoint.get(key)
            if isinstance(nested_state, dict):
                checkpoint = nested_state
                break

        if not checkpoint or not all(hasattr(value, "shape") for value in checkpoint.values()):
            raise ValueError("No valid model state dictionary was found in the checkpoint.")

        if any(key.startswith("module.") for key in checkpoint):
            checkpoint = {
                key.removeprefix("module."): value
                for key, value in checkpoint.items()
            }
        return checkpoint

    @staticmethod
    def _read_class_names(labels_path):
        try:
            payload = json.loads(labels_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise ValueError(f"Could not read class_names.json: {error}") from error

        if isinstance(payload, list):
            class_names = payload
        elif isinstance(payload, dict):
            class_names = payload.get("class_names")
        else:
            class_names = None

        if class_names != ModelService.EXPECTED_CLASS_NAMES:
            raise ValueError(
                'class_names.json must list classes in this exact order: '
                '["colon_aca", "colon_n"].'
            )
        return class_names

    def _load_bundle(self):
        if self._bundle is not None:
            return self._bundle

        checkpoint_path = self._find_file(self.CHECKPOINT_NAME)
        labels_path = self._find_file(self.LABELS_NAME)
        if checkpoint_path is None:
            raise FileNotFoundError(
                f"Model checkpoint not found: place {self.CHECKPOINT_NAME} under {self.models_dir}."
            )
        if labels_path is None:
            raise FileNotFoundError(
                f"Class labels not found: place {self.LABELS_NAME} under {self.models_dir}."
            )

        try:
            torch = importlib.import_module("torch")
        except ImportError as error:
            raise RuntimeError(
                "PyTorch is not installed in the active Flask environment. "
                "Install the matching PyTorch build, then restart Flask."
            ) from error

        class_names = self._read_class_names(labels_path)
        try:
            checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
        except Exception as error:
            raise ValueError(f"Could not load {self.CHECKPOINT_NAME}: {error}") from error

        state_dict = self._extract_state_dict(checkpoint)
        model = self._build_model(torch)
        try:
            model.load_state_dict(state_dict, strict=True)
        except RuntimeError as error:
            raise ValueError(
                "Checkpoint weights do not match the specified SimpleColonCNN architecture. "
                f"Details: {error}"
            ) from error

        model.eval()
        self._bundle = {
            "torch": torch,
            "model": model,
            "class_names": class_names,
        }
        return self._bundle

    def status(self):
        missing = [
            name
            for name in (self.CHECKPOINT_NAME, self.LABELS_NAME)
            if self._find_file(name) is None
        ]
        missing_dependencies = []
        for package in ("torch", "numpy"):
            if importlib.util.find_spec(package) is None:
                missing_dependencies.append(package)

        error = None
        loaded = False
        if not missing and not missing_dependencies:
            try:
                self._load_bundle()
                loaded = True
            except Exception as load_error:
                error = str(load_error)

        return {
            "ready": loaded,
            "loaded": loaded,
            "classifier_name": self.CLASSIFIER_NAME if loaded else None,
            "expected_labels": [
                self.DISPLAY_NAMES[name] for name in self.EXPECTED_CLASS_NAMES
            ],
            "missing_artifacts": missing,
            "missing_dependencies": missing_dependencies,
            "error": error,
        }

    @staticmethod
    def _preprocess(image_bytes, torch):
        try:
            with Image.open(io.BytesIO(image_bytes)) as source:
                image = source.convert("RGB").resize(
                    ModelService.IMAGE_SIZE,
                    resample=Image.Resampling.BILINEAR,
                )
                import numpy as np

                pixels = np.asarray(image, dtype=np.float32) / 255.0
        except (UnidentifiedImageError, OSError, ValueError) as error:
            raise ValueError(f"Uploaded file is not a readable image: {error}") from error

        image_tensor = torch.from_numpy(pixels.transpose(2, 0, 1).copy())
        return image_tensor.unsqueeze(0)

    def predict(self, image_bytes):
        bundle = self._load_bundle()
        image_tensor = self._preprocess(image_bytes, bundle["torch"])

        bundle["model"].eval()
        with bundle["torch"].no_grad():
            logits = bundle["model"](image_tensor)
            class_index = int(logits.argmax(dim=1).item())

        class_key = bundle["class_names"][class_index]
        return {
            "predicted_class": self.DISPLAY_NAMES[class_key],
            "classifier_name": self.CLASSIFIER_NAME,
            "confidence": None,
        }