import { useCallback, useRef } from 'react'
import { useNearbyStage } from '../../hooks/useNearbyStage'
import type { CartridgeLabel } from '../../lib/gameboy/CartridgeStage'

interface Cartridge3DProps {
  label: CartridgeLabel
  reducedMotion: boolean
  className?: string
}

export function Cartridge3D({ label, reducedMotion, className = '' }: Cartridge3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const create = useCallback(
    async (container: HTMLElement, onLoaded: () => void) => {
      const { CartridgeStage } = await import('../../lib/gameboy/CartridgeStage')
      return new CartridgeStage(container, label, reducedMotion, onLoaded)
    },
    [label, reducedMotion],
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
