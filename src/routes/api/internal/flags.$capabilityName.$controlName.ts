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
import type { ControlFlag, FlagStatus } from '@types'
import { isAdmin } from '@middleware/auth'

// ── Audit helpers ─────────────────────────────────────────────────────────────

/**
 * Compares a flag's state before an edit against the intended new values and
 * returns a human-readable sentence suitable for the audit history log.
 *
 * Rules:
 *   • Each changed field contributes one clause separated by " · "
 *   • state    → "State: OFF → ON"
 *   • label    → "Label: "Old" → "New""
 *   • desc     → "Description updated"   (values can be long, don't diff inline)
 *   • status   → "Status: active → deleted"
 *   • no diff  → "No changes"
 */
function buildChangeDescription(
  before: Pick<ControlFlag, 'state' | 'label' | 'description' | 'status'>,
  changes: {
    state?:       boolean
    label?:       string
    description?: string
    status?:      FlagStatus
  },
): string {
  const parts: string[] = []

  if (changes.state !== undefined && changes.state !== before.state) {
    parts.push(`State: ${before.state ? 'ON' : 'OFF'} → ${changes.state ? 'ON' : 'OFF'}`)
  }
  if (changes.label !== undefined && changes.label !== before.label) {
    parts.push(`Label: "${before.label}" → "${changes.label}"`)
  }
  if (changes.description !== undefined && changes.description !== before.description) {
    parts.push(`Description: "${before.description ?? ''}" → "${changes.description}"`)
  }
  if (changes.status !== undefined && changes.status !== before.status) {
    parts.push(`Status: ${before.status} → ${changes.status}`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'No changes'
}

export const Route = createFileRoute(
  '/api/internal/flags/$capabilityName/$controlName',
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

        // Read the flag before any changes so we can diff for the audit description
        const before = await getFlag(params.capabilityName, params.controlName)
        if (!before) {
          return Response.json(
            { error: `Flag '${params.controlName}' not found in capability '${params.capabilityName}'` },
            { status: 404 },
          )
        }

        // Decide whether this is a pure toggle (empty body) or an explicit edit
        const editableKeys: (keyof PatchBody)[] = ['state', 'status', 'label', 'description']
        const hasEditableFields = editableKeys.some((k) => body[k] !== undefined)
        const isPureToggle = !hasEditableFields

        // ── Apply state change ───────────────────────────────────────────────
        let flag = before
        if (isPureToggle) {
          flag = (await toggleFlag(params.capabilityName, params.controlName, updatedBy)) ?? before
        } else if (typeof body.state === 'boolean') {
          flag = (await setFlagState(params.capabilityName, params.controlName, body.state, updatedBy)) ?? before
        }
        // If body has other fields but no explicit state, state stays unchanged

        // ── Apply metadata patch ─────────────────────────────────────────────
        const meta: Partial<Pick<typeof flag, 'label' | 'description' | 'status'>> = {}
        if (body.status !== undefined) meta.status = body.status
        if (body.label !== undefined) meta.label = body.label
        if (body.description !== undefined) meta.description = body.description
        if (Object.keys(meta).length > 0) {
          flag = (await updateFlagMeta(params.capabilityName, params.controlName, meta, updatedBy)) ?? flag
        }

        // ── Build rich audit description ─────────────────────────────────────
        // Prefer an explicit caller-supplied description; otherwise auto-generate
        // a human-readable diff so every field change is traceable.
        const changeDescription = body.changeDescription ?? buildChangeDescription(before, {
          state:       isPureToggle || typeof body.state === 'boolean' ? flag.state : undefined,
          label:       body.label,
          description: body.description,
          status:      body.status,
        })

        // ── Write audit history entry (single entry per edit) ────────────────
        await addHistoryEntry({
          controlName:    flag.controlName,
          capabilityName: flag.capabilityName,
          version:        flag.version,
          state:          flag.state,
          status:         flag.status,
          updatedBy,
          updatedAt:      flag.lastUpdatedAt,
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
