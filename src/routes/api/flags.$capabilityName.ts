/**
 * GET /api/flags/:capabilityName  — PUBLIC
 * Returns all flags belonging to a single capability.
 */
import { createFileRoute } from '@tanstack/react-router'
import { getFlagsByCapability } from '@lib/flags-store'

export const Route = createFileRoute('/api/flags/$capabilityName')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const flags = await getFlagsByCapability(params.capabilityName)
        return Response.json({
          capabilityName: params.capabilityName,
          flags,
          total: flags.length,
        })
      },
    },
  },
})
