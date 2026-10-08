import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Loading } from '../../components/ui'
import { apiFetch, errorMessageOf, mergePatch } from '../../lib/api/client'
import { ASSIGNABLE_ROLES, type Role, type UserSummary } from '../../lib/api/types'

const USERS_KEY = ['users'] as const

export function UsersPage() {
  const { t } = useTranslation()
  const users = useQuery({ queryKey: USERS_KEY, queryFn: () => apiFetch<UserSummary[]>('/users') })

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">{t('admin.nav.users')}</h1>
      <p>{t('users.intro')}</p>
      {users.isPending && <Loading label={t('common.loading')} />}
      {users.isError && <Alert>{errorMessageOf(users.error, t('common.error'))}</Alert>}
      {users.isSuccess && (
        <ul className="space-y-4">
          {users.data.map((user) => (
            <li key={user.id}>
              <UserRolesForm user={user} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function UserRolesForm({ user }: { user: UserSummary }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [roles, setRoles] = useState<Role[]>(user.roles.filter((role) => role !== 'ROLE_SUBSCRIBER'))
  const save = useMutation({
    mutationFn: (newRoles: Role[]) => apiFetch<UserSummary>(`/users/${user.id}`, mergePatch({ roles: newRoles })),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })

  const toggle = (role: Role) =>
    setRoles((current) => (current.includes(role) ? current.filter((r) => r !== role) : [...current, role]))

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(roles)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-block bg-block p-4 text-block-ink">
      <div>
        <p className="font-semibold">{user.displayName}</p>
        <p className="text-sm break-all">{user.email}</p>
        <p className="text-sm text-muted">
          {t('users.since', { date: new Date(user.createdAt).toLocaleDateString(i18n.language) })}
        </p>
      </div>
      <fieldset>
        <legend className="sr-only">{t('users.rolesOf', { name: user.displayName })}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {ASSIGNABLE_ROLES.map((role) => (
            <label key={role} className="flex min-h-11 items-center gap-2">
              <input type="checkbox" className="size-5" checked={roles.includes(role)} onChange={() => toggle(role)} />
              {t(`roles.${role}`)}
            </label>
          ))}
        </div>
      </fieldset>
      {save.isError && <Alert>{errorMessageOf(save.error, t('common.error'))}</Alert>}
      {save.isSuccess && <Alert tone="success">{t('users.saved')}</Alert>}
      <Button type="submit" variant="secondary" disabled={save.isPending}>
        {t('users.save')}
      </Button>
    </form>
  )
}
