import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AvatarStage } from '../../lib/avatar/AvatarStage'

interface Avatar3DProps {
  url: string
  reducedMotion: boolean
  /** Textos por cima do avatar; um clique em qualquer ponto da área dá uma volta nele. */
  children?: ReactNode
  className?: string
}

export function Avatar3D({ url, reducedMotion, children, className = '' }: Avatar3DProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<AvatarStage | null>(null)
  const [loaded, setLoaded] = useState(false)

  // O modelo e o carregador só são baixados quando a seção se aproxima da tela.
  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    let cancelled = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        import('../../lib/avatar/AvatarStage').then(({ AvatarStage }) => {
          if (cancelled) return
          stageRef.current = new AvatarStage(canvas, { url, reducedMotion, onLoaded: () => setLoaded(true) })
        })
      },
      { rootMargin: '100% 0px' },
    )
    observer.observe(root)

    return () => {
      cancelled = true
      observer.disconnect()
      stageRef.current?.dispose()
      stageRef.current = null
      setLoaded(false)
    }
  }, [url, reducedMotion])

  return (
    <div ref={rootRef} className={`absolute inset-0 ${className}`} onClick={() => stageRef.current?.spin()}>
      <div
        ref={canvasRef}
        className={`absolute inset-0 touch-pan-y transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      />
      {children}
    </div>
  )
}
