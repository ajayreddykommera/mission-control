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
import { apiFetch, apiPatch, apiPut, apiPost } from '@utils/api'
import type { ControlFlag, FlagStatus } from '@types'

export function useFlags(capabilityName?: string) {
  const path = capabilityName ? `/api/flags/${capabilityName}` : '/api/flags'
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
      apiPatch<ControlFlag>(`/api/flags/${capabilityName}/${controlName}`, {}),
    onSuccess: (updated) => {
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
    }: {
      capabilityName: string
      controlName: string
      label: string
      description: string
      status: FlagStatus
    }) =>
      apiPut<ControlFlag>(`/api/flags/${capabilityName}/${controlName}`, {
        label,
        description,
        status,
        updatedBy: 'admin',
      }),
    onSuccess: (updated) => {
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
      apiPut<ControlFlag>(`/api/flags/${capabilityName}/${controlName}`, {
        status: 'deleted',
        state: false,
        updatedBy: 'admin',
      }),
    onSuccess: (updated) => {
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
    }) => apiPost<ControlFlag>('/api/flags', { ...payload, updatedBy: 'admin' }),
    onSuccess: (created) => {
      queryClient.setQueryData<ControlFlag[]>(['flags'], (prev) =>
        prev ? [created, ...prev] : [created],
      )
    },
  })
}
