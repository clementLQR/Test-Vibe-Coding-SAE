import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface DialogProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Modal built on the native <dialog>: focus trap, Escape key and inert background
 * come from the browser.
 */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      // Fallback for engines without showModal (older browsers, jsdom): a non-modal open dialog
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(72rem,calc(100%-1rem))] max-h-[calc(100%-1rem)] rounded-block bg-page p-0 text-ink backdrop:bg-black/50"
    >
      {open && (
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="font-heading text-2xl font-bold">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded text-2xl hover:bg-black/5">
              <span aria-hidden="true">×</span>
              <span className="sr-only">{t('common.close')}</span>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
