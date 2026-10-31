export interface NavItem {
  id: string
  label: string
}

/** Ordem das seções na página e no cabeçalho. */
export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'fogueira', label: 'Fogueira' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'certificados', label: 'Certificados' },
  { id: 'contato', label: 'Contato' },
]

/** Texto das partículas no Home. */
export const HERO_LINES = ['Start', 'Hello', 'World']

export const SITE_OWNER = 'Diogo A Reis'

export interface BonfireSpot {
  id: string
  label: string
  /** Ponto da cena 3D onde a etiqueta fica presa (x, y, z). */
  anchor: [number, number, number]
}

/** Opções do menu da fogueira: cada ponto da cena leva a uma seção. */
export const BONFIRE_SPOTS: BonfireSpot[] = [
  { id: 'sobre', label: 'Sobre', anchor: [0.55, 2.2, -2.2] },
  { id: 'projetos', label: 'Projetos', anchor: [-1.08, 0.48, -2.2] },
  { id: 'certificados', label: 'Certificados', anchor: [0.47, 0.12, 0.5] },
  { id: 'contato', label: 'Contato', anchor: [1.34, 1.34, -2.2] },
]
