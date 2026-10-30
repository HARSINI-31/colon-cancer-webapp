async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      credentials: 'include',
      ...options,
    });
  } catch {
    throw new Error('Cannot reach Flask. Start the backend on port 5000 and try again.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed (${response.status}).`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export const api = {
  health: () => request('/api/health'),
  session: () => request('/api/session'),
  login: (email, password) => request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }),
  logout: () => request('/api/logout', { method: 'POST' }),
  history: () => request('/api/history'),
  predict: (file) => {
    const body = new FormData();
    body.append('image', file);
    return request('/api/predict', { method: 'POST', body });
  },
};