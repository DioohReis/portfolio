export interface Project {
  slug: string
  title: string
  /** Rótulo curto acima do título. */
  tag: string
  /** Uma ou duas frases sobre o projeto. */
  summary: string
  stack: string[]
  /** Imagem da tela curva, em /public. */
  cover: string
  repoUrl: string
  liveUrl: string
}

/** Projetos do carrossel. Textos vindos do currículo; capas capturadas dos próprios sites. */
export const PROJECTS: Project[] = [
  {
    slug: 'orbitagro-copilot',
    title: 'OrbitAgro Copilot',
    tag: 'Global Solution · FIAP',
    summary:
      'Monitoramento de lavouras com clima, geolocalização e imagens de satélite Sentinel-2, com análise de vegetação e umidade por NDVI e NDMI.',
    stack: ['JavaScript', 'APIs', 'Sentinel-2', 'Vercel'],
    cover: '/images/projetos/orbitagro.webp',
    repoUrl: 'https://github.com/DioohReis/orbitagroCopilot',
    liveUrl: 'https://orbitagro-copilot.vercel.app/',
  },
  {
    slug: 'lumen-ai',
    title: 'Lumen AI',
    tag: 'SoulUp Challenge · FIAP',
    summary:
      'Jornada gamificada de sustentabilidade, com 15 missões, XP, níveis e conquistas, guiada pelo Nexo, um avatar 3D modelado por código.',
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Three.js'],
    cover: '/images/projetos/lumen.webp',
    repoUrl: 'https://github.com/DioohReis/soul-up-challenge',
    liveUrl: 'https://soul-up-challenge.vercel.app/',
  },
  {
    slug: 'triador-aiia',
    title: 'Triador AIIA',
    tag: 'Fullstack e IA',
    summary:
      'Compara currículos e vagas com análise estruturada por IA, a partir de PDF, DOCX ou TXT, com login e histórico separado por usuário.',
    stack: ['Next.js', 'TypeScript', 'FastAPI', 'Gemini'],
    cover: '/images/projetos/triador.webp',
    repoUrl: 'https://github.com/DioohReis/triador-aiia-gemini-ux',
    liveUrl: 'https://triador-aiia-gemini-ux.vercel.app/',
  },
]
