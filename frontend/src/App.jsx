import { useEffect, useState } from 'react';
import { api } from './services/api.js';
import { AppShell } from './components/AppShell.jsx';
import { LoginPage } from './pages/LoginPage.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [health, setHealth] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    api.health().then(setHealth).catch((error) => {
      setHealth({ status: 'offline', backend: 'offline', error: error.message, model: { ready: false } });
    });
    api.session()
      .then((result) => setUser(result.authenticated && result.user ? result.user : null))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  async function handleLogout() {
    try { await api.logout(); } catch { /* Clear the local view even if Flask stopped. */ }
    setUser(null);
    setActivePage('dashboard');
  }

  if (!authChecked) return <div className="boot-screen"><span className="boot-mark">C</span><span>Opening review workspace</span></div>;
  if (!user) return <LoginPage onLogin={setUser} backendOnline={health?.backend === 'ready'} />;

  return (
    <AppShell
      user={user}
      health={health}
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={handleLogout}
      onHealthRefresh={() => api.health().then(setHealth).catch((error) => setHealth({ status: 'offline', backend: 'offline', error: error.message, model: { ready: false } }))}
    />
  );
}