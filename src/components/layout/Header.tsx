import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { NAV_ITEMS, SITE_OWNER } from '../../data/navigation'
import { useActiveSection, useScrolledPast } from '../../hooks/useActiveSection'
import { scrollToSection, useLenis } from '../../hooks/useLenis'

interface HeaderProps {
  /** Fica escondido enquanto a tela da TV está aberta. */
  hidden: boolean
}

export function Header({ hidden }: HeaderProps) {
  const lenis = useLenis()
  const active = useActiveSection(NAV_ITEMS.map((i) => i.id))
  const solid = useScrolledPast(0.6)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (menuOpen) lenis?.stop()
    else lenis?.start()
    document.body.style.overflow = menuOpen ? 'hidden' : ''
  }, [menuOpen, lenis])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setMenuOpen(false)
    // espera o menu do celular liberar o scroll antes de rolar
    requestAnimationFrame(() => scrollToSection(lenis, id))
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,opacity,translate] duration-700 ease-out-soft ${
        solid && !menuOpen ? 'border-line bg-ink/70 backdrop-blur-md' : 'border-transparent'
      } ${hidden ? 'pointer-events-none -translate-y-3 opacity-0' : ''}`}
    >
      <div className="mx-auto flex h-18 max-w-360 items-center justify-between px-6 lg:h-20 lg:px-20">
        <a
          href="#home"
          onClick={(e) => go(e, 'home')}
          aria-label={`${SITE_OWNER}, voltar ao início`}
          className="relative z-60 font-gothic text-2xl leading-none tracking-[0.02em] whitespace-nowrap transition-opacity duration-200 hover:opacity-75 lg:text-[30px]"
        >
          {SITE_OWNER.toUpperCase()}
        </a>

        <nav aria-label="Principal" className="hidden items-center gap-9 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => go(e, item.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`relative text-[17px] font-medium tracking-[-0.02em] transition-opacity duration-200 hover:opacity-100 ${
                  isActive ? 'opacity-100' : 'opacity-55'
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-2.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-paper transition-transform duration-300 ease-out-soft ${
                    isActive ? 'scale-100' : 'scale-0'
                  }`}
                />
              </a>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          className="relative z-60 size-10 cursor-pointer lg:hidden"
        >
          <span
            className={`absolute inset-x-2.25 h-[1.5px] bg-paper transition-all duration-400 ease-out-soft ${
              menuOpen ? 'top-4.75 rotate-45' : 'top-3.75'
            }`}
          />
          <span
            className={`absolute inset-x-2.25 h-[1.5px] bg-paper transition-all duration-400 ease-out-soft ${
              menuOpen ? 'top-4.75 -rotate-45' : 'top-5.75'
            }`}
          />
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-55 flex h-dvh flex-col justify-center gap-1.5 bg-ink px-6 transition-opacity duration-400 ease-out-soft lg:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!menuOpen}
      >
        {NAV_ITEMS.map((item, i) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => go(e, item.id)}
            tabIndex={menuOpen ? 0 : -1}
            style={{ transitionDelay: menuOpen ? `${80 + i * 50}ms` : '0ms' }}
            className={`text-[44px] font-semibold tracking-[-0.04em] transition-[opacity,translate] duration-600 ease-out-soft ${
              menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <span className="inline-block w-9 align-middle text-[13px] font-medium tracking-normal tabular-nums opacity-40">
              {String(i + 1).padStart(2, '0')}
            </span>
            {item.label}
          </a>
        ))}
      </div>
    </header>
  )
}
