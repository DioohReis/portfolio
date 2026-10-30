export interface NavItem {
  id: string
  label: string
}

/** Ordem das seções na página e no cabeçalho. */
export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'certificados', label: 'Certificados' },
  { id: 'contato', label: 'Contato' },
]

/** Texto das partículas no Home. */
export const HERO_LINES = ['Start', 'Hello', 'World']

export const SITE_OWNER = 'Diogo A Reis'
