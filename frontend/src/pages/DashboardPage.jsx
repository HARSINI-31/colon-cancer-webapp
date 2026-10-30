import { ArrowRight, Check, CircleAlert, Cpu, FileImage, ScanLine, ShieldCheck } from 'lucide-react';

const workflow = [
  { number: '01', title: 'Image preprocessing', detail: 'RGB · resize to 128 × 128 · float32 / 255', icon: ScanLine, tone: 'cyan' },
  { number: '02', title: 'SimpleColonCNN', detail: 'Three convolution blocks · 16, 32, and 64 channels', icon: Cpu, tone: 'blue' },
  { number: '03', title: 'Global pooling', detail: 'Adaptive average pool and a 64-feature vector', icon: Cpu, tone: 'teal' },
  { number: '04', title: 'Binary output', detail: 'colon_aca → Adenocarcinoma · colon_n → Normal', icon: Check, tone: 'navy' },
];

export function DashboardPage({ health, onNavigate }) {
  const modelReady = health?.model?.ready === true;
  return (
    <div className="dashboard-page">
      <section className="welcome-strip">
        <div className="welcome-copy"><span className="welcome-mark"><FileImage size={18} /></span><div><h2>Good to have you here.</h2><p>Review colon histopathology images in your local workspace.</p></div></div>
        <button className="primary-button" onClick={() => onNavigate('classify')} type="button">New analysis <ArrowRight size={16} /></button>
      </section>

      {!modelReady && <section className="readiness-banner"><span className="readiness-icon"><CircleAlert size={18} /></span><div><strong>Model artifacts are not ready</strong><p>The upload flow is available, but predictions stay disabled until a trained, colon-compatible pipeline is installed.</p></div><button type="button" onClick={() => onNavigate('about')}>View requirements <ArrowRight size={15} /></button></section>}
      <section className="readiness-banner"><span className="readiness-icon"><CircleAlert size={18} /></span><div><strong>Limited experimental performance</strong><p>Reported test accuracy is approximately 50%. This small academic model is not reliable for diagnosis or clinical decisions.</p></div><button type="button" onClick={() => onNavigate('about')}>Model details <ArrowRight size={15} /></button></section>

      <div className="section-title-row"><div><p className="section-eyebrow">PIPELINE OVERVIEW</p><h2>From tissue image to model output</h2></div><span className="section-note">4 STAGES</span></div>
      <section className="workflow-grid" aria-label="Model workflow">
        {workflow.map(({ number, title, detail, icon: Icon, tone }) => <article className="workflow-card" key={number}><div className="workflow-card-top"><span className="workflow-number">{number}</span><span className={`workflow-icon ${tone}`}><Icon size={18} /></span></div><h3>{title}</h3><p>{detail}</p></article>)}
      </section>

      <section className="dashboard-lower">
        <article className="overview-panel"><div className="panel-heading"><div><p className="section-eyebrow">CURRENT BUILD</p><h2>Project overview</h2></div><span className="status-label"><span className="status-small-dot" /> {modelReady ? 'READY' : 'INTEGRATION NEEDED'}</span></div><p className="overview-copy">A small local image classifier using SimpleColonCNN. It predicts one of two Kaggle dataset labels from a 128 × 128 RGB image.</p><div className="overview-facts"><div><strong>128 × 128</strong><span>RGB input</span></div><div><strong>2</strong><span>output classes</span></div><div><strong>{health?.model?.classifier_name || '—'}</strong><span>classifier</span></div></div></article>
        <article className="quick-panel"><div className="panel-heading"><div><p className="section-eyebrow">SYSTEM STATUS</p><h2>Local services</h2></div></div><div className="service-row"><span className={`service-icon ${health?.backend === 'ready' ? 'service-ok' : 'service-off'}`}><ScanLine size={16} /></span><span><strong>Flask API</strong><small>REST · port 5001</small></span><b className={health?.backend === 'ready' ? 'text-ok' : 'text-off'}>{health?.backend === 'ready' ? 'Connected' : 'Offline'}</b></div><div className="service-row"><span className={`service-icon ${modelReady ? 'service-ok' : 'service-off'}`}><Cpu size={16} /></span><span><strong>Inference model</strong><small>{health?.model?.classifier_name || 'Trained artifacts required'}</small></span><b className={modelReady ? 'text-ok' : 'text-off'}>{modelReady ? 'Ready' : 'Unavailable'}</b></div><button className="text-button" type="button" onClick={() => onNavigate('about')}>Review model details <ArrowRight size={14} /></button></article>
      </section>
      <p className="data-note"><ShieldCheck size={15} /> Uploaded images are processed in memory and are not retained. History stores filenames and result metadata only.</p>
    </div>
  );
}