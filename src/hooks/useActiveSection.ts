import { useEffect, useState } from 'react'

/**
 * Devolve o id da última seção que já alcançou o meio da tela, para acender o link certo no cabeçalho.
 * As seções se sobrepõem na rolagem, então vale a posição do topo, e não qual delas está visível.
 */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join('|')

  useEffect(() => {
    const onScroll = () => {
      let current = key.split('|')[0]
      for (const id of key.split('|')) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= window.innerHeight / 2) current = id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [key])

  return active
}

/** true depois que a página rolou além de uma fração da altura da tela. */
export function useScrolledPast(fraction = 0.6) {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * fraction)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [fraction])
  return past
}
