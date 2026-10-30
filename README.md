# Colon Histopathology Classification — SimpleColonCNN Demo

A local college-review prototype with a React/Vite interface and Flask REST API. It loads the provided `SimpleColonCNN` checkpoint, accepts JPG/PNG uploads, and stores prediction metadata only. The reported test accuracy is approximately 50%; this is an academic demo, not a medically reliable classifier.

## Important model status

The active backend model is `SimpleColonCNN`: 128 × 128 RGB input, float32 pixels divided by 255, three convolution/ReLU/max-pool blocks (16/32/64 channels), adaptive average pooling, and a two-logit linear head. `class_names.json` is ordered `colon_aca`, `colon_n`; the API displays those as Colon Adenocarcinoma and Normal. The checkpoint files are currently under `backend/models/results (1)/`; the loader finds them recursively.

The older `Cancer_Classification_Tri_Improved_AWFF-ML-Optuna.ipynb` and `Colon_TriBranch_Attention_Training.ipynb` describe a different tri-branch pipeline and are not used by this checkpoint.

## Prerequisites on Windows

Use the existing `.venv312` Python 3.12 environment for Flask/PyTorch. Keep `.venv` (Python 3.15) separate. The React frontend uses the installed Node.js runtime.

```powershell
winget install --id Python.Python.3.12 -e
winget install --id OpenJS.NodeJS.LTS -e
```

Restart VS Code after installation so `py`, `python`, and `npm` are available in its terminal.

## Start the application

Open two VS Code terminals at the project root.

### Terminal 1: Flask backend

```powershell
.\.venv312\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv312\Scripts\python.exe -m pip install numpy
.\.venv312\Scripts\python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cpu
.\.venv312\Scripts\python.exe -m pip install -r backend\requirements-model.txt
.\.venv312\Scripts\python.exe backend\app.py
```

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate again. The backend runs at `http://127.0.0.1:5001` to avoid common local port-5000 conflicts.

### Terminal 2: React/Vite frontend

```powershell
Set-Location frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` requests to Flask. Flask also enables credentialed CORS for the two local Vite origins.

## Local demo login

Default account: `reviewer@example.com` / `demo1234`. Change `DEMO_EMAIL`, `DEMO_PASSWORD`, and `FLASK_SECRET_KEY` in the local `.env` file before sharing the demo. `.env` is ignored by Git.

## Quick verification

1. Open `http://127.0.0.1:5001/api/health`; expect `backend: "ready"`, `model.ready: true`, and `classifier_name: "SimpleColonCNN"`.
2. Sign in with the local demo account; try an incorrect password to verify the login error state.
3. Open Image Classification, select or drop a JPG/PNG under 12 MB, and check its preview. Remove/replace it to verify the upload controls.
4. Analyze a real JPG/PNG histopathology image. A successful response includes the predicted class and classifier, but no confidence percentage because confidence is not calibrated.
5. Prediction History should show no rows until a real successful inference. Only result metadata is stored; image bytes are not.

The model files are expected at `backend/models/colon_quick_model.pth` and `backend/models/class_names.json`. The service also finds the current nested `backend/models/results (1)/` folder. If replacing the model, preserve the class-name order `['colon_aca', 'colon_n']`.

The reported test accuracy is approximately 50%. Predictions are experimental and are not suitable for diagnosis or treatment decisions. Only load trusted checkpoints; PyTorch uses `weights_only=True` when loading.

## Project layout

```text
backend/       Flask API, model service, model artifact directory
frontend/      React/Vite application
backend/history.sqlite3   Created locally after successful predictions; metadata only
Colon_TriBranch_Attention_Training.ipynb   Separate earlier tri-branch training experiment
Cancer_Classification_Tri_Improved_AWFF-ML-Optuna.ipynb
```

This is an academic prototype, not a medical device or substitute for professional diagnosis.