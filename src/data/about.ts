/** Textos da seção Sobre. Fontes: currículo, GitHub e a sua própria descrição. */
export const ABOUT = {
  lead: 'Estudo Análise e Desenvolvimento de Sistemas na FIAP e gosto de pensar em mim como alguém que vive entre',
  accentA: 'código',
  accentB: 'criatividade',
  noteTitle: 'Gosto de sair do óbvio.',
  note: 'Sou uma pessoa criativa, que ama explorar coisas novas e está sempre buscando o melhor que consegue. Aprender mais é o que me move.',
  terminalTitle: 'do_front_ao_back',
  terminal:
    'Trabalho com React, TypeScript e Tailwind CSS, com base em Java e Python. Já passei por APIs REST, bancos de dados, integração com IA e 3D na web, sempre de olho em acessibilidade e qualidade.',
}

/** Texto do rótulo do cartucho 3D. */
export const CARTRIDGE_LABEL = { title: ABOUT.noteTitle, text: ABOUT.note }

/** Ingressos com o que já construí. */
export const TICKETS = ['Interfaces', 'APIs', '3D na web', 'Projetos com IA']

/** Fechamento do Sobre: a frase de destaque e o bilhete colado. */
export const CLOSING = {
  intro:
    'Já criei interfaces, APIs, experiências em 3D e projetos com IA. No caminho, percebi que o que mais me move é começar sem saber a resposta:',
  statement: 'ter curiosidade para explorar,',
  tag: 'e força de vontade para entregar.',
  noteBefore:
    'No que eu faço, gosto de olhar o mesmo problema de outro jeito, aprender o que ainda não sei e responder àquele',
  noteCircled: '“por que não?”',
  noteAfter: 'com algo que funcione de verdade.',
}

/** As três qualidades, como atributos de personagem. */
export const QUALITIES = [
  { name: 'Curiosidade', description: 'Quero entender como as coisas funcionam por dentro.' },
  { name: 'Criatividade', description: 'Procuro o caminho que ninguém esperava.' },
  { name: 'Força de vontade', description: 'Continuo até sair o melhor que eu consigo.' },
]

export const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/DioohReis' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/diogo-guilherme-de-assis-reis-002bb6208/' },
]

/** Créditos dos modelos 3D da fogueira (licença CC BY 4.0, exige citar autor e fonte). */
export const MODEL_CREDITS = [
  {
    title: 'Pokemon Cartridge Gameboy',
    author: 'thegraphicsgeek',
    url: 'https://sketchfab.com/3d-models/pokemon-cartridge-gameboy-7d79300f91a441d0ba520fdbd268aa5f',
  },
  {
    title: 'Gameboy',
    author: 'grimmorf',
    url: 'https://sketchfab.com/3d-models/gameboy-4a1da0cefa904c4eae895338bd6f3334',
  },
  {
    title: 'Ornstein',
    author: 'moonblade777',
    url: 'https://sketchfab.com/3d-models/ornstein-6945be7b57874fc591e1121c3b9c7279',
  },
  {
    title: 'Dark Souls (cenário)',
    author: 'dark_igorek',
    url: 'https://sketchfab.com/3d-models/dark-souls-d823af63681b4e65b222606043ec81c7',
  },
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
