async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  meta: () => request('/api/meta'),
  talents: () => request('/api/talents'),
  yesterday: () => request('/api/yesterday'),
  guess: (body) => request('/api/guess', { method: 'POST', body: JSON.stringify(body) }),
  birthday: (date) => request(`/api/birthday?${new URLSearchParams({ date })}`),
  birthdayCheck: (body) => request('/api/birthday/check', { method: 'POST', body: JSON.stringify(body) }),
  hints: (date, mode, count) =>
    request(`/api/hints?${new URLSearchParams({ date, mode, count: String(count) })}`),
  portraitUrl: (date, mode) => `/api/puzzle/${encodeURIComponent(mode)}/image?date=${encodeURIComponent(date)}`,
};
