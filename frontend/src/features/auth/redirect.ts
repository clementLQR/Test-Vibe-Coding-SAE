/**
 * Validates the ?redirect= target: only same-site paths are accepted (no open redirect).
 */
export function safeRedirect(target: string | null, fallback = '/'): string {
  if (target === null || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return fallback
  }
  return target
}

/** The EasyAdmin back-office (/admin) is served by Symfony, not by the React router. */
export function isServerPage(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/') || path.startsWith('/admin?')
}
