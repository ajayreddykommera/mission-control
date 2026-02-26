/**
 * GET /api/flags/history  — ADMIN (SSO required — TODO)
 * Returns the full audit trail for all flags, sorted newest first.
 */
import { createFileRoute } from '@tanstack/react-router'
import { getAllHistory } from '@lib/flags-history-store'
import { isAdmin } from '@middleware/auth'

export const Route = createFileRoute('/api/internal/flags/history')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAdmin(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const history = await getAllHistory()
        return Response.json({ total: history.length, history })
      },
    },
  },
})
