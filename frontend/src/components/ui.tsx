import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:opacity-90',
  secondary: 'border border-current bg-transparent hover:bg-black/5',
  danger: 'bg-red-700 text-white hover:bg-red-800',
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center rounded px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

/** Labelled input with its error and hint wired through aria-describedby. */
export function TextField({ label, error, hint, className = '', ...props }: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="min-h-11 rounded border border-black/30 bg-white px-3 py-2 text-black aria-invalid:border-red-700"
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-red-700 bg-red-50 text-red-900',
    success: 'border-green-700 bg-green-50 text-green-900',
    info: 'border-blue-700 bg-blue-50 text-blue-900',
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded border-l-4 p-3 ${styles[tone]}`}>
      {children}
    </div>
  )
}

export function Loading({ label }: { label: string }) {
  return <output className="block py-8 text-center text-muted">{label}</output>
}
