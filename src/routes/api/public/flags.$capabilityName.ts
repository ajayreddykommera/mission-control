/**
 * GET /api/public/flags/:capabilityName  — UNAUTHENTICATED
 *
 * Returns active flags for a single capability.
 * Flags with status !== 'active' are excluded.
 *
 * Response:
 * {
 *   capabilityName: string
 *   flags: PublicFlag[]
 *   total: number
 * }
 */
import { createFileRoute } from '@tanstack/react-router'
import { getFlagsByCapability } from '@lib/flags-store'
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

export const Route = createFileRoute('/api/public/flags/$capabilityName')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const all    = await getFlagsByCapability(params.capabilityName)
        const active = all.filter((f) => f.status === 'active').map(toPublic)
        return Response.json({
          capabilityName: params.capabilityName,
          flags:          active,
          total:          active.length,
        })
      },
    },
  },
})
