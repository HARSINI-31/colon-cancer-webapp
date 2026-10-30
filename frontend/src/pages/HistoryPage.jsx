import { useEffect, useState } from 'react';
import { Clock3, FileImage, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';

export function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadHistory() {
    setLoading(true);
    setError('');
    try { setItems((await api.history()).items); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadHistory(); }, []);

  return (
    <section className="history-panel panel-card">
      <div className="panel-heading"><div><p className="section-eyebrow">PRIVATE TO THIS LOCAL ACCOUNT</p><h2>Recent predictions</h2></div><button className="secondary-button compact" type="button" onClick={loadHistory} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh</button></div>
      {error && <div className="result-alert error-alert" role="alert">{error}</div>}
      {loading ? <div className="history-empty"><span className="spin"><RefreshCw size={19} /></span><p>Loading history</p></div> : items.length === 0 ? <div className="history-empty"><span><Clock3 size={21} /></span><strong>No completed predictions yet</strong><p>Successful model results will appear here. Uploaded images are never saved.</p></div> : <div className="history-table-wrap"><table className="history-table"><thead><tr><th>IMAGE FILE</th><th>PREDICTED CLASS</th><th>CLASSIFIER</th><th>DATE &amp; TIME</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><span className="history-file"><FileImage size={16} />{item.filename}</span></td><td><span className="history-class">{item.predicted_class}</span></td><td>{item.model_name}</td><td>{new Date(item.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}
      <p className="history-privacy">Only the filename, predicted class, classifier name, and timestamp are stored in the local SQLite database.</p>
    </section>
  );
}