import { useEffect, useRef, useState } from 'react'
import { CERTIFICATES } from '../data/certificates'

/** Altura de rolagem gasta para passar de um certificado ao seguinte, em fração da tela. */
const SCROLL_PER_ITEM = 0.75
/** Tamanho dos blocos longe do centro da tela. */
const FAR_SCALE = 0.62
const ASPECT = 1100 / 778
/* Desvio horizontal e tamanho de cada bloco, para a pilha não ficar alinhada. */
const OFFSETS = [-0.06, 0.05, -0.02, 0.08, -0.08, 0.03, -0.04]
const SIZES = [1, 0.92, 1.04, 0.9, 1, 0.94, 1.02]

const pick = (list: number[], index: number) => list[index % list.length]

/** Blocos colados em uma coluna, como no newmixcoffee.com: crescem ao chegar ao meio da tela. */
export function Certificates() {
  const sectionRef = useRef<HTMLElement>(null)
  const itemsRef = useRef<(HTMLElement | null)[]>([])
  const [active, setActive] = useState(0)
  const certificate = CERTIFICATES[active]
  const count = CERTIFICATES.length

  useEffect(() => {
    const update = () => {
      const section = sectionRef.current
      if (!section) return
      const width = window.innerWidth
      const height = window.innerHeight
      const center = Math.min(Math.max(-section.getBoundingClientRect().top / (height * SCROLL_PER_ITEM), 0), count - 1)
      const narrow = width < 1024
      // Na tela larga a coluna fica à direita do texto; na estreita, acima dele.
      const originX = narrow ? width / 2 : width * 0.58
      const originY = narrow ? height * 0.42 : height / 2
      const baseHeight = Math.min(height * (narrow ? 0.42 : 0.68), (width * (narrow ? 0.88 : 0.52)) / ASPECT)

      const heightOf = (index: number) => {
        const distance = Math.min(Math.abs(index - center), 1.2) / 1.2
        const eased = distance * distance * (3 - 2 * distance)
        return baseHeight * pick(SIZES, index) * (1 - (1 - FAR_SCALE) * eased)
      }
      // Parte do bloco logo acima do centro e empilha os outros colados, para cima e para baixo.
      const first = Math.floor(center)
      const next = Math.min(first + 1, count - 1)
      const firstY = originY - (center - first) * (heightOf(first) / 2 + heightOf(next) / 2)
      const place = (index: number, y: number) => {
        const item = itemsRef.current[index]
        if (!item) return
        const size = heightOf(index)
        const inView = y + size / 2 > -40 && y - size / 2 < height + 40
        item.style.visibility = inView ? 'visible' : 'hidden'
        if (!inView) return
        const x = originX + pick(OFFSETS, index) * (narrow ? width * 0.5 : width * 0.6)
        item.style.width = `${size * ASPECT}px`
        item.style.height = `${size}px`
        item.style.transform = `translate(${x - (size * ASPECT) / 2}px, ${y - size / 2}px)`
        // A cor só aparece perto do centro; o resto fica em preto e branco.
        item.style.filter = `grayscale(${Math.min(Math.abs(index - center) * 1.4, 1)})`
      }
      let y = firstY
      place(first, y)
      for (let index = first + 1; index < count; index++) {
        y += heightOf(index - 1) / 2 + heightOf(index) / 2
        place(index, y)
      }
      y = firstY
      for (let index = first - 1; index >= 0; index--) {
        y -= heightOf(index + 1) / 2 + heightOf(index) / 2
        place(index, y)
      }
      setActive(Math.round(center))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [count])

  return (
    <section
      ref={sectionRef}
      id="certificados"
      style={{ height: `${(count - 1) * SCROLL_PER_ITEM * 100 + 100}svh` }}
      className="relative bg-coal"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {CERTIFICATES.map((item, index) => {
          const content = item.image ? (
            <img src={item.image} alt="" loading="eager" className="size-full object-cover" />
          ) : (
            <span className="flex size-full flex-col justify-center bg-linear-to-b from-[#3a3a3a] to-[#161616] p-[8%] text-center">
              <span className="text-[clamp(16px,2.4vw,34px)] leading-tight font-semibold tracking-[-0.02em]">
                {item.title}
              </span>
              <span className="mt-2 text-xs tracking-[0.14em] uppercase opacity-60">{item.issuer}</span>
            </span>
          )
          const className = 'absolute top-0 left-0 block overflow-hidden will-change-transform'
          const ref = (element: HTMLElement | null) => {
            itemsRef.current[index] = element
          }
          return item.credentialUrl ? (
            <a
              key={item.title}
              ref={ref}
              href={item.credentialUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Ver credencial: ${item.title}`}
              className={className}
            >
              {content}
            </a>
          ) : (
            <div key={item.title} ref={ref} className={className}>
              {content}
            </div>
          )
        })}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-coal to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-linear-to-t from-coal from-60% to-transparent lg:hidden" />

        <h1 className="absolute top-28 left-6 text-[clamp(32px,4vw,60px)] leading-none font-semibold tracking-[-0.04em] lg:top-32 lg:left-10">
          Certificados
        </h1>

        <div
          key={active}
          aria-live="polite"
          className="animate-page-in absolute inset-x-6 bottom-6 lg:right-auto lg:bottom-10 lg:left-10 lg:w-[24vw]"
        >
          <p className="text-xs font-medium tracking-[0.18em] uppercase opacity-60">
            {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </p>
          <h2 className="mt-2 text-xl leading-tight font-semibold tracking-[-0.02em] lg:text-2xl">
            {certificate.title}
          </h2>
          <p className="mt-2 text-sm opacity-65">
            {certificate.issuer}
            {certificate.date && ` · ${certificate.date}`}
          </p>
          {certificate.credentialUrl && (
            <a
              href={certificate.credentialUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block border border-paper/40 px-3 py-1.5 text-sm font-semibold transition-colors hover:border-paper"
            >
              Ver credencial ↗
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
