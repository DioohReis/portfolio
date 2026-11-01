import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/** Abaixo desta largura a memória de vídeo é curta: cena longe da tela é desfeita e refeita ao voltar. */
const RELEASE_WIDTH = 1024

/**
 * Cria a cena 3D só quando ela se aproxima da tela. No celular, também a desfaz quando fica longe,
 * para a página não acumular cenas até o aparelho derrubar o contexto gráfico.
 * `create` precisa ser estável entre renderizações: cada função nova recria a cena.
 */
export function useNearbyStage<T extends { dispose: () => void }>(
  containerRef: RefObject<HTMLElement | null>,
  create: (container: HTMLElement, onLoaded: () => void) => Promise<T>,
  margin = '100% 0px',
) {
  const stageRef = useRef<T | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let run = 0
    let active = false

    const release = () => {
      run += 1
      active = false
      stageRef.current?.dispose()
      stageRef.current = null
      setLoaded(false)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          if (active && window.innerWidth < RELEASE_WIDTH) release()
          return
        }
        if (active) return
        active = true
        const current = ++run
        create(container, () => setLoaded(true)).then((stage) => {
          if (current === run) stageRef.current = stage
          else stage.dispose()
        })
      },
      { rootMargin: margin },
    )
    observer.observe(container)

    return () => {
      observer.disconnect()
      release()
    }
  }, [containerRef, create, margin])

  return { stageRef, loaded }
}
