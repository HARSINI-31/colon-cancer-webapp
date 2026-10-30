import { AlertTriangle, ArrowDown, CheckCircle2, CircleDot, Cpu, Database, Image, ScanLine } from 'lucide-react';

const steps = [
  { number: '01', title: 'RGB image input', detail: 'A JPG or PNG image is converted to RGB.', icon: Image },
  { number: '02', title: 'Resize and normalize', detail: 'Resize to 128 × 128, convert pixels to float32, and divide by 255.', icon: ScanLine },
  { number: '03', title: 'SimpleColonCNN', detail: 'Conv/ReLU/MaxPool blocks with 16, 32, then 64 channels; adaptive average pooling.', icon: Cpu },
  { number: '04', title: 'Two-class prediction', detail: 'Linear 64 → 2 logits. Index 0 is Colon Adenocarcinoma; index 1 is Normal.', icon: CheckCircle2 },
];

export function AboutModelPage({ health }) {
  const model = health?.model;
  return (
    <div className="about-page">
      <section className="model-callout"><span className="callout-icon"><AlertTriangle size={19} /></span><div><p className="section-eyebrow">MODEL LIMITATION</p><h2>Academic demo only: reported test accuracy is about 50%.</h2><p>This small SimpleColonCNN is not a medically reliable classifier. Do not use its output for diagnosis or clinical decisions.</p></div></section>
      <section className="model-status-card panel-card"><div className="panel-heading"><div><p className="section-eyebrow">ARTIFACT CHECK</p><h2>{model?.ready ? 'SimpleColonCNN loaded' : 'Inference is currently blocked'}</h2></div><span className={`status-label ${model?.ready ? 'status-label-ready' : ''}`}><span className="status-small-dot" />{model?.ready ? 'READY' : 'NOT READY'}</span></div>
        {model?.missing_artifacts?.length > 0 && <div className="artifact-list">{model.missing_artifacts.map((name) => <div className="artifact-row" key={name}><CircleDot size={15} /><code>backend/models/{name}</code><span>Missing</span></div>)}</div>}
        {model?.missing_dependencies?.length > 0 && <div className="artifact-list">{model.missing_dependencies.map((name) => <div className="artifact-row" key={name}><CircleDot size={15} /><code>Python package: {name}</code><span>Install</span></div>)}</div>}
        {model?.error && <p className="blocker-line"><AlertTriangle size={14} />{model.error}</p>}
        {!model && <p className="blocker-line">Backend health has not been received yet.</p>}
      </section>
      <section className="workflow-section"><div className="section-title-row"><div><p className="section-eyebrow">INFERENCE WORKFLOW</p><h2>How the pipeline is intended to work</h2></div><span className="section-note">NOTEBOOK-ALIGNED</span></div><div className="workflow-list">{steps.map(({ number, title, detail, icon: Icon }, index) => <div className="workflow-step" key={number}><span className="workflow-step-number">{number}</span><span className="workflow-step-icon"><Icon size={17} /></span><div><h3>{title}</h3><p>{detail}</p></div>{index < steps.length - 1 && <ArrowDown className="workflow-down" size={14} />}</div>)}</div></section>
      <section className="export-panel"><div className="export-icon"><Database size={19} /></div><div><p className="section-eyebrow">MODEL FILES</p><h2>Loaded from backend/models/</h2><p>SimpleColonCNN uses colon_quick_model.pth and class_names.json. The class list order is colon_aca, then colon_n. The API does not provide confidence because this model's output has not been calibrated.</p></div></section>
      <p className="about-disclaimer">Academic prototype only. Approximately 50% reported test accuracy; not a substitute for medical diagnosis.</p>
    </div>
  );
}