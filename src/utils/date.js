/** Returns today as YYYY-MM-DD */
export const today = () => new Date().toISOString().slice(0, 10);

/** Returns current month as YYYY-MM */
export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Format date to DD/MM/YYYY for display */
export function formatIN(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/** Start of current month as YYYY-MM-DD */
export function monthStart(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset, 1);
  return d.toISOString().slice(0, 10);
}

/** End of current month as YYYY-MM-DD */
export function monthEnd(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset + 1, 0);
  return d.toISOString().slice(0, 10);
}

/** Returns timestamp as human-readable "2 hours ago" etc. */
export function timeAgo(ts) {
  const diff = Date.now() - (ts || Date.now());
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
