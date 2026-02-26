/**
 * GET /api/flags  — PUBLIC
 * Returns every flag across all capabilities.
 *
 * POST /api/flags  — ADMIN
 * Creates a new feature flag.
 */
import { createFileRoute } from '@tanstack/react-router'
import { getAllFlags, upsertFlag } from '@lib/flags-store'
import { addHistoryEntry } from '@lib/flags-history-store'
import { isAdmin, getSessionUser } from '@middleware/auth'
import type { FlagStatus } from '@types'

export const Route = createFileRoute('/api/internal/flags')({
  server: {
    handlers: {
      GET: async () => {
        const flags = await getAllFlags()
        return Response.json({ flags, total: flags.length })
      },

      POST: async ({ request }) => {
        if (!await isAdmin(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        type CreateBody = {
          capabilityName: string
          controlName: string
          label: string
          description: string
          state?: boolean
          status?: FlagStatus
          updatedBy?: string
        }
        const body: CreateBody = await request.json()
        if (!body.capabilityName || !body.controlName || !body.label) {
          return Response.json({ error: 'capabilityName, controlName and label are required' }, { status: 400 })
        }
        const sessionUser = await getSessionUser(request)
        const updatedBy = body.updatedBy ?? sessionUser?.upn ?? sessionUser?.name ?? 'admin'
        const flag = await upsertFlag({
          capabilityName: body.capabilityName,
          controlName: body.controlName,
          label: body.label,
          description: body.description ?? '',
          state: body.state ?? false,
          status: body.status ?? 'active',
          updatedBy,
          lastUpdatedAt: new Date().toISOString(),
          version: 1,
        })

        await addHistoryEntry({
          controlName: flag.controlName,
          capabilityName: flag.capabilityName,
          version: flag.version,
          state: flag.state,
          status: flag.status,
          updatedBy: flag.updatedBy,
          updatedAt: flag.lastUpdatedAt,
          changeDescription: `Flag created — initial state: ${flag.state ? 'ON' : 'OFF'}, status: ${flag.status}`,
        })

        return Response.json(flag, { status: 201 })
      },
    },
  },
})
