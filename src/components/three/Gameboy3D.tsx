import { useCallback, useRef } from 'react'
import { useNearbyStage } from '../../hooks/useNearbyStage'
import { announceSceneReady } from '../../lib/sceneReady'

interface Gameboy3DProps {
  reducedMotion: boolean
  className?: string
}

export function Gameboy3D({ reducedMotion, className = '' }: Gameboy3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const create = useCallback(
    async (container: HTMLElement, onLoaded: () => void) => {
      const { GameboyStage } = await import('../../lib/gameboy/GameboyStage')
      return new GameboyStage(container, reducedMotion, () => {
        onLoaded()
        announceSceneReady()
      })
    },
    [reducedMotion],
  )
  const { stageRef, loaded } = useNearbyStage(containerRef, create)

  return (
    <div
      ref={containerRef}
      onClick={() => stageRef.current?.spin()}
      aria-hidden="true"
      className={`cursor-pointer touch-pan-y transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
