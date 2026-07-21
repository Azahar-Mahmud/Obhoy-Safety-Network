function normalizeToE164(phone) {
  const cleaned = String(phone).replace(/[\s-]/g, '');
  if (cleaned.startsWith('+880')) return cleaned;
  if (cleaned.startsWith('880')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+880' + cleaned.slice(1);
  return '+880' + cleaned;
}

module.exports = { normalizeToE164 };