/**
 * Date formatting utilities
 */

/** ISO-8601 timestamp for right now */
export function nowISO(): string {
  return new Date().toISOString()
}

/** Format an ISO string to a human-readable local date-time */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

/** Return a relative label like "2 hours ago", "just now", etc. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
