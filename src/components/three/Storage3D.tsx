import { useEffect, useRef, useState } from 'react'
import type { StorageModel, StorageStage } from '../../lib/storage/StorageStage'

interface Storage3DProps {
  /** Precisa ser estável entre renderizações: cada função nova recria a cena. */
  loadModel: () => Promise<StorageModel>
  reducedMotion: boolean
  className?: string
}

export function Storage3D({ loadModel, reducedMotion, className = '' }: Storage3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<StorageStage | null>(null)
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
        Promise.all([import('../../lib/storage/StorageStage'), loadModel()]).then(([{ StorageStage }, model]) => {
          if (cancelled) return
          stageRef.current = new StorageStage(container, model, reducedMotion, () => setLoaded(true))
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
  }, [loadModel, reducedMotion])

  return (
    <div
      ref={containerRef}
      onClick={(event) => stageRef.current?.spinAt(event.clientX, event.clientY)}
      aria-hidden="true"
      className={`cursor-pointer touch-pan-y transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
