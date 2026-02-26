/**
 * GET /api/flags/:capabilityName/:controlName/history  — ADMIN (SSO required — TODO)
 * Returns the full audit trail for a single control flag, newest first.
 */
import { createFileRoute } from '@tanstack/react-router'
import { getHistory } from '@lib/flags-history-store'
import { isAdmin } from '@middleware/auth'

export const Route = createFileRoute(
  '/api/internal/flags/$capabilityName/$controlName/history',
)({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        if (!isAdmin(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const entries = await getHistory(params.controlName)

        // Guard: filter to the requested capability
        const filtered = entries.filter(
          (e) => e.capabilityName === params.capabilityName,
        )

        return Response.json({
          capabilityName: params.capabilityName,
          controlName: params.controlName,
          total: filtered.length,
          history: filtered,
        })
      },
    },
  },
})
