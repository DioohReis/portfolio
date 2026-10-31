import { useSyncExternalStore } from 'react'
import type { MouseEvent } from 'react'

const CHANGE_EVENT = 'dar:route-change'

const subscribe = (notify: () => void) => {
  window.addEventListener('popstate', notify)
  window.addEventListener(CHANGE_EVENT, notify)
  return () => {
    window.removeEventListener('popstate', notify)
    window.removeEventListener(CHANGE_EVENT, notify)
  }
}

const snapshot = () => `${window.location.pathname}${window.location.hash}`

/** Rota atual (caminho + âncora). As poucas páginas do site não justificam uma biblioteca de rotas. */
export function useRoute() {
  const route = useSyncExternalStore(subscribe, snapshot)
  const [path, hash = ''] = route.split('#')
  return { path, hash }
}

export function navigate(to: string) {
  if (to !== snapshot()) window.history.pushState(null, '', to)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Clique em link interno: troca de página sem recarregar; Ctrl+clique continua abrindo em outra aba. */
export function followLink(event: MouseEvent<HTMLAnchorElement>, to: string) {
  if (event.ctrlKey || event.metaKey || event.shiftKey) return
  event.preventDefault()
  navigate(to)
}
