import { useEffect, useRef } from 'react'
import type { BonfireStage, StagePoint } from '../../lib/bonfire/BonfireStage'

interface Bonfire3DProps {
  /** Mouse em cima ou foco do teclado: o fogo cresce. */
  hot: boolean
  /** Elemento da cena em destaque. */
  focus: string | null
  reducedMotion: boolean
  anchors: [number, number, number][]
  onProject: (points: StagePoint[]) => void
  onLoaded: () => void
  className?: string
}

export function Bonfire3D({ hot, focus, reducedMotion, anchors, onProject, onLoaded, className = '' }: Bonfire3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<BonfireStage | null>(null)
  const hotRef = useRef(hot)

  // O código da fogueira só é baixado quando ela se aproxima da tela.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        import('../../lib/bonfire/BonfireStage').then(({ BonfireStage }) => {
          if (cancelled) return
          stageRef.current = new BonfireStage(container, { reducedMotion, anchors, onProject, onLoaded })
          stageRef.current.setHot(hotRef.current)
        })
      },
      { rootMargin: '100% 0px' },
    )
    observer.observe(container)

    return () => {
      cancelled = true
      observer.disconnect()
      stageRef.current?.dispose()
      stageRef.current = null
    }
  }, [reducedMotion, anchors, onProject, onLoaded])

  useEffect(() => {
    hotRef.current = hot
    stageRef.current?.setHot(hot)
  }, [hot])

  useEffect(() => {
    stageRef.current?.setFocus(focus)
  }, [focus])

  return <div ref={containerRef} className={`absolute inset-0 ${className}`} aria-hidden="true" />
}
