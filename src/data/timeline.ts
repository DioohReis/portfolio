export interface TimelineItem {
  /** Ex.: '2026' ou '2025 — 2026' */
  period: string
  title: string
  description: string
}

/** Sua trajetória, do mais recente para o mais antigo. Usada na seção Sobre. */
export const TIMELINE: TimelineItem[] = []
