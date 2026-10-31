import { useEffect, useRef } from 'react'
import { Avatar3D } from '../components/three/Avatar3D'
import { ParticleText } from '../components/three/ParticleText'
import { HERO_LINES } from '../data/navigation'

interface HomeProps {
  started: boolean
  reducedMotion: boolean
  onParticlesReady: () => void
}

export function Home({ started, reducedMotion, onParticlesReady }: HomeProps) {
  const stageRef = useRef<HTMLDivElement>(null)

  // O Home fica parado e vai sumindo enquanto a fogueira sobe por cima dele.
  useEffect(() => {
    const onScroll = () => {
      const stage = stageRef.current
      if (!stage) return
      const progress = Math.min(window.scrollY / (window.innerHeight * 0.7), 1)
      stage.style.opacity = String(1 - progress)
      if (!reducedMotion) stage.style.transform = `scale(${1 - progress * 0.08})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [reducedMotion])

  return (
    <section id="home" className="relative h-[170svh]" aria-label="Início">
      <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden">
        <h1 className="sr-only">Diogo A Reis — Start Hello World</h1>
        <ParticleText lines={HERO_LINES} started={started} reducedMotion={reducedMotion} onReady={onParticlesReady} />
        <div
          className={`absolute inset-x-0 bottom-0 h-[58%] transition-opacity delay-700 duration-1000 landscape:inset-x-auto landscape:top-0 landscape:right-[3%] landscape:h-full landscape:w-[44%] ${
            started ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <Avatar3D url="/models/diogo.glb" reducedMotion={reducedMotion} className="cursor-pointer">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-t from-ink to-transparent" />
            <button
              type="button"
              className="absolute right-0 bottom-7 hidden cursor-pointer text-xs opacity-60 transition-opacity hover:opacity-100 landscape:block"
            >
              {'{ clique para girar }'}
            </button>
          </Avatar3D>
        </div>
        <p
          className={`pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 text-[13px] tracking-[0.06em] whitespace-nowrap transition-opacity delay-500 duration-1000 ${
            started ? 'opacity-45' : 'opacity-0'
          }`}
        >
          Passe por cima para misturar · role para baixo
        </p>
      </div>
    </section>
  )
}
