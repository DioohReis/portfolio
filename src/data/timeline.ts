export interface TimelineItem {
  /** Rótulo no lugar da data; o currículo não traz os períodos. */
  tag: string
  title: string
  subtitle: string
  description: string
  highlights: string[]
}

/** Trajetória mostrada como cartuchos na seção Sobre. Fonte: currículo. Inclua as datas quando quiser. */
export const TIMELINE: TimelineItem[] = [
  {
    tag: 'Em andamento',
    title: 'Análise e Desenvolvimento de Sistemas',
    subtitle: 'FIAP',
    description: 'A graduação em que venho juntando base técnica e projetos práticos, do front ao back.',
    highlights: ['Desenvolvimento web', 'Java e Python', 'Bancos de dados', 'Projetos em equipe'],
  },
  {
    tag: 'Liderança',
    title: 'Tech Lead',
    subtitle: 'Portais Acessíveis · Projeto acadêmico FIAP',
    description: 'Liderança técnica do Portal de Locais e Serviços Acessíveis.',
    highlights: [
      'Revisão de pull requests',
      'Issues com escopo e critérios de aceite',
      'Alinhamento entre implementação e QA',
      'Teclado, foco, alto contraste e movimento reduzido',
    ],
  },
  {
    tag: 'Front-end',
    title: 'Lumen AI',
    subtitle: 'SoulUp Challenge · FIAP',
    description: 'Experiência interativa de sustentabilidade, com jornada gamificada e avatar 3D.',
    highlights: [
      '15 missões e 5 temas ambientais',
      'XP, níveis e conquistas',
      'Avatar Nexo modelado por código em Three.js',
    ],
  },
  {
    tag: 'Web e integrações',
    title: 'OrbitAgro Copilot',
    subtitle: 'Global Solution · FIAP',
    description: 'Monitoramento de lavouras com dados ambientais e imagens de satélite.',
    highlights: [
      'Imagens Sentinel-2, com NDVI e NDMI',
      'Clima e geolocalização por APIs',
      'Função serverless na Vercel com OAuth',
    ],
  },
  {
    tag: 'Fullstack e IA',
    title: 'Triador AIIA',
    subtitle: 'Triagem de currículos com IA',
    description: 'Compara currículos e vagas, com extração de texto e análise estruturada por IA.',
    highlights: ['Next.js, FastAPI e Gemini', 'Upload de PDF, DOCX e TXT', 'Autenticação e histórico por usuário'],
  },
  {
    tag: 'Back-end',
    title: 'Agendador de Horários',
    subtitle: 'API REST',
    description: 'API para agendamentos, profissionais e clientes, organizada em camadas.',
    highlights: ['Java e Spring Boot', 'Spring Data JPA', 'Controller, Service e Repository'],
  },
]
