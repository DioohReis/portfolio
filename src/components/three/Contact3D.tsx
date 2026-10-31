import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import type { ContactStage } from '../../lib/contact/ContactStage'

export interface Contact3DHandle {
  fire: (x: number, y: number) => void
}

interface Contact3DProps {
  reducedMotion: boolean
  ref?: Ref<Contact3DHandle>
  className?: string
}

export function Contact3D({ reducedMotion, ref, className = '' }: Contact3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<ContactStage | null>(null)
  const [loaded, setLoaded] = useState(false)

  useImperativeHandle(ref, () => ({ fire: (x, y) => stageRef.current?.fire(x, y) }), [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    import('../../lib/contact/ContactStage').then(({ ContactStage }) => {
      if (cancelled) return
      stageRef.current = new ContactStage(container, reducedMotion, () => setLoaded(true))
    })
    return () => {
      cancelled = true
      stageRef.current?.dispose()
      stageRef.current = null
      setLoaded(false)
    }
  }, [reducedMotion])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
