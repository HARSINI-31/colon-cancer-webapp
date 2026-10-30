import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Microscope, ShieldCheck } from 'lucide-react';
import { api } from '../services/api.js';

export function LoginPage({ onLogin, backendOnline }) {
  const [email, setEmail] = useState('reviewer@example.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password to continue.');
      return;
    }
    setBusy(true);
    try {
      const result = await api.login(email, password);
      onLogin(result.user);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-visual" aria-label="Colorectal AI project">
        <div className="visual-grid" />
        <div className="visual-topline"><span className="brand-icon"><Microscope size={19} /></span><span>COLORECTAL AI <i>/</i> HISTOLOGY REVIEW</span></div>
        <div className="visual-content">
          <p className="login-overline"><span className="overline-rule" /> RESEARCH WORKSPACE</p>
          <h1>See tissue<br />with a little<br /><em>more clarity.</em></h1>
          <p className="visual-description">A tri-branch feature-learning prototype for colon histopathology image review.</p>
          <div className="visual-tags"><span><span className="tag-dot" /> Image analysis</span><span>Model workflow</span><span>Local demo</span></div>
        </div>
        <div className="visual-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-orbit orbit-three" />
          <div className="art-center"><Microscope size={42} strokeWidth={1.15} /></div>
          <span className="art-node node-one" /><span className="art-node node-two" /><span className="art-node node-three" />
        </div>
        <div className="visual-bottom"><span>ACADEMIC MINI-PROJECT</span><span>LOCAL ACCESS ONLY · 01</span></div>
      </section>

      <section className="login-panel">
        <div className="login-card-wrap">
          <div className="login-heading"><p className="page-kicker">WELCOME BACK</p><h2>Sign in to your<br />workspace</h2><p>Use your local review account to continue.</p></div>
          {!backendOnline && <div className="inline-alert warning"><span className="alert-dot" /> Flask API is offline. Start the backend, then refresh.</div>}
          <form className="login-form" onSubmit={submit} noValidate>
            <label htmlFor="email">Email address</label>
            <div className="input-wrap"><Mail size={17} /><input id="email" type="email" autoComplete="username" placeholder="you@institution.edu" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            <label htmlFor="password">Password</label>
            <div className="input-wrap"><LockKeyhole size={17} /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-button login-submit" type="submit" disabled={busy || !backendOnline}>{busy ? <><span className="spinner" /> Signing in</> : <>Sign in <ArrowRight size={17} /></>}</button>
          </form>
          <div className="demo-account"><span className="demo-lock"><ShieldCheck size={16} /></span><span><strong>Local demo account</strong><small>reviewer@example.com <i>·</i> demo1234</small></span></div>
          <p className="login-disclaimer">Research prototype only. Not a medical device or diagnostic service.</p>
        </div>
      </section>
    </main>
  );
}