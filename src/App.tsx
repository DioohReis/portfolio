import { useCallback, useEffect, useState } from 'react'
import { CrtIntro } from './components/intro/CrtIntro'
import { Header } from './components/layout/Header'
import { LenisContext, useCreateLenis } from './hooks/useLenis'
import { useReducedMotion } from './hooks/useReducedMotion'
import { INTRO_SEEN_KEY, session } from './lib/storage'
import { About } from './sections/About'
import { Certificates } from './sections/Certificates'
import { Contact } from './sections/Contact'
import { Home } from './sections/Home'
import { Projects } from './sections/Projects'

/**
 * Fluxo da entrada:
 * 1. TV antiga carregando (só na primeira visita da sessão).
 * 2. Clique → a TV ocupa a tela → as partículas começam como chiado (started = true).
 * 3. A TV some (introDone = true) e as partículas se montam em "Start Hello World".
 */
export default function App() {
  const reducedMotion = useReducedMotion()
  const [skipIntro] = useState(() => session.get(INTRO_SEEN_KEY) === '1')
  const [particlesReady, setParticlesReady] = useState(false)
  const [started, setStarted] = useState(skipIntro)
  const [introDone, setIntroDone] = useState(skipIntro)

  const lenis = useCreateLenis(!reducedMotion)

  // Sempre começa do topo e trava a rolagem enquanto a TV está aberta.
  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const locked = !started
    document.body.classList.toggle('is-locked', locked)
    if (locked) lenis?.stop()
    else lenis?.start()
  }, [started, lenis])

  const handleEnter = useCallback(() => {
    session.set(INTRO_SEEN_KEY, '1')
    setStarted(true)
  }, [])
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
      <main>
        <Home started={started} reducedMotion={reducedMotion} onParticlesReady={handleParticlesReady} />
        <About />
        <Projects />
        <Certificates />
        <Contact />
      </main>
    </LenisContext.Provider>
  )
}
