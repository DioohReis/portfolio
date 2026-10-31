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

/** Créditos dos modelos 3D da fogueira (licença CC BY 4.0, exige citar autor e fonte). */
export const MODEL_CREDITS = [
  {
    title: 'Dark Souls - Bonfire',
    author: 'UselessViking',
    url: 'https://sketchfab.com/3d-models/dark-souls-bonfire-b0d68c8f4cd0487da3d1fb8327ab1044',
  },
  {
    title: 'Knight Artorias and Great Grey Wolf Sif',
    author: '9S',
    url: 'https://sketchfab.com/3d-models/knight-artorias-and-great-grey-wolf-sif-bdf57355f95a420fa0c5b3e924bea16d',
  },
]
