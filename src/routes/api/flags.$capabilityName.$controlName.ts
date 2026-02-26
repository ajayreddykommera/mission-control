/**
 * GET   /api/flags/:capabilityName/:controlName  — PUBLIC
 *   Returns a single flag's current state/status.
 *
 * PATCH /api/flags/:capabilityName/:controlName  — ADMIN (SSO required — TODO)
 *   Toggle or update a flag. Writes an audit entry to ControlFlagsHistoryTable.
 *
 * PATCH body (all fields optional):
 * {
 *   state?: boolean            — explicit enable/disable (omit to toggle)
 *   status?: 'active' | 'deprecated' | 'draft'
 *   label?: string
 *   description?: string
 *   updatedBy?: string         — identity making the change (default: 'system')
 *   changeDescription?: string — written to history log
 * }
 */
import { createFileRoute } from '@tanstack/react-router'
import { getFlag, toggleFlag, setFlagState, updateFlagMeta, deleteFlag } from '@lib/flags-store'
import { addHistoryEntry } from '@lib/flags-history-store'
import type { FlagStatus } from '@types'
import { isAdmin } from '@middleware/auth'

export const Route = createFileRoute(
  '/api/flags/$capabilityName/$controlName',
)({
  server: {
    handlers: {
      // ── Public ────────────────────────────────────────────────────────────
      GET: async ({ params }) => {
        const flag = await getFlag(params.capabilityName, params.controlName)
        if (!flag) {
          return Response.json(
            {
              error: `Flag '${params.controlName}' not found in capability '${params.capabilityName}'`,
            },
            { status: 404 },
          )
        }
        return Response.json(flag)
      },

      // ── Admin (SSO TODO) ──────────────────────────────────────────────────
      PATCH: async ({ params, request }) => {
        if (!isAdmin(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        type PatchBody = {
          state?: boolean
          status?: FlagStatus
          label?: string
          description?: string
          updatedBy?: string
          changeDescription?: string
        }
        let body: PatchBody = {}
        try {
          body = await request.json()
        } catch {
          /* no body — plain toggle */
        }

        const updatedBy = body.updatedBy ?? 'system'
        const changeDescription =
          body.changeDescription ??
          (typeof body.state === 'boolean'
            ? `State set to ${body.state}`
            : 'Toggled state')

        // Apply state change
        let flag =
          typeof body.state === 'boolean'
            ? await setFlagState(
                params.capabilityName,
                params.controlName,
                body.state,
                updatedBy,
              )
            : await toggleFlag(
                params.capabilityName,
                params.controlName,
                updatedBy,
              )

        if (!flag) {
          return Response.json(
            {
              error: `Flag '${params.controlName}' not found in capability '${params.capabilityName}'`,
            },
            { status: 404 },
          )
        }

        // Apply metadata patch if any fields were provided
        const meta: Partial<Pick<typeof flag, 'label' | 'description' | 'status'>> = {}
        if (body.status !== undefined) meta.status = body.status
        if (body.label !== undefined) meta.label = body.label
        if (body.description !== undefined) meta.description = body.description
        if (Object.keys(meta).length > 0) {
          flag =
            (await updateFlagMeta(
              params.capabilityName,
              params.controlName,
              meta,
              updatedBy,
            )) ?? flag
        }

        // Write audit history entry
        await addHistoryEntry({
          controlName: flag.controlName,
          capabilityName: flag.capabilityName,
          version: flag.version,
          state: flag.state,
          status: flag.status,
          updatedBy,
          updatedAt: flag.lastUpdatedAt,
          changeDescription,
        })

        return Response.json(flag)
      },

      // ── Admin: delete ─────────────────────────────────────────────────────
      DELETE: async ({ params, request }) => {
        if (!isAdmin(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const deleted = await deleteFlag(params.capabilityName, params.controlName)
        if (!deleted) {
          return Response.json(
            { error: `Flag '${params.controlName}' not found in capability '${params.capabilityName}'` },
            { status: 404 },
          )
        }
        return Response.json({ success: true })
      },

      // ── Admin: update metadata (label / description / status) ────────────
      PUT: async ({ params, request }) => {
        if (!isAdmin(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        type PutBody = {
          label?: string
          description?: string
          status?: FlagStatus
          state?: boolean
          updatedBy?: string
        }
        const body: PutBody = await request.json()
        // Only include fields that were actually sent — avoids overwriting
        // existing label/description with undefined (e.g. during soft delete)
        const patch: Partial<Pick<typeof body, 'label' | 'description' | 'status'>> = {}
        if (body.label !== undefined) patch.label = body.label
        if (body.description !== undefined) patch.description = body.description
        if (body.status !== undefined) patch.status = body.status
        // Apply state change first if provided, then apply meta patch
        if (typeof body.state === 'boolean') {
          await setFlagState(params.capabilityName, params.controlName, body.state, body.updatedBy ?? 'system')
        }
        const flag = await updateFlagMeta(
          params.capabilityName,
          params.controlName,
          patch,
          body.updatedBy ?? 'system',
        )
        if (!flag) {
          return Response.json(
            { error: `Flag '${params.controlName}' not found` },
            { status: 404 },
          )
        }
        return Response.json(flag)
      },
    },
  },
})
