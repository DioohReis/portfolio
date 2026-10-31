import type { ReactNode } from 'react'

interface SectionHeadingProps {
  index: number
  label: string
  title: string
  children?: ReactNode
}

/** Cabeçalho padrão das seções: "02 — Sobre" + título grande + texto de apoio. */
export function SectionHeading({ index, label, title, children }: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium opacity-45">
        {String(index).padStart(2, '0')} — {label}
      </p>
      <h2 className="mt-4 mb-6 font-gothic text-[clamp(48px,8vw,128px)] leading-[0.95]">{title}</h2>
      {children && <div className="max-w-xl text-lg leading-relaxed opacity-60">{children}</div>}
    </div>
  )
}
