import { useEffect, useRef, useState } from 'react'
import type { SkillsStage } from '../../lib/skills/SkillsStage'

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
  const stageRef = useRef<SkillsStage | null>(null)
  const selectedRef = useRef(selected)
  const callbacks = useRef({ onSelect, onHover })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    callbacks.current = { onSelect, onHover }
  }, [onSelect, onHover])

  const key = skills.join('|')
  // A sala é pesada: só é baixada quando a seção se aproxima da tela.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        import('../../lib/skills/SkillsStage').then(({ SkillsStage }) => {
          if (cancelled) return
          stageRef.current = new SkillsStage(container, {
            skills: key.split('|'),
            reducedMotion,
            onSelect: (id) => callbacks.current.onSelect(id),
            onHover: (id) => callbacks.current.onHover(id),
            onLoaded: () => {
              setLoaded(true)
              stageRef.current?.select(selectedRef.current)
            },
          })
        })
      },
      { rootMargin: '60% 0px' },
    )
    observer.observe(container)

    return () => {
      cancelled = true
      observer.disconnect()
      stageRef.current?.dispose()
      stageRef.current = null
      setLoaded(false)
    }
  }, [key, reducedMotion])

  useEffect(() => {
    selectedRef.current = selected
    stageRef.current?.select(selected)
  }, [selected])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`touch-pan-y transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
