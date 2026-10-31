import { useEffect, useRef, useState } from 'react'
import { ATTRIBUTES, INVENTORY, STATUS_ROWS, STATUS_TEXT } from '../../data/about'
import { TIMELINE } from '../../data/timeline'

interface BonfireMenuProps {
  onClose: () => void
}

const OPTIONS = ['Status', 'Atributos', 'Jornada', 'Inventário'] as const
type Option = (typeof OPTIONS)[number]

/** Menu aberto ao descansar na fogueira: lista à esquerda e detalhes da opção à direita. */
export function BonfireMenu({ onClose }: BonfireMenuProps) {
  const [active, setActive] = useState<Option>('Status')
  const firstRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstRef.current?.focus({ preventScroll: true })
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-label="Menu da fogueira"
      className="absolute inset-0 grid grid-rows-[auto_1fr] gap-6 bg-ink/70 px-6 pt-24 pb-8 md:grid-cols-[minmax(13rem,18rem)_1fr] md:grid-rows-1 md:gap-16 lg:px-20 lg:pt-32 lg:pb-16"
    >
      <nav aria-label="Opções da fogueira">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 md:flex-col md:gap-3">
          {OPTIONS.map((option, index) => (
            <li key={option}>
              <button
                ref={index === 0 ? firstRef : undefined}
                type="button"
                aria-current={active === option}
                onClick={() => setActive(option)}
                onFocus={() => setActive(option)}
                onMouseEnter={() => setActive(option)}
                className={`cursor-pointer text-lg tracking-[0.04em] transition-opacity duration-200 outline-none md:text-2xl ${
                  active === option ? 'text-ember opacity-100' : 'opacity-55 hover:opacity-100'
                }`}
              >
                {option}
              </button>
            </li>
          ))}
          <li className="md:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-lg tracking-[0.04em] opacity-55 transition-opacity duration-200 outline-none hover:opacity-100 focus-visible:opacity-100 md:text-2xl"
            >
              Sair da fogueira
            </button>
          </li>
        </ul>
      </nav>

      <div
        data-lenis-prevent
        className="min-h-0 overflow-y-auto border-t border-paper/20 pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-12"
      >
        <h3 className="font-gothic text-4xl lg:text-6xl">{active}</h3>
        <div className="mt-6 max-w-2xl lg:mt-8">
          {active === 'Status' && (
            <>
              <dl className="grid max-w-md grid-cols-[auto_1fr] gap-x-8 gap-y-2">
                {STATUS_ROWS.map((row) => (
                  <div key={row.label} className="col-span-2 grid grid-cols-subgrid border-b border-paper/10 pb-2">
                    <dt className="opacity-55">{row.label}</dt>
                    <dd className="text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 leading-relaxed opacity-70">{STATUS_TEXT}</p>
            </>
          )}

          {active === 'Atributos' && (
            <ul className="grid max-w-md gap-2">
              {ATTRIBUTES.map((attribute) => (
                <li key={attribute} className="border-b border-paper/10 pb-2">
                  {attribute}
                </li>
              ))}
            </ul>
          )}

          {active === 'Jornada' &&
            (TIMELINE.length > 0 ? (
              <ol className="grid gap-6">
                {TIMELINE.map((item) => (
                  <li key={item.title}>
                    <p className="font-mono text-xs uppercase opacity-45">{item.period}</p>
                    <h4 className="mt-1 text-xl font-semibold">{item.title}</h4>
                    <p className="mt-2 leading-relaxed opacity-70">{item.description}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="leading-relaxed opacity-70">Em construção: aqui entra a sua trajetória.</p>
            ))}

          {active === 'Inventário' && (
            <ul className="grid gap-5">
              {INVENTORY.map((item) => (
                <li key={item.name}>
                  <h4 className="text-xl font-semibold">{item.name}</h4>
                  <p className="mt-1 leading-relaxed opacity-70">{item.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
