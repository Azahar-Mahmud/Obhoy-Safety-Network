function timeAgo(date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function buildStatusLine(lastActiveAt, batteryPercent) {
  const parts = [];
  if (lastActiveAt) {
    parts.push(`Last active: ${timeAgo(new Date(lastActiveAt))}`);
  }
  if (typeof batteryPercent === 'number') {
    parts.push(`Battery: ${batteryPercent}%`);
  }
  return parts.length ? ` | ${parts.join(', ')}` : '';
}

module.exports = { buildStatusLine };