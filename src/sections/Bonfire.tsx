import { useCallback, useState } from 'react'
import type { MouseEvent } from 'react'
import { Bonfire3D } from '../components/three/Bonfire3D'
import { MODEL_CREDITS } from '../data/about'
import { BONFIRE_SPOTS } from '../data/navigation'
import { scrollToSection, useLenis } from '../hooks/useLenis'
import { playCrackle } from '../lib/crackle'
import type { StagePoint } from '../lib/bonfire/BonfireStage'

interface BonfireProps {
  reducedMotion: boolean
}

const ANCHORS = BONFIRE_SPOTS.map((spot) => spot.anchor)
/** Metade da largura das etiquetas: elas não passam da borda da tela. */
const LABEL_MARGIN = 56

/** Menu do site: a cena da fogueira, com uma etiqueta presa em cada ponto levando a uma seção. */
export function Bonfire({ reducedMotion }: BonfireProps) {
  const lenis = useLenis()
  const [hot, setHot] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [points, setPoints] = useState<StagePoint[]>([])
  const [width, setWidth] = useState(0)

  const handleProject = useCallback((next: StagePoint[]) => {
    setPoints(next)
    setWidth(document.documentElement.clientWidth)
  }, [])
  const handleLoaded = useCallback(() => setLoaded(true), [])

  const heat = () => {
    if (!hot) playCrackle()
    setHot(true)
  }
  const cool = () => setHot(false)
  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    scrollToSection(lenis, id)
  }

  return (
    <section id="fogueira" className="relative h-svh min-h-140 overflow-hidden border-t border-line bg-ink">
      <Bonfire3D
        hot={hot}
        reducedMotion={reducedMotion}
        anchors={ANCHORS}
        onProject={handleProject}
        onLoaded={handleLoaded}
      />

      <div className="pointer-events-none absolute top-24 left-6 lg:top-28 lg:left-20">
        <p className="font-mono text-xs opacity-60">{'{ menu }'}</p>
        <h2 className="mt-2 font-gothic text-4xl lg:text-6xl">Fogueira</h2>
        <p className="mt-2 max-w-52 text-sm opacity-60">Aproxime-se. Cada marca leva a uma parte do portfólio.</p>
      </div>

      {/* As etiquetas repetem a lista de baixo, que é a versão acessível do menu. */}
      <div aria-hidden="true" className={`transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        {points.map((point, index) => {
          const spot = BONFIRE_SPOTS[index]
          const left = Math.min(Math.max(point.x, LABEL_MARGIN), width - LABEL_MARGIN)
          return (
            <a
              key={spot.id}
              href={`#${spot.id}`}
              tabIndex={-1}
              onClick={(event) => go(event, spot.id)}
              onMouseEnter={heat}
              onMouseLeave={cool}
              style={{ left, top: point.y }}
              className="group absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
            >
              <span className="border border-paper/30 bg-ink/80 px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-200 group-hover:border-ember group-hover:text-ember">
                {spot.label} →
              </span>
              <span className="h-5 w-px bg-paper/40 transition-colors duration-200 group-hover:bg-ember" />
              <span className="size-1.5 translate-y-1/2 rounded-full bg-paper transition-colors duration-200 group-hover:bg-ember" />
            </a>
          )
        })}
      </div>

      <div className="absolute inset-x-6 bottom-6 flex flex-col gap-3 lg:inset-x-20 lg:bottom-8 lg:flex-row lg:items-end lg:justify-between">
        <nav aria-label="Menu da fogueira">
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {BONFIRE_SPOTS.map((spot, index) => (
              <li key={spot.id}>
                <a
                  href={`#${spot.id}`}
                  onClick={(event) => go(event, spot.id)}
                  onMouseEnter={heat}
                  onMouseLeave={cool}
                  onFocus={heat}
                  onBlur={cool}
                  className="text-lg opacity-70 transition-[color,opacity] duration-200 outline-none hover:text-ember hover:opacity-100 focus-visible:text-ember focus-visible:opacity-100"
                >
                  <span className="mr-1.5 font-mono text-[10px] opacity-60">{String(index + 1).padStart(2, '0')}</span>
                  {spot.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="font-mono text-[10px] leading-relaxed opacity-40 lg:text-right">
          {MODEL_CREDITS.map((credit) => (
            <a key={credit.url} href={credit.url} target="_blank" rel="noreferrer" className="block hover:underline">
              {credit.title} · {credit.author} · CC BY 4.0
            </a>
          ))}
        </p>
      </div>
    </section>
  )
}
