import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(callback: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

/** true quando a pessoa ativou "reduzir movimento" no sistema. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
