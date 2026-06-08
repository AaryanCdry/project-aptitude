export function getInitials(name?: string | null): string {
  if (!name) return '?';
  const normalized = name.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!normalized) return '?';
  const parts = normalized.split(' ').filter(Boolean);
  if (!parts.length) return '?';
  const chars = parts.slice(0, 2).map(s => s.charAt(0)).filter(Boolean).join('');
  return (chars || '?').toUpperCase();
}
