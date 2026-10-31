import { useState } from 'react'
import type { TimelineItem } from '../../data/timeline'

interface CartridgeProps {
  item: TimelineItem
  index: number
}

/** Cartão da trajetória em forma de cartucho: a frente é o rótulo; virado, mostra os detalhes. */
export function Cartridge({ item, index }: CartridgeProps) {
  const [flipped, setFlipped] = useState(false)
  const face = 'absolute inset-0 [backface-visibility:hidden]'

  return (
    <button
      type="button"
      aria-pressed={flipped}
      aria-label={`${item.title}: ${flipped ? 'voltar ao rótulo' : 'ver detalhes'}`}
      onClick={() => setFlipped((value) => !value)}
      className="block h-92 w-full cursor-pointer text-left outline-none [perspective:1200px] focus-visible:ring-2 focus-visible:ring-ember"
    >
      <span
        className="relative block size-full transition-transform duration-700 ease-out-soft [transform-style:preserve-3d]"
        style={{ transform: flipped ? 'rotateY(180deg)' : undefined }}
      >
        {/* Frente: carcaça cinza, frisos no alto e rótulo de pergaminho. */}
        <span
          className={`${face} flex flex-col bg-[#2a2826] p-4 [clip-path:polygon(0_0,100%_0,100%_100%,6%_100%,0_95%)]`}
        >
          <span className="mb-3 flex items-center justify-between text-xs tracking-[0.12em] text-paper/60 uppercase">
            <span>Cartucho {String(index + 1).padStart(2, '0')}</span>
            <span className="text-ember">{item.tag}</span>
          </span>
          <span className="flex flex-1 flex-col justify-center bg-[#d9cfb8] p-5 text-ink">
            <span className="text-3xl leading-tight font-semibold">{item.title}</span>
            <span className="mt-3 text-sm opacity-70">{item.subtitle}</span>
          </span>
          <span className="mt-3 text-right text-sm text-paper/70">virar ↻</span>
        </span>

        {/* Verso */}
        <span
          className={`${face} flex rotate-y-180 flex-col overflow-hidden border border-[#2a2826] bg-[#d9cfb8] p-6 text-ink`}
        >
          <span className="text-xl leading-tight font-semibold">{item.title}</span>
          <span className="mt-3 leading-snug">{item.description}</span>
          <span className="mt-4 text-xs tracking-[0.12em] uppercase opacity-60">O que fiz</span>
          <span className="mt-2 grid gap-1 text-sm leading-snug">
            {item.highlights.map((highlight) => (
              <span key={highlight} className="block">
                ▸ {highlight}
              </span>
            ))}
          </span>
          <span className="mt-auto text-right text-sm opacity-70">virar de volta ↺</span>
        </span>
      </span>
    </button>
  )
}
