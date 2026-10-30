import {
  Activity, ArrowUpRight, BadgeInfo, ChevronRight, CircleHelp, ClipboardList,
  FileImage, LayoutDashboard, LogOut, Microscope, ShieldCheck,
} from 'lucide-react';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { ClassificationPage } from '../pages/ClassificationPage.jsx';
import { HistoryPage } from '../pages/HistoryPage.jsx';
import { AboutModelPage } from '../pages/AboutModelPage.jsx';

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'classify', label: 'Image classification', icon: FileImage },
  { id: 'history', label: 'Prediction history', icon: ClipboardList },
  { id: 'about', label: 'About the model', icon: BadgeInfo },
];

const titles = {
  dashboard: ['Overview', 'Your analysis workspace'],
  classify: ['Image classification', 'Upload a histopathology image'],
  history: ['Prediction history', 'Recent analyses for this account'],
  about: ['About the model', 'Notebook-based workflow and readiness'],
};

export function AppShell({ user, health, activePage, onNavigate, onLogout, onHealthRefresh }) {
  const [title, subtitle] = titles[activePage];
  const modelReady = health?.model?.ready === true;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <a className="brand-lockup" href="#dashboard" onClick={(event) => { event.preventDefault(); onNavigate('dashboard'); }}>
          <span className="brand-icon"><Microscope size={18} strokeWidth={2.2} /></span>
          <span className="brand-copy"><strong>Colorectal AI</strong><small>HISTOLOGY REVIEW</small></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`nav-item ${activePage === id ? 'active' : ''}`} onClick={() => onNavigate(id)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {activePage === id && <ChevronRight className="nav-chevron" size={15} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className={`model-mini-status ${modelReady ? 'is-ready' : ''}`}>
          <span className="mini-status-icon"><Activity size={15} /></span>
          <span><strong>{modelReady ? 'Model ready' : 'Model not connected'}</strong><small>{modelReady ? health.model.classifier_name : 'Artifacts required'}</small></span>
          <span className="pulse-dot" />
        </div>
        <button className="nav-item logout-item" type="button" onClick={onLogout}>
          <LogOut size={17} strokeWidth={1.8} /><span>Log out</span>
        </button>
        <div className="sidebar-foot"><ShieldCheck size={14} /> Academic prototype</div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><strong>{title}</strong></div>
          <div className="topbar-right">
            <div className={`connection-pill ${health?.backend === 'ready' ? 'online' : 'offline'}`}><span />{health?.backend === 'ready' ? 'API connected' : 'API offline'}</div>
            <div className="user-chip"><span className="avatar">{user.email?.slice(0, 1).toUpperCase() || 'R'}</span><span className="user-email">{user.email}</span></div>
          </div>
        </header>

        <main className="page-content" key={activePage}>
          <div className="page-heading">
            <div><p className="page-kicker">COLON HISTOPATHOLOGY · ACADEMIC PROTOTYPE</p><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div>
            <button className="icon-button help-button" type="button" title="Refresh backend status" aria-label="Refresh backend status" onClick={onHealthRefresh}><CircleHelp size={18} /></button>
          </div>
          {activePage === 'dashboard' && <DashboardPage health={health} onNavigate={onNavigate} />}
          {activePage === 'classify' && <ClassificationPage health={health} />}
          {activePage === 'history' && <HistoryPage />}
          {activePage === 'about' && <AboutModelPage health={health} />}
          <footer className="page-footer"><span>Colorectal AI <span className="footer-separator">/</span> Mini-project review build</span><span>Not for clinical use <ArrowUpRight size={12} /></span></footer>
        </main>
      </div>
    </div>
  );
}