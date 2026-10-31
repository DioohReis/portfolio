import { SITE_OWNER } from './navigation'

export interface StatusRow {
  label: string
  value: string
}

export interface InventoryItem {
  name: string
  description: string
}

/** Tela "Status" do menu da fogueira. Troque "A definir" pelos seus dados. */
export const STATUS_ROWS: StatusRow[] = [
  { label: 'Nome', value: SITE_OWNER },
  { label: 'Classe', value: 'A definir' },
  { label: 'Nível', value: 'A definir' },
]

/** Texto de apresentação, ainda provisório. */
export const STATUS_TEXT = 'Em construção: aqui entra a sua apresentação.'

/** Tela "Atributos". Por enquanto, só o que este portfólio usa; complete com as suas tecnologias. */
export const ATTRIBUTES: string[] = ['React', 'TypeScript', 'Three.js', 'Tailwind CSS']

/** Tela "Inventário": interesses, escritos como itens. */
export const INVENTORY: InventoryItem[] = [
  { name: 'Dark Souls', description: 'Descrição provisória: escreva aqui o que esse jogo significa para você.' },
  { name: 'Jogos de computador', description: 'Descrição provisória: seus jogos e o seu setup.' },
]
