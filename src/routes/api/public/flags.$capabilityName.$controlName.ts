/**
 * GET /api/public/flags/:capabilityName/:controlName  — UNAUTHENTICATED
 *
 * Returns a single active flag.
 * Returns 404 if the flag does not exist or is not active.
 *
 * Response:
 *   PublicFlag  — { capabilityName, controlName, label, state, version }
 */
import { createFileRoute } from '@tanstack/react-router'
import { getFlag } from '@lib/flags-store'
import type { PublicFlag } from '@types'

export const Route = createFileRoute('/api/public/flags/$capabilityName/$controlName')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const flag = await getFlag(params.capabilityName, params.controlName)

        if (!flag || flag.status !== 'active') {
          return Response.json(
            { error: `Flag '${params.controlName}' not found in capability '${params.capabilityName}'` },
            { status: 404 },
          )
        }

        const result: PublicFlag = {
          capabilityName: flag.capabilityName,
          controlName:    flag.controlName,
          label:          flag.label,
          state:          flag.state,
          version:        flag.version,
        }

        return Response.json(result)
      },
    },
  },
})
