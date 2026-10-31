import { useEffect, useRef, useState } from 'react'
import type { ProjectsStage } from '../../lib/projects/ProjectsStage'

interface Projects3DProps {
  covers: string[]
  active: number
  reducedMotion: boolean
  onActive: (index: number) => void
  onOpen: (index: number) => void
  className?: string
}

export function Projects3D({ covers, active, reducedMotion, onActive, onOpen, className = '' }: Projects3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<ProjectsStage | null>(null)
  const callbacks = useRef({ onActive, onOpen })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    callbacks.current = { onActive, onOpen }
  }, [onActive, onOpen])

  const key = covers.join('|')
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    import('../../lib/projects/ProjectsStage').then(({ ProjectsStage }) => {
      if (cancelled) return
      stageRef.current = new ProjectsStage(container, {
        covers: key.split('|'),
        reducedMotion,
        onActive: (index) => callbacks.current.onActive(index),
        onOpen: (index) => callbacks.current.onOpen(index),
        onLoaded: () => setLoaded(true),
      })
    })
    return () => {
      cancelled = true
      stageRef.current?.dispose()
      stageRef.current = null
      setLoaded(false)
    }
  }, [key, reducedMotion])

  // Setas e lista do lado de fora também giram o anel.
  useEffect(() => {
    stageRef.current?.goTo(active)
  }, [active])

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      aria-hidden="true"
      className={`touch-pan-y transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
