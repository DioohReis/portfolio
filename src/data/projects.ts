export interface Project {
  slug: string
  title: string
  /** Uma ou duas frases sobre o projeto. */
  summary: string
  /** Tecnologias usadas — aparecem na faixa que corre no card. */
  stack: string[]
  category: 'web' | 'jogo' | 'acadêmico'
  year: number
  /** Caminho em /public, ex.: '/images/projetos/lumen-ai.webp' */
  cover?: string
  repoUrl?: string
  liveUrl?: string
}

/**
 * Para adicionar um projeto, copie um bloco e preencha.
 * Os textos abaixo são rascunhos — troque pelos seus.
 */
export const PROJECTS: Project[] = [
  {
    slug: 'lumen-ai',
    title: 'Lumen AI',
    summary: 'App desenvolvido para o Soul Up Challenge, na disciplina de Front-End Design Engineering.',
    stack: ['React', 'Vite', 'TypeScript'],
    category: 'acadêmico',
    year: 2026,
  },
  {
    slug: 'campo-minado-lobos',
    title: 'Campo Minado dos Lobos',
    summary: 'Campo minado para o terminal em que os lobos são as bombas e os coelhos marcam os espaços seguros.',
    stack: ['Python'],
    category: 'jogo',
    year: 2026,
  },
]
