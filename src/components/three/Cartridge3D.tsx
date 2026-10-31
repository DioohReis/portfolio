import { useEffect, useRef, useState } from 'react'
import type { CartridgeLabel, CartridgeStage } from '../../lib/gameboy/CartridgeStage'

interface Cartridge3DProps {
  label: CartridgeLabel
  reducedMotion: boolean
  className?: string
}

export function Cartridge3D({ label, reducedMotion, className = '' }: Cartridge3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<CartridgeStage | null>(null)
  const [loaded, setLoaded] = useState(false)

  // O modelo só é baixado quando se aproxima da tela.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        import('../../lib/gameboy/CartridgeStage').then(({ CartridgeStage }) => {
          if (cancelled) return
          stageRef.current = new CartridgeStage(container, label, reducedMotion, () => setLoaded(true))
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
  }, [label, reducedMotion])

  return (
    <div
      ref={containerRef}
      onClick={() => stageRef.current?.spin()}
      aria-hidden="true"
      className={`cursor-pointer touch-pan-y transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
