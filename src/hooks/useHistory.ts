/**
 * useHistory — data hooks for the Flags History page.
 *
 * useAllHistory()            — fetches the full audit log across all flags
 * useFlagHistory(cap, ctrl)  — fetches the audit log for one specific flag
 */
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@utils/api'
import type { ControlFlagHistory } from '@types'

export function useAllHistory() {
  return useQuery({
    queryKey: ['history', 'all'],
    queryFn: () =>
      apiFetch<{ history: ControlFlagHistory[] }>('/api/internal/flags/history').then(
        (d) => d.history,
      ),
    staleTime: 30_000,
  })
}

export function useFlagHistory(
  capabilityName: string,
  controlName: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['history', capabilityName, controlName],
    queryFn: () =>
      apiFetch<{ history: ControlFlagHistory[] }>(
        `/api/internal/flags/${capabilityName}/${controlName}/history`,
      ).then((d) => d.history),
    enabled,
    staleTime: 30_000,
  })
}
