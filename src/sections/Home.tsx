import { ParticleText } from '../components/three/ParticleText'
import { HERO_LINES } from '../data/navigation'

interface HomeProps {
  started: boolean
  reducedMotion: boolean
  onParticlesReady: () => void
}

export function Home({ started, reducedMotion, onParticlesReady }: HomeProps) {
  return (
    <section id="home" className="relative h-svh overflow-hidden" aria-label="Início">
      <h1 className="sr-only">Diogo A Reis — Start Hello World</h1>
      <ParticleText lines={HERO_LINES} started={started} reducedMotion={reducedMotion} onReady={onParticlesReady} />
      <p
        className={`pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 text-[13px] tracking-[0.06em] whitespace-nowrap transition-opacity delay-500 duration-1000 ${
          started ? 'opacity-45' : 'opacity-0'
        }`}
      >
        Arraste para misturar · role para baixo
      </p>
    </section>
  )
}
