import { useEffect, useRef } from 'react'
import { ParticleField } from '../../lib/particles/ParticleField'

interface ParticleTextProps {
  lines: string[]
  fontFamily?: string
  /** Quando vira true, o chiado começa e o texto se monta. */
  started: boolean
  reducedMotion?: boolean
  /** Avisa quando a fonte carregou e as partículas estão prontas. */
  onReady?: () => void
  className?: string
}

export function ParticleText({
  lines,
  fontFamily = 'Sanguine Frost',
  started,
  reducedMotion = false,
  onReady,
  className = '',
}: ParticleTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<ParticleField | null>(null)
  const onReadyRef = useRef(onReady)
  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])
  const linesKey = lines.join('\n')

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const field = new ParticleField(el, { lines: linesKey.split('\n'), fontFamily, reducedMotion })
    fieldRef.current = field
    field.ready.then(() => {
      if (fieldRef.current === field) onReadyRef.current?.()
    })
    return () => {
      field.dispose()
      if (fieldRef.current === field) fieldRef.current = null
    }
  }, [linesKey, fontFamily, reducedMotion])

  useEffect(() => {
    if (!started) return
    const field = fieldRef.current
    if (!field) return
    field.ready.then(() => field.start())
  }, [started, linesKey, fontFamily, reducedMotion])

  return <div ref={containerRef} className={`absolute inset-0 ${className}`} aria-hidden="true" />
}
