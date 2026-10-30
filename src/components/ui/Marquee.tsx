interface MarqueeProps {
  items: string[]
  className?: string
}

/** Faixa com textos correndo em loop (a lista é duplicada para emendar sem corte). */
export function Marquee({ items, className = '' }: MarqueeProps) {
  const row = items.map((item) => `{${item.toUpperCase()}}`)
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-label={items.join(', ')}>
      <div className="flex w-max motion-safe:animate-marquee" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-8 pr-8">
            {[...row, ...row, ...row].map((text, i) => (
              <span key={i}>{text}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
