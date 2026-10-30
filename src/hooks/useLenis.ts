import Lenis from 'lenis'
import { createContext, useContext, useEffect, useState } from 'react'

export const LenisContext = createContext<Lenis | null>(null)

/** Cria o scroll suave (Lenis) uma vez para o site todo. */
export function useCreateLenis(enabled: boolean) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (!enabled) return
    const instance = new Lenis({ duration: 1.15, anchors: false })
    let raf = 0
    const loop = (time: number) => {
      instance.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    // sincroniza com um sistema externo (a instância do Lenis), por isso o setState aqui
    // oxlint-disable-next-line react/set-state-in-effect
    setLenis(instance)
    return () => {
      cancelAnimationFrame(raf)
      instance.destroy()
      setLenis(null)
    }
  }, [enabled])

  return lenis
}

export function useLenis() {
  return useContext(LenisContext)
}

/** Rola até uma seção (#id) com Lenis quando disponível, ou com o scroll nativo. */
export function scrollToSection(lenis: Lenis | null, id: string) {
  const target = document.getElementById(id)
  if (!target) return
  if (lenis) lenis.scrollTo(target, { offset: 0 })
  else target.scrollIntoView({ behavior: 'smooth' })
  history.replaceState(null, '', `#${id}`)
}
