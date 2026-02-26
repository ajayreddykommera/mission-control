/**
 * useFlags — client-side data hook for feature flags.
 *
 * Backed by TanStack Query for caching, background refetch, and mutation.
 *
 * Usage:
 *   const { flags, isLoading, error, refetch } = useFlags()
 *   const { flags, isLoading } = useFlags('core')   // filter by capability
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { apiFetch, apiPatch, apiPost } from '@utils/api'
import type { ControlFlag, FlagStatus } from '@types'

export function useFlags(capabilityName?: string) {
  const path = capabilityName ? `/api/internal/flags/${capabilityName}` : '/api/internal/flags'
  const queryKey = capabilityName ? ['flags', capabilityName] : ['flags']

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => apiFetch<{ flags: ControlFlag[] }>(path).then((d) => d.flags),
  })

  return {
    flags: data ?? [],
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}

export function useToggleFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ capabilityName, controlName }: { capabilityName: string; controlName: string }) =>
      apiPatch<ControlFlag>(`/api/internal/flags/${capabilityName}/${controlName}`, {}),
    onSuccess: (updated) => {
      void message.success(`"${updated.controlName}" turned ${updated.state ? 'ON ✅' : 'OFF ⛔'}`)
      queryClient.setQueryData<ControlFlag[]>(['flags'], (prev) =>
        prev?.map((f) =>
          f.capabilityName === updated.capabilityName && f.controlName === updated.controlName
            ? updated
            : f,
        ) ?? [],
      )
    },
  })
}

export function useUpdateFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      capabilityName,
      controlName,
      label,
      description,
      status,
      state,
    }: {
      capabilityName: string
      controlName: string
      label: string
      description: string
      status: FlagStatus
      state: boolean
    }) =>
      // Single PATCH call — the server reads the before state, computes a rich
      // diff description, applies all changes, and writes one history entry.
      apiPatch<ControlFlag>(`/api/internal/flags/${capabilityName}/${controlName}`, {
        label,
        description,
        status,
        state,
        updatedBy: 'admin',
      }),
    onSuccess: (updated) => {
      void message.success(`"${updated.controlName}" saved successfully`)
      queryClient.setQueryData<ControlFlag[]>(['flags'], (prev) =>
        prev?.map((f) =>
          f.capabilityName === updated.capabilityName && f.controlName === updated.controlName
            ? updated
            : f,
        ) ?? [],
      )
    },
  })
}

export function useDeleteFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ capabilityName, controlName }: { capabilityName: string; controlName: string }) =>
      // Route through PATCH so the server auto-generates a history entry with
      // a proper diff description (e.g. "State: ON → OFF · Status: active → deleted").
      apiPatch<ControlFlag>(`/api/internal/flags/${capabilityName}/${controlName}`, {
        status: 'deleted',
        state: false,
        updatedBy: 'admin',
      }),
    onSuccess: (updated) => {
      void message.warning(`"${updated.controlName}" has been deleted`)
      queryClient.setQueryData<ControlFlag[]>(['flags'], (prev) =>
        prev?.map((f) =>
          f.capabilityName === updated.capabilityName && f.controlName === updated.controlName
            ? updated
            : f,
        ) ?? [],
      )
    },
  })
}

export function useCreateFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      capabilityName: string
      controlName: string
      label: string
      description: string
      state: boolean
      status: FlagStatus
    }) => apiPost<ControlFlag>('/api/internal/flags', { ...payload, updatedBy: 'admin' }),
    onSuccess: (created) => {
      void message.success(`"${created.controlName}" created under "${created.capabilityName}"`)
      queryClient.setQueryData<ControlFlag[]>(['flags'], (prev) =>
        prev ? [created, ...prev] : [created],
      )
    },
  })
}
