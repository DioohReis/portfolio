import { useCallback, useEffect, useRef, useState } from 'react'
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
/** Distância, em pixels, em que o mouse já conta como perto de um elemento. */
const NEAR_DISTANCE = 130
/** Depois do zoom o elemento sai do lugar: o mouse pode ir mais longe sem perder o destaque. */
const STAY_DISTANCE = 300

/** Menu do site: a cena da fogueira, com uma etiqueta presa em cada ponto levando a uma seção. */
export function Bonfire({ reducedMotion }: BonfireProps) {
  const lenis = useLenis()
  const [active, setActive] = useState<number | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [points, setPoints] = useState<StagePoint[]>([])
  const [width, setWidth] = useState(0)

  const handleProject = useCallback((next: StagePoint[]) => {
    setPoints(next)
    setWidth(document.documentElement.clientWidth)
  }, [])
  const handleLoaded = useCallback(() => setLoaded(true), [])

  const activeRef = useRef<number | null>(null)
  useEffect(() => {
    activeRef.current = active
  }, [active])

  const focusSpot = useCallback((index: number | null) => {
    setActive((current) => {
      if (current === null && index !== null) playCrackle()
      return index
    })
  }, [])

  // Quando o mouse chega perto de um elemento, a câmera vai até ele.
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const rect = sectionRef.current?.getBoundingClientRect()
      if (!rect || event.pointerType !== 'mouse') return
      if (rect.top > 1 || rect.top < -window.innerHeight * 0.2) return focusSpot(null)
      if (activeRef.current !== null) {
        const point = points[activeRef.current]
        if (point && Math.hypot(point.x - event.clientX, point.y - event.clientY) < STAY_DISTANCE) return
      }
      let nearest: number | null = null
      let best = NEAR_DISTANCE
      points.forEach((point, index) => {
        const distance = Math.hypot(point.x - event.clientX, point.y - event.clientY)
        if (distance < best) {
          best = distance
          nearest = index
        }
      })
      focusSpot(nearest)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [points, focusSpot])

  // Título e etiquetas só aparecem com a cena parada; somem enquanto a câmera se move.
  useEffect(() => {
    const onScroll = () => {
      const rect = sectionRef.current?.getBoundingClientRect()
      const overlay = overlayRef.current
      if (!rect || !overlay) return
      const height = window.innerHeight
      const visible = Math.max(
        0,
        1 - Math.max(rect.top / (height * 0.3), (-rect.top - height * 0.05) / (height * 0.25), 0),
      )
      overlay.style.opacity = String(visible)
      overlay.style.visibility = visible === 0 ? 'hidden' : 'visible'
      // Enquanto sobe, o topo do cenário se desfaz em preto, sem borda reta.
      if (veilRef.current) veilRef.current.style.opacity = String(Math.min(Math.max(rect.top / (height * 0.15), 0), 1))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    focusSpot(null)
    scrollToSection(lenis, id)
  }
  // Com o elemento em destaque, um clique na cena leva à seção dele.
  const enterActive = () => {
    if (active === null) return
    const { id } = BONFIRE_SPOTS[active]
    focusSpot(null)
    scrollToSection(lenis, id)
  }

  return (
    <section ref={sectionRef} id="fogueira" className="relative z-10 -mt-[40svh] h-[170svh]">
      {/* A borda de cima se desfaz em preto: o Home some atrás dela. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full h-[30svh] bg-linear-to-t from-ink to-transparent" />
      <div
        onClick={enterActive}
        className={`sticky top-0 h-svh min-h-140 overflow-hidden bg-ink ${active !== null ? 'cursor-pointer' : ''}`}
      >
        <Bonfire3D
          hot={active !== null}
          focus={active === null ? null : BONFIRE_SPOTS[active].target}
          reducedMotion={reducedMotion}
          anchors={ANCHORS}
          onProject={handleProject}
          onLoaded={handleLoaded}
        />

        <div
          ref={veilRef}
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-ink to-transparent"
        />

        <div ref={overlayRef}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-ink/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-ink to-transparent" />

          <div
            className={`pointer-events-none absolute top-24 left-6 transition-opacity duration-500 lg:top-28 lg:left-20 ${
              active !== null ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <p className="text-xs opacity-60">{'{ menu }'}</p>
            <h2 className="mt-2 font-gothic text-4xl lg:text-6xl">Fogueira</h2>
            <p className="mt-2 max-w-52 text-sm opacity-60">Aproxime-se de cada elemento e clique para entrar.</p>
          </div>

          {/* As etiquetas repetem a lista de baixo, que é a versão acessível do menu. */}
          <div
            aria-hidden="true"
            className={`hidden transition-opacity duration-500 landscape:block ${loaded && active === null ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            {points.map((point, index) => {
              const spot = BONFIRE_SPOTS[index]
              const left = Math.min(Math.max(point.x, LABEL_MARGIN), width - LABEL_MARGIN)
              return (
                <a
                  key={spot.id}
                  href={`#${spot.id}`}
                  tabIndex={-1}
                  onClick={(event) => {
                    event.stopPropagation()
                    go(event, spot.id)
                  }}
                  onMouseEnter={() => focusSpot(index)}
                  style={{ left, top: point.y }}
                  className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
                >
                  <span className="border border-paper/30 bg-ink/80 px-3 py-1.5 text-sm whitespace-nowrap">
                    {spot.label} →
                  </span>
                  <span className="h-5 w-px bg-paper/40" />
                  <span className="size-1.5 translate-y-1/2 rounded-full bg-paper" />
                </a>
              )
            })}
          </div>

          <p
            aria-hidden="true"
            className={`pointer-events-none absolute top-24 left-6 transition-opacity duration-500 lg:top-28 lg:left-20 ${
              active !== null ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="block font-gothic text-5xl lg:text-7xl">
              {active !== null && BONFIRE_SPOTS[active].label}
            </span>
            <span className="mt-2 block text-sm opacity-70">{'{ clique para entrar }'}</span>
          </p>

          <div className="absolute inset-x-6 bottom-6 flex flex-col gap-3 lg:inset-x-20 lg:bottom-8 lg:flex-row lg:items-end lg:justify-between">
            <nav aria-label="Menu da fogueira">
              <ul className="flex flex-wrap gap-x-6 gap-y-1">
                {BONFIRE_SPOTS.map((spot, index) => (
                  <li key={spot.id}>
                    <a
                      href={`#${spot.id}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        go(event, spot.id)
                      }}
                      onMouseEnter={() => focusSpot(index)}
                      onFocus={() => focusSpot(index)}
                      onBlur={() => focusSpot(null)}
                      className={`text-lg transition-[color,opacity] duration-200 outline-none ${
                        active === index ? 'text-ember opacity-100' : 'opacity-70'
                      }`}
                    >
                      <span className="mr-1.5 text-[10px] opacity-60">{String(index + 1).padStart(2, '0')}</span>
                      {spot.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <p className="text-[10px] leading-relaxed opacity-40 lg:text-right">
              {MODEL_CREDITS.map((credit) => (
                <a
                  key={credit.url}
                  href={credit.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="block hover:underline"
                >
                  {credit.title} · {credit.author} · CC BY 4.0
                </a>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
