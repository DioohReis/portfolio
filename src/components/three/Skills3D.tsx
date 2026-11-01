import { useCallback, useEffect, useRef } from 'react'
import { useNearbyStage } from '../../hooks/useNearbyStage'

interface Skills3DProps {
  skills: string[]
  selected: string | null
  reducedMotion: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  className?: string
}

export function Skills3D({ skills, selected, reducedMotion, onSelect, onHover, className = '' }: Skills3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef(selected)
  const callbacks = useRef({ onSelect, onHover })

  useEffect(() => {
    callbacks.current = { onSelect, onHover }
  }, [onSelect, onHover])

  const key = skills.join('|')
  const create = useCallback(
    async (container: HTMLElement, onLoaded: () => void) => {
      const { SkillsStage } = await import('../../lib/skills/SkillsStage')
      const stage = new SkillsStage(container, {
        skills: key.split('|'),
        reducedMotion,
        onSelect: (id) => callbacks.current.onSelect(id),
        onHover: (id) => callbacks.current.onHover(id),
        onLoaded: () => {
          onLoaded()
          stage.select(selectedRef.current)
        },
      })
      return stage
    },
    [key, reducedMotion],
  )
  // A sala é pesada: só é baixada quando a seção se aproxima da tela.
  const { stageRef, loaded } = useNearbyStage(containerRef, create, '60% 0px')

  useEffect(() => {
    selectedRef.current = selected
    stageRef.current?.select(selected)
  }, [selected, stageRef])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`touch-pan-y transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
