import { useCallback, useRef } from 'react'
import { useNearbyStage } from '../../hooks/useNearbyStage'
import type { StorageModel } from '../../lib/storage/StorageStage'

interface Storage3DProps {
  /** Precisa ser estável entre renderizações: cada função nova recria a cena. */
  loadModel: () => Promise<StorageModel>
  reducedMotion: boolean
  className?: string
}

export function Storage3D({ loadModel, reducedMotion, className = '' }: Storage3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const create = useCallback(
    async (container: HTMLElement, onLoaded: () => void) => {
      const [{ StorageStage }, model] = await Promise.all([import('../../lib/storage/StorageStage'), loadModel()])
      return new StorageStage(container, model, reducedMotion, onLoaded)
    },
    [loadModel, reducedMotion],
  )
  const { stageRef, loaded } = useNearbyStage(containerRef, create)

  return (
    <div
      ref={containerRef}
      onClick={(event) => stageRef.current?.spinAt(event.clientX, event.clientY)}
      aria-hidden="true"
      className={`cursor-pointer touch-pan-y transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
