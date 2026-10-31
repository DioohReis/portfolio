import { useEffect, useRef, useState } from 'react'
import type { GameboyStage } from '../../lib/gameboy/GameboyStage'
import { announceSceneReady } from '../../lib/sceneReady'

interface Gameboy3DProps {
  reducedMotion: boolean
  className?: string
}

export function Gameboy3D({ reducedMotion, className = '' }: Gameboy3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<GameboyStage | null>(null)
  const [loaded, setLoaded] = useState(false)

  // O modelo e o carregador só são baixados quando a seção se aproxima da tela.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        import('../../lib/gameboy/GameboyStage').then(({ GameboyStage }) => {
          if (cancelled) return
          stageRef.current = new GameboyStage(container, reducedMotion, () => {
            setLoaded(true)
            announceSceneReady()
          })
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
      setLoaded(false)
    }
  }, [reducedMotion])

  return (
    <div
      ref={containerRef}
      onClick={() => stageRef.current?.spin()}
      aria-hidden="true"
      className={`cursor-pointer touch-pan-y transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
