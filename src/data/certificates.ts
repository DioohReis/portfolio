export interface Certificate {
  title: string
  issuer: string
  /** Formato AAAA-MM */
  date: string
  credentialUrl?: string
  /** Caminho em /public, ex.: '/certificates/nome.webp' */
  image?: string
}

/** Adicione seus certificados aqui. A seção mostra um aviso enquanto a lista estiver vazia. */
export const CERTIFICATES: Certificate[] = []
