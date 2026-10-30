/**
 * sessionStorage com proteção: em janela anônima ou com cookies bloqueados
 * o acesso pode falhar, e o site precisa continuar funcionando.
 */
export const session = {
  get(key: string): string | null {
    try {
      return window.sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      window.sessionStorage.setItem(key, value)
    } catch {
      /* ignorado */
    }
  },
  remove(key: string) {
    try {
      window.sessionStorage.removeItem(key)
    } catch {
      /* ignorado */
    }
  },
}

export const INTRO_SEEN_KEY = 'dar:intro-seen'
