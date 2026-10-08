import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody } from '../../lib/api/client'
import type { CurrentUser, Locale, MeResponse, Role } from '../../lib/api/types'

export const ME_KEY = ['me'] as const

/** Roles that give access to the editorial admin (/admin-app). */
export const STAFF_ROLES: Role[] = ['ROLE_AUTHOR', 'ROLE_DESIGNER', 'ROLE_DATA_PROVIDER']
/** Roles allowed to browse and upload media. */
export const MEDIA_ROLES: Role[] = ['ROLE_AUTHOR', 'ROLE_DESIGNER']

export function hasAnyRole(user: CurrentUser | null | undefined, roles: Role[]): boolean {
  return user != null && roles.some((role) => user.roles.includes(role))
}

export function useCurrentUser() {
  const query = useQuery({
    queryKey: ME_KEY,
    queryFn: () => apiFetch<MeResponse>('/me'),
    staleTime: 5 * 60_000,
  })
  return { ...query, user: query.data?.user ?? null }
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  displayName: string
  locale: Locale
}

function useSetUserOnSuccess() {
  const queryClient = useQueryClient()
  return (data: MeResponse) => {
    // Another user may see other data: drop everything cached, then set the new identity
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'me' })
    queryClient.setQueryData(ME_KEY, data)
  }
}

export function useLogin() {
  const onSuccess = useSetUserOnSuccess()
  return useMutation({
    mutationFn: (input: LoginInput) => apiFetch<MeResponse>('/login', jsonBody('POST', input)),
    onSuccess,
  })
}

export function useRegister() {
  const onSuccess = useSetUserOnSuccess()
  return useMutation({
    mutationFn: (input: RegisterInput) => apiFetch<MeResponse>('/register', jsonBody('POST', input)),
    onSuccess,
  })
}

export function useLogout() {
  const onSuccess = useSetUserOnSuccess()
  return useMutation({
    mutationFn: () => apiFetch<null>('/logout', { method: 'POST' }),
    onSuccess: () => onSuccess({ user: null }),
  })
}
