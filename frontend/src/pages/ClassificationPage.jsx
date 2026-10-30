import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, FileImage, ImagePlus, LoaderCircle, RotateCcw, UploadCloud } from 'lucide-react';
import { api } from '../services/api.js';

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

export function ClassificationPage({ health }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const modelReady = health?.model?.ready === true;

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function chooseFile(nextFile) {
    setError('');
    setResult(null);
    if (!nextFile) return;
    if (!ACCEPTED_TYPES.includes(nextFile.type) || !/\.(jpe?g|png)$/i.test(nextFile.name)) {
      setError('Choose a JPG, JPEG, or PNG image.');
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError('The image exceeds the 12 MB file-size limit.');
      return;
    }
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function analyze() {
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setResult(await api.predict(file));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="classification-page">
      <div className={`model-readiness ${modelReady ? 'ready' : ''}`}><span className="readiness-indicator" /><div><strong>{modelReady ? 'Inference model ready' : 'Inference model unavailable'}</strong><p>{modelReady ? `Using ${health.model.classifier_name}. Reported test accuracy is about 50%; demo use only.` : 'You can preview an image, but prediction requires the model files and dependencies listed in About Model.'}</p></div><span className="readiness-code">{modelReady ? 'READY' : 'HTTP 503'}</span></div>
      <div className="classification-grid">
        <section className="upload-panel panel-card">
          <div className="panel-heading"><div><p className="section-eyebrow">IMAGE INPUT</p><h2>Upload a tissue image</h2></div><span className="format-tag">JPG · PNG</span></div>
          {!file ? <div className={`upload-zone ${dragging ? 'is-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }}>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={(event) => chooseFile(event.target.files[0])} aria-label="Choose a histopathology image" />
            <span className="upload-cloud"><UploadCloud size={23} /></span><strong>Drag your image here</strong><span className="upload-or">or</span><button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}><ImagePlus size={16} /> Browse files</button><small>JPEG or PNG · up to 12 MB</small>
          </div> : <div className="image-preview-card"><img src={previewUrl} alt={`Preview of ${file.name}`} /><div className="preview-overlay"><span><FileImage size={15} /> {file.name}</span><button type="button" onClick={clearFile} aria-label="Remove image"><RotateCcw size={15} /> Replace</button></div></div>}
          <div className="upload-actions"><div className="selected-image-meta">{file ? <><span className="file-state-dot" />{(file.size / (1024 * 1024)).toFixed(2)} MB · ready for upload</> : 'No image selected'}</div><button className="primary-button analyze-button" type="button" disabled={!file || busy} onClick={analyze}>{busy ? <><LoaderCircle className="spin" size={16} /> Analyzing</> : <>Analyze image <ArrowRight size={16} /></>}</button></div>
          {error && <div className="result-alert error-alert" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
          {result && <div className="result-card" role="status"><div className="result-card-head"><span className="result-check"><CheckCircle2 size={19} /></span><div><p className="section-eyebrow">ANALYSIS COMPLETE</p><h3>{result.predicted_class}</h3></div></div><div className="result-details"><div><small>CLASSIFIER</small><strong>{result.classifier_name}</strong></div>{result.confidence != null && <div><small>CALIBRATED CONFIDENCE</small><strong>{(result.confidence * 100).toFixed(1)}%</strong></div>}</div><p className="pipeline-caption">{result.pipeline}</p></div>}
        </section>
        <aside className="analysis-side">
          <div className="side-card preview-side"><div className="panel-heading"><div><p className="section-eyebrow">PREVIEW</p><h2>Selected image</h2></div></div><div className={`side-image ${file ? 'has-image' : ''}`}>{file ? <img src={previewUrl} alt="Selected histopathology slide" /> : <div className="empty-image"><span><FileImage size={22} /></span><p>Your image preview<br />will appear here</p></div>}</div><div className="side-image-footer"><span>RGB IMAGE</span><span>ORIGINAL FILE</span></div></div>
          <div className="side-card pipeline-side"><div className="panel-heading"><div><p className="section-eyebrow">INFERENCE PIPELINE</p><h2>What happens next</h2></div></div><ol className="mini-pipeline"><li><span>1</span><div><strong>Preprocess</strong><small>RGB · 128 × 128 · float32 / 255</small></div></li><li><span>2</span><div><strong>SimpleColonCNN</strong><small>Conv blocks · adaptive average pooling</small></div></li><li><span>3</span><div><strong>Classify</strong><small>colon_aca or colon_n</small></div></li></ol></div>
        </aside>
      </div>
      <div className="clinical-disclaimer"><span>i</span><p><strong>Academic demo only.</strong> Reported test accuracy is about 50%; results are not medically reliable and must not guide clinical decisions.</p></div>
    </div>
  );
}