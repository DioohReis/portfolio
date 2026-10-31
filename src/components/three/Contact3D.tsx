import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref, RefObject } from 'react'
import type { GunSkin } from '../../data/contact'
import type { ContactStage } from '../../lib/contact/ContactStage'

export interface Contact3DHandle {
  /** Devolve se o tiro matou um demônio. */
  fire: (x: number, y: number) => boolean
}

interface Contact3DProps {
  skin: GunSkin
  reducedMotion: boolean
  /** Camada por cima das placas, onde a arma é desenhada. */
  gunLayerRef: RefObject<HTMLDivElement | null>
  ref?: Ref<Contact3DHandle>
  className?: string
}

export function Contact3D({ skin, reducedMotion, gunLayerRef, ref, className = '' }: Contact3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<ContactStage | null>(null)
  const [loaded, setLoaded] = useState(false)
  const skinRef = useRef(skin)

  useImperativeHandle(ref, () => ({ fire: (x, y) => stageRef.current?.fire(x, y) ?? false }), [])

  useEffect(() => {
    const container = containerRef.current
    const gunLayer = gunLayerRef.current
    if (!container || !gunLayer) return
    let cancelled = false
    import('../../lib/contact/ContactStage').then(({ ContactStage }) => {
      if (cancelled) return
      stageRef.current = new ContactStage(container, gunLayer, skinRef.current, reducedMotion, () => setLoaded(true))
    })
    return () => {
      cancelled = true
      stageRef.current?.dispose()
      stageRef.current = null
      setLoaded(false)
    }
  }, [reducedMotion, gunLayerRef])

  useEffect(() => {
    if (skinRef.current === skin) return
    skinRef.current = skin
    void stageRef.current?.setSkin(skin)
  }, [skin])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
