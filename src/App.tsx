import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { CrtIntro } from './components/intro/CrtIntro'
import { Header } from './components/layout/Header'
import { LenisContext, scrollToSection, useCreateLenis } from './hooks/useLenis'
import { useReducedMotion } from './hooks/useReducedMotion'
import { followLink, useRoute } from './hooks/useRoute'
import { useSectionSnap } from './hooks/useSectionSnap'
import { About } from './sections/About'
import { Bonfire } from './sections/Bonfire'
import { Certificates } from './sections/Certificates'
import { Contact } from './sections/Contact'
import { Home } from './sections/Home'
import { Projects } from './sections/Projects'

/** Páginas além da inicial, pelo caminho. */
const PAGES: Record<string, (props: { reducedMotion: boolean }) => ReactElement> = {
  '/sobre': ({ reducedMotion }) => <About reducedMotion={reducedMotion} />,
  '/projetos': () => <Projects />,
  '/certificados': () => <Certificates />,
  '/contato': () => <Contact />,
}

const DEFAULT_TITLE = 'Diogo A Reis — Portfólio'
const PAGE_TITLES: Record<string, string> = {
  '/sobre': 'Sobre — Diogo A Reis',
  '/projetos': 'Projetos — Diogo A Reis',
  '/certificados': 'Certificados — Diogo A Reis',
  '/contato': 'Contato — Diogo A Reis',
}

/** Seções de tela cheia em que a rolagem encaixa, sem parar no meio do caminho. */
const SNAP_SECTIONS = ['home', 'fogueira']

/**
 * Fluxo da entrada:
 * 1. TV antiga carregando (sempre que a página abre ou recarrega).
 * 2. Clique → a TV ocupa a tela → as partículas começam como chiado (started = true).
 * 3. A TV some (introDone = true) e as partículas se montam em "Start Hello World".
 * Quem abre direto outra página não passa pela TV.
 */
export default function App() {
  const reducedMotion = useReducedMotion()
  const [particlesReady, setParticlesReady] = useState(false)
  const { path, hash } = useRoute()
  const isHome = !(path in PAGES)
  const [started, setStarted] = useState(!isHome)
  const [introDone, setIntroDone] = useState(!isHome)

  const lenis = useCreateLenis(!reducedMotion)
  useSectionSnap(lenis, SNAP_SECTIONS, started && isHome, reducedMotion)

  // Sempre começa do topo e trava a rolagem enquanto a TV está aberta.
  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  // Página nova começa do topo (ou na âncora); dentro da mesma página, a rolagem é suave.
  const previousPath = useRef(path)
  useEffect(() => {
    const samePage = previousPath.current === path
    previousPath.current = path
    document.title = PAGE_TITLES[path] ?? DEFAULT_TITLE
    const frame = requestAnimationFrame(() => {
      lenis?.resize()
      if (samePage && hash) scrollToSection(lenis, hash)
      else if (samePage) {
        if (lenis) lenis.scrollTo(0)
        else window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        const target = hash ? document.getElementById(hash) : null
        const top = target ? target.getBoundingClientRect().top + window.scrollY : 0
        if (lenis) lenis.scrollTo(top, { immediate: true, force: true })
        else window.scrollTo(0, top)
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [path, hash, lenis])

  useEffect(() => {
    const locked = !started
    document.body.classList.toggle('is-locked', locked)
    if (locked) lenis?.stop()
    else lenis?.start()
  }, [started, lenis])

  const handleEnter = useCallback(() => setStarted(true), [])
  const handleIntroFinished = useCallback(() => setIntroDone(true), [])
  const handleParticlesReady = useCallback(() => setParticlesReady(true), [])

  return (
    <LenisContext.Provider value={lenis}>
      {!introDone && (
        <CrtIntro
          assetsReady={particlesReady}
          reducedMotion={reducedMotion}
          onEnter={handleEnter}
          onFinished={handleIntroFinished}
        />
      )}
      <Header hidden={!started} />
      <main key={path} className="animate-page-in">
        {isHome ? (
          <>
            <Home started={started} reducedMotion={reducedMotion} onParticlesReady={handleParticlesReady} />
            <Bonfire reducedMotion={reducedMotion} />
          </>
        ) : (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-20 z-30 lg:top-24">
              <div className="mx-auto max-w-360 px-6 lg:px-20">
                <a
                  href="/#fogueira"
                  onClick={(event) => followLink(event, '/#fogueira')}
                  className="pointer-events-auto text-sm tracking-[0.04em] opacity-60 transition-opacity hover:opacity-100"
                >
                  ← Voltar para a fogueira
                </a>
              </div>
            </div>
            {PAGES[path]({ reducedMotion })}
          </>
        )}
      </main>
    </LenisContext.Provider>
  )
}
