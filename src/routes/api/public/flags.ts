/**
 * GET /api/public/flags  — UNAUTHENTICATED
 *
 * Returns all active flags across every capability.
 * Only flags with status === 'active' are included.
 *
 * Response:
 * {
 *   flags: PublicFlag[]   — active flags only
 *   total: number
 * }
 */
import { createFileRoute } from '@tanstack/react-router'
import { getAllFlags } from '@lib/flags-store'
import type { PublicFlag } from '@types'

function toPublic(flag: { capabilityName: string; controlName: string; label: string; state: boolean; version: number }): PublicFlag {
  return {
    capabilityName: flag.capabilityName,
    controlName:    flag.controlName,
    label:          flag.label,
    state:          flag.state,
    version:        flag.version,
  }
}

export const Route = createFileRoute('/api/public/flags')({
  server: {
    handlers: {
      GET: async () => {
        const all    = await getAllFlags()
        const active = all.filter((f) => f.status === 'active').map(toPublic)
        return Response.json({ flags: active, total: active.length })
      },
    },
  },
})
