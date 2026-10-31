import { useCallback, useEffect, useState } from 'react'
import { CrtIntro } from './components/intro/CrtIntro'
import { Header } from './components/layout/Header'
import { LenisContext, useCreateLenis } from './hooks/useLenis'
import { useReducedMotion } from './hooks/useReducedMotion'
import { About } from './sections/About'
import { Bonfire } from './sections/Bonfire'
import { Certificates } from './sections/Certificates'
import { Contact } from './sections/Contact'
import { Home } from './sections/Home'
import { Projects } from './sections/Projects'

/**
 * Fluxo da entrada:
 * 1. TV antiga carregando (sempre que a página abre ou recarrega).
 * 2. Clique → a TV ocupa a tela → as partículas começam como chiado (started = true).
 * 3. A TV some (introDone = true) e as partículas se montam em "Start Hello World".
 */
export default function App() {
  const reducedMotion = useReducedMotion()
  const [particlesReady, setParticlesReady] = useState(false)
  const [started, setStarted] = useState(false)
  const [introDone, setIntroDone] = useState(false)

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
      <main>
        <Home started={started} reducedMotion={reducedMotion} onParticlesReady={handleParticlesReady} />
        <Bonfire reducedMotion={reducedMotion} />
        <About />
        <Projects />
        <Certificates />
        <Contact />
      </main>
    </LenisContext.Provider>
  )
}
