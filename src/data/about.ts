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

/** Pôsteres do quarto: arte original, com os meus próprios projetos. */
export const POSTERS = [
  {
    title: 'CAMPO MINADO DOS LOBOS',
    icon: '🐺',
    caption: 'Python',
    background: 'linear-gradient(160deg, #7a1f3d, #1d1140)',
  },
  { title: 'LUMEN AI', icon: '🌱', caption: '15 missões', background: 'linear-gradient(160deg, #0f6b5a, #10264d)' },
  { title: 'ORBITAGRO', icon: '🛰️', caption: 'Sentinel-2', background: 'linear-gradient(160deg, #c2701e, #3a1650)' },
]

/** Colagem da parede, atrás do Game Boy: também só arte original. */
export const WALL_POSTERS = [
  {
    title: 'HELLO WORLD',
    icon: '👾',
    caption: 'START',
    background: 'linear-gradient(160deg, #3b2a9e, #0d1038)',
    left: '3%',
    top: '16%',
    turn: -4,
  },
  {
    title: 'TRIADOR AIIA',
    icon: '📄',
    caption: 'Gemini',
    background: 'linear-gradient(160deg, #a02a6a, #20104a)',
    left: '17%',
    top: '11%',
    turn: 3,
  },
  {
    title: 'AGENDADOR',
    icon: '📅',
    caption: 'Spring Boot',
    background: 'linear-gradient(160deg, #1f7a8c, #122045)',
    left: '4%',
    top: '50%',
    turn: 2,
  },
  {
    title: 'PORTAIS ACESSÍVEIS',
    icon: '♿',
    caption: 'Tech Lead',
    background: 'linear-gradient(160deg, #6d8b1f, #16301c)',
    left: '30%',
    top: '44%',
    turn: -3,
  },
]

/** Fitas e caixas da prateleira. */
export const SHELF_ITEMS = ['#b0234f', '#2d6cdf', '#d8a31f', '#2e8b57', '#6a3fb5', '#d6cfbd', '#b0234f', '#1f7a8c']

/** As três qualidades, como atributos de personagem. */
export const QUALITIES = [
  { name: 'Curiosidade', description: 'Quero entender como as coisas funcionam por dentro.' },
  { name: 'Criatividade', description: 'Procuro o caminho que ninguém esperava.' },
  { name: 'Força de vontade', description: 'Continuo até sair o melhor que eu consigo.' },
]

/** Guardado para a futura seção de skills; ainda não aparece no site. */
export const SKILL_GROUPS = [
  { name: 'Front-end', items: ['React', 'TypeScript', 'JavaScript', 'Next.js', 'Vite', 'Tailwind CSS'] },
  { name: 'Back-end', items: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'APIs REST'] },
  { name: 'Dados', items: ['SQL', 'SQLAlchemy', 'SQLite', 'H2', 'Modelagem relacional'] },
  { name: '3D e IA', items: ['Three.js', 'WebGL', 'Gemini'] },
  { name: 'Qualidade', items: ['Git Flow', 'Revisão de PRs', 'Acessibilidade', 'Documentação'] },
  { name: 'Idiomas', items: ['Inglês intermediário', 'Alemão intermediário'] },
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
