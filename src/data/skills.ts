export interface Skill {
  id: string
  label: string
  /** Número da "pasta" no arquivo do card. */
  file: string
  summary: string
  daily: string[]
}

/** Skills da cena do zumbi. Fonte: currículo e GitHub; o modelo 3D de cada uma está em /models/skills/{id}.glb. */
export const SKILLS: Skill[] = [
  {
    id: 'html',
    label: 'HTML',
    file: '001',
    summary:
      'É onde toda interface começa. Escrevo HTML semântico para a página fazer sentido antes de qualquer estilo.',
    daily: ['Estrutura semântica das páginas', 'Formulários acessíveis', 'Navegação por teclado e foco visível'],
  },
  {
    id: 'css',
    label: 'CSS',
    file: '002',
    summary: 'Uso para transformar protótipo em tela responsiva, quase sempre com Tailwind CSS no dia a dia.',
    daily: ['Layouts com Flexbox e CSS Grid', 'Tailwind CSS nos projetos em React', 'Contraste e movimento reduzido'],
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    file: '003',
    summary: 'A base do que faço na web, das interações na tela ao consumo de APIs externas.',
    daily: ['Consumo de APIs REST e JSON', 'Funções serverless na Vercel', 'Clima e imagens de satélite no OrbitAgro'],
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    file: '004',
    summary: 'Minha escolha para projetos em React: os tipos pegam o erro antes de ele chegar na tela.',
    daily: ['Componentes e dados tipados', 'Lumen AI, Portais Acessíveis e este portfólio', 'Next.js no Triador AIIA'],
  },
  {
    id: 'react',
    label: 'React',
    file: '005',
    summary:
      'Onde passo a maior parte do tempo: componentes reutilizáveis, rotas e formulários em interfaces responsivas.',
    daily: ['SPAs com Vite e React Router', 'Formulários com React Hook Form', 'Three.js integrado à interface'],
  },
  {
    id: 'python',
    label: 'Python',
    file: '006',
    summary: 'Uso no back-end e em projetos de IA, com APIs organizadas em camadas e respostas validadas.',
    daily: ['APIs com FastAPI e Pydantic', 'SQLAlchemy e SQLite', 'Integração com Gemini no Triador AIIA'],
  },
  {
    id: 'git',
    label: 'Git',
    file: '007',
    summary:
      'Faz parte de toda entrega. Como Tech Lead no Portais Acessíveis, é também por onde reviso o trabalho do time.',
    daily: ['Git Flow e pull requests', 'Revisão de código no GitHub', 'Issues com escopo e critérios de aceite'],
  },
]

/** Créditos dos modelos da cena (licença CC BY 4.0, exige citar autor e fonte). */
export const SKILLS_CREDITS = [
  {
    title: 'Waiting Room',
    author: 'MarcoCR',
    url: 'https://sketchfab.com/3d-models/waiting-room-26eab279708c40fb8e5721c68cd33fcb',
  },
  {
    title: 'The House of the Dead Arcade Cabinet',
    author: 'Seraphim Sarov',
    url: 'https://sketchfab.com/3d-models/the-house-of-the-dead-arcade-cabinet-e03d6a5f5efd49d19cfb7d95a27ad363',
  },
  {
    title: 'Git logo',
    author: 'mastergames2435',
    url: 'https://sketchfab.com/3d-models/git-logo-01e9bc6656f0423bb4c68bff7aae4b99',
  },
  {
    title: 'Python Programming language',
    author: 'Acvantad',
    url: 'https://sketchfab.com/3d-models/python-programming-language-44d992bf56e244448e9ee5b4da083287',
  },
  {
    title: 'HTML logo',
    author: 'Erik Egnatosyan',
    url: 'https://sketchfab.com/3d-models/html-logo-3d-model-ab8b32cab3364027ab00a033a0b2ff38',
  },
  {
    title: 'CSS logo',
    author: 'Erik Egnatosyan',
    url: 'https://sketchfab.com/3d-models/css-logo-3d-model-17b34c2b98714c6799544939f476eed3',
  },
  {
    title: 'React logo',
    author: 'xenadus',
    url: 'https://sketchfab.com/3d-models/react-logo-76174ceeba96487f9863f974636f641e',
  },
  {
    title: 'JavaScript logo',
    author: 'Alex human',
    url: 'https://sketchfab.com/3d-models/javascript-logo-3d-model-792093fab435419ab70dae39d2891cb3',
  },
  {
    title: 'TypeScript logo',
    author: 'Alex human',
    url: 'https://sketchfab.com/3d-models/typescript-logo-3d-model-84af2099cb8542549fb56eae0dbabdb5',
  },
]
