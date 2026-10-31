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
  /** Elemento da cena que amplia quando o mouse chega perto. */
  target: string
}

/** Opções do menu da fogueira: cada ponto da cena leva a uma seção. */
export const BONFIRE_SPOTS: BonfireSpot[] = [
  { id: 'sobre', label: 'Sobre', anchor: [-0.4, 2.2, -1.5], target: 'Artorias' },
  { id: 'projetos', label: 'Projetos', anchor: [-2.3, 0.8, -1.5], target: 'Artorias' },
  { id: 'certificados', label: 'Certificados', anchor: [0.8, 0.45, 0.3], target: 'bonfire' },
  { id: 'contato', label: 'Contato', anchor: [2.2, 1.6, -1.6], target: 'Sif' },
]
