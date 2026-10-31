import { useEffect } from 'react'
import type Lenis from 'lenis'

const SNAP_SECONDS = 1.4
/** Espera a inércia do trackpad acabar antes de aceitar outro giro. */
const COOLDOWN_MS = 450
const NEAR = 4

/**
 * Entre as seções de tela cheia a rolagem não para no meio: um giro do mouse já leva à próxima.
 * Da última para baixo a rolagem volta a ser livre.
 */
export function useSectionSnap(lenis: Lenis | null, ids: string[], enabled: boolean, reducedMotion: boolean) {
  const key = ids.join('|')

  useEffect(() => {
    if (!enabled) return
    const sections = key.split('|')
    let animating = false
    let touching = false
    let idleTimer = 0
    let lastY = window.scrollY

    const tops = () =>
      sections.flatMap((id) => {
        const el = document.getElementById(id)
        return el ? [el.getBoundingClientRect().top + window.scrollY] : []
      })

    const finish = () => window.setTimeout(() => (animating = false), COOLDOWN_MS)

    const go = (top: number) => {
      animating = true
      if (lenis && !reducedMotion) {
        lenis.scrollTo(top, { duration: SNAP_SECONDS, lock: true, onComplete: finish })
      } else {
        window.scrollTo({ top, behavior: 'instant' })
        finish()
      }
    }

    const next = (down: boolean) => {
      const y = window.scrollY
      const all = tops()
      return down ? all.find((top) => top > y + NEAR) : all.findLast((top) => top < y - NEAR)
    }

    const onWheel = (event: WheelEvent) => {
      const all = tops()
      const last = all[all.length - 1]
      const y = window.scrollY
      if (last === undefined || document.body.classList.contains('is-locked')) return
      if (y > last + NEAR || (y >= last - NEAR && event.deltaY > 0)) return
      // Passa na frente do Lenis, que senão rolaria junto.
      event.preventDefault()
      event.stopImmediatePropagation()
      if (animating || Math.abs(event.deltaY) < NEAR) return
      const top = next(event.deltaY > 0)
      if (top !== undefined) go(top)
    }

    // Toque, teclado e barra de rolagem: quando param no meio, terminam o caminho até a próxima.
    const settle = () => {
      const y = window.scrollY
      const all = tops()
      const last = all[all.length - 1]
      const moved = y - lastY
      lastY = y
      if (animating || touching || lenis?.isScrolling || last === undefined) return
      if (y >= last - NEAR || all.some((top) => Math.abs(top - y) <= NEAR)) return
      const top = next(moved >= 0)
      if (top !== undefined) go(top)
    }
    const onScroll = () => {
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(settle, 160)
    }
    const onTouchStart = () => (touching = true)
    const onTouchEnd = () => {
      touching = false
      onScroll()
    }

    window.addEventListener('wheel', onWheel, { passive: false, capture: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.clearTimeout(idleTimer)
      window.removeEventListener('wheel', onWheel, { capture: true })
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [lenis, key, enabled, reducedMotion])
}
