import { useEffect, useRef } from 'react'
import type { BonfireStage } from '../../lib/bonfire/BonfireStage'

interface Bonfire3DProps {
  /** Mouse em cima ou foco do teclado: o fogo cresce. */
  hot: boolean
  reducedMotion: boolean
  className?: string
}

export function Bonfire3D({ hot, reducedMotion, className = '' }: Bonfire3DProps) {
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
          stageRef.current = new BonfireStage(container, reducedMotion)
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
  }, [reducedMotion])

  useEffect(() => {
    hotRef.current = hot
    stageRef.current?.setHot(hot)
  }, [hot])

  return <div ref={containerRef} className={`absolute inset-0 ${className}`} aria-hidden="true" />
}
