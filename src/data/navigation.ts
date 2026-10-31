export interface NavItem {
  id: string
  label: string
  /** Home e Fogueira ficam na página inicial; as outras têm página própria. */
  href: string
}

/** Itens do cabeçalho. */
export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'fogueira', label: 'Fogueira', href: '/#fogueira' },
  { id: 'sobre', label: 'Sobre', href: '/sobre' },
  { id: 'projetos', label: 'Projetos', href: '/projetos' },
  { id: 'certificados', label: 'Certificados', href: '/certificados' },
  { id: 'contato', label: 'Contato', href: '/contato' },
]

/** Texto das partículas no Home. */
export const HERO_LINES = ['Start', 'Hello', 'World']

export const SITE_OWNER = 'Diogo A Reis'

export interface BonfireSpot {
  id: string
  label: string
  /** Ponto da cena 3D onde a etiqueta fica presa (x, y, z). */
  anchor: [number, number, number]
  /** Elemento da cena em que a câmera chega perto. */
  target: string
}

/** Opções do menu da fogueira: cada ponto da cena leva a uma seção. */
export const BONFIRE_SPOTS: BonfireSpot[] = [
  { id: 'sobre', label: 'Sobre', anchor: [-2.65, 1.75, -0.9], target: 'Artorias' },
  { id: 'projetos', label: 'Projetos', anchor: [2.85, 1.75, -0.9], target: 'Ornstein' },
  { id: 'certificados', label: 'Certificados', anchor: [0.8, 0.45, 0.3], target: 'bonfire' },
  { id: 'contato', label: 'Contato', anchor: [0.5, 1.75, -2.2], target: 'Sif' },
]
