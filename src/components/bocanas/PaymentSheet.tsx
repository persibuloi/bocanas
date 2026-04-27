import React, { useEffect, useState } from 'react'
import { Drawer } from 'vaul'
import { Loader2, X, Utensils, Check } from 'lucide-react'

interface PaymentSheetProps {
  open: boolean
  title: string
  subtitle?: string
  comidas: string[]
  loadingComidas?: boolean
  processing?: boolean
  onConfirm: (comida: string) => void | Promise<void>
  onClose: () => void
}

const PaymentSheet: React.FC<PaymentSheetProps> = ({
  open,
  title,
  subtitle,
  comidas,
  loadingComidas = false,
  processing = false,
  onConfirm,
  onClose,
}) => {
  const [selected, setSelected] = useState('')

  useEffect(() => {
    if (open) setSelected(comidas[0] || '')
  }, [open, comidas])

  return (
    <Drawer.Root open={open} onOpenChange={o => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-3xl bg-white outline-none">
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-gray-200" />

          <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Utensils size={16} />
                </div>
                <h2 className="truncate text-base font-semibold text-gray-900">{title}</h2>
              </div>
              {subtitle && (
                <p className="mt-1 truncate pl-10 text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={processing}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 active:bg-gray-200 disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              ¿Qué comida pagó?
            </p>

            {loadingComidas ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 size={20} className="animate-spin" />
                <span className="ml-2 text-sm">Cargando opciones…</span>
              </div>
            ) : comidas.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">Sin opciones disponibles</p>
            ) : (
              <ul className="space-y-2">
                {comidas.map(c => {
                  const active = selected === c
                  return (
                    <li key={c}>
                      <button
                        onClick={() => setSelected(c)}
                        disabled={processing}
                        className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                          active
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-100 bg-white active:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-900">{c}</span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                            active ? 'border-primary bg-primary' : 'border-gray-300'
                          }`}
                        >
                          {active && <Check size={12} className="text-white" strokeWidth={3} />}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-gray-100 bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              onClick={() => onConfirm(selected)}
              disabled={!selected || processing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-white shadow-md shadow-primary/30 transition-colors active:bg-emerald-700 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Procesando…
                </>
              ) : (
                <>
                  <Check size={18} strokeWidth={3} />
                  Confirmar pago
                </>
              )}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export default PaymentSheet
