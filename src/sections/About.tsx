import { useCallback, useRef, useState } from 'react'
import { Avatar3D } from '../components/three/Avatar3D'
import { Bonfire3D } from '../components/three/Bonfire3D'
import { BonfireMenu } from '../components/ui/BonfireMenu'
import { STATUS_ROWS } from '../data/about'
import { SITE_OWNER } from '../data/navigation'
import { playCrackle } from '../lib/crackle'

interface AboutProps {
  reducedMotion: boolean
}

export function About({ reducedMotion }: AboutProps) {
  const [hot, setHot] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const restRef = useRef<HTMLButtonElement>(null)

  const heat = () => {
    if (!hot) playCrackle()
    setHot(true)
  }
  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    restRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <section id="sobre" className="border-t border-line">
      <div className="relative h-svh min-h-140 overflow-hidden">
        <p
          className="absolute inset-x-0 top-[16svh] text-center font-gothic text-[23vw] leading-none select-none md:top-[8svh]"
          aria-hidden="true"
        >
          SOBRE
        </p>

        <Avatar3D url="/models/diogo.glb" reducedMotion={reducedMotion} className="cursor-pointer">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-t from-ink to-transparent" />
          <p className="absolute bottom-6 left-6 font-gothic text-2xl sm:text-3xl lg:bottom-10 lg:left-20 lg:text-5xl">
            {SITE_OWNER}
          </p>
          <button
            type="button"
            className="absolute right-6 bottom-7 cursor-pointer font-mono text-xs opacity-60 transition-opacity hover:opacity-100 lg:right-20 lg:bottom-11"
          >
            {'{ clique para girar }'}
          </button>
        </Avatar3D>
      </div>

      <div className="relative h-svh min-h-140 overflow-hidden bg-ink">
        <h2 className="sr-only">Sobre mim</h2>
        <Bonfire3D
          hot={hot || menuOpen}
          reducedMotion={reducedMotion}
          className={`transition-opacity duration-700 ${menuOpen ? 'opacity-35' : 'opacity-100'}`}
        />

        {!menuOpen && (
          <>
            <button
              ref={restRef}
              type="button"
              aria-label="Descansar na fogueira e abrir informações sobre mim"
              onClick={() => setMenuOpen(true)}
              onMouseEnter={heat}
              onMouseLeave={() => setHot(false)}
              onFocus={heat}
              onBlur={() => setHot(false)}
              className="absolute top-1/2 left-1/2 h-3/4 w-[min(80vw,30rem)] -translate-x-1/2 -translate-y-1/2 cursor-pointer outline-none"
            />

            <div
              className={`pointer-events-none absolute inset-x-0 bottom-[3%] text-center transition-opacity duration-500 [@media(hover:none)]:opacity-100 ${
                hot ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="border-y border-paper/25 bg-linear-to-r from-transparent via-ink/85 to-transparent py-3">
                <p className="text-2xl tracking-[0.12em]">Descansar</p>
              </div>
              <p className="mt-3 text-sm opacity-70">
                {STATUS_ROWS.map((row) => row.value)
                  .slice(0, 2)
                  .join(' · ')}
              </p>
            </div>

            <p
              className={`pointer-events-none absolute inset-x-0 bottom-7 text-center font-mono text-xs transition-opacity duration-500 [@media(hover:none)]:opacity-0 ${
                hot ? 'opacity-0' : 'opacity-60'
              }`}
            >
              {'{ aproxime-se da chama }'}
            </p>
          </>
        )}

        {menuOpen && <BonfireMenu onClose={closeMenu} />}
      </div>
    </section>
  )
}
