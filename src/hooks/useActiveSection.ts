import { useEffect, useState } from 'react'

/** Devolve o id da seção que está no meio da tela, para acender o link certo no cabeçalho. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join('|')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    key.split('|').forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
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
