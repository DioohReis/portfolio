export interface Certificate {
  title: string
  issuer: string
  /** Ex.: 'mai. 2026'. Vazio quando a fonte não traz a data. */
  date?: string
  credentialUrl?: string
  /** Imagem em /public. Sem ela, o bloco mostra só o texto. */
  image?: string
}

/**
 * Do mais recente para o mais antigo. Fontes: perfil público do LinkedIn, PDFs enviados e currículo. As imagens
 * dos PDFs têm RG e data de nascimento apagados: nunca publicar os originais. O perfil público só mostra cinco certificados: os demais precisam entrar aqui à mão.
 */
export const CERTIFICATES: Certificate[] = [
  {
    title: 'Qualificação Profissional em Análise de Sistemas e Prototipação Web',
    issuer: 'FIAP · Gold Certified',
    date: 'jun. 2026',
    image: '/images/certificados/qualificacao.webp',
  },
  {
    title: 'Python Development',
    issuer: 'FIAP · Nano Course, 80 h',
    date: 'mai. 2026',
    credentialUrl:
      'https://on.fiap.com.br/local/nanocourses/gerar_certificado.php?chave=b679d24d499dc93ce2fecb86cb2c13d2&action=view',
    image: '/images/certificados/python.webp',
  },
  {
    title: 'Figma: Além do UI com Figma Buzz e Figma Slides',
    issuer: 'Alura · 6 h',
    date: 'mai. 2026',
    credentialUrl: 'https://cursos.alura.com.br/certificate/8dbf11db-e9ee-424f-9c61-71f07c74987c',
    image: '/images/certificados/figma.webp',
  },
  {
    title: 'Front End',
    issuer: 'FIAP · Nano Course, 80 h',
    date: 'abr. 2026',
    credentialUrl:
      'https://on.fiap.com.br/local/nanocourses/gerar_certificado.php?chave=af3e8e45677316f98f84697f498fc7fd&action=view',
    image: '/images/certificados/frontend.webp',
  },
  {
    title: 'Carreira Desenvolvimento Back-End Java: Boas-vindas e primeiros passos',
    issuer: 'Alura · 1 h',
    date: 'mar. 2026',
    credentialUrl: 'https://cursos.alura.com.br/certificate/6f66fcc1-2d83-4768-8f71-604453fecd10',
    image: '/images/certificados/java.webp',
  },
  {
    title: 'Formação Social e Sustentabilidade',
    issuer: 'FIAP · Nano Course, 80 h',
    date: 'fev. 2026',
    credentialUrl:
      'https://on.fiap.com.br/local/nanocourses/gerar_certificado.php?chave=75a7a366cdb8ed251850b73c88ccc067&action=view',
    image: '/images/certificados/social.webp',
  },
  {
    title: 'Cibersegurança com Soluções Fortinet',
    issuer: 'SENAI · 60 h',
    date: 'jun. 2025',
    credentialUrl: 'https://www.sp.senai.br/consulta-certificado?qrcode=10125148357/15151014',
    image: '/images/certificados/fortinet.webp',
  },
  { title: 'Desenvolvimento de Aplicativos', issuer: 'Estação Hack · Facebook' },
]
