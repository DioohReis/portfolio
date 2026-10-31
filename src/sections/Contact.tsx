import { useEffect, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import { Contact3D } from '../components/three/Contact3D'
import type { Contact3DHandle } from '../components/three/Contact3D'
import { CONTACT_CREDITS, CONTACT_LINKS } from '../data/contact'
import { SITE_OWNER } from '../data/navigation'
import { playShotgun } from '../lib/shotgunSound'

interface ContactProps {
  reducedMotion: boolean
}

interface Hole {
  id: number
  x: number
  y: number
  turn: number
}

/** Tempo para ver o tiro antes de o link abrir. */
const OPEN_DELAY_MS = 380
const HOLE_LIFE_MS = 2600
const YEAR = new Date().getFullYear()

/** Contato em clima de Doom: a shotgun mira no ponteiro, e atirar em uma placa abre o contato dela. */
export function Contact({ reducedMotion }: ContactProps) {
  const stageRef = useRef<Contact3DHandle>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const crosshairRef = useRef<HTMLDivElement>(null)
  const gunLayerRef = useRef<HTMLDivElement>(null)
  const nextHole = useRef(0)
  const timers = useRef<number[]>([])
  const [holes, setHoles] = useState<Hole[]>([])
  const [hit, setHit] = useState<string | null>(null)
  const [aiming, setAiming] = useState(false)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const later = (action: () => void, delay: number) => {
    timers.current.push(window.setTimeout(action, delay))
  }

  /** O tiro em si: som, coice da arma, tremor e um buraco no ponto da tela. */
  const shoot = (x: number, y: number) => {
    playShotgun()
    stageRef.current?.fire(x, y)
    const rect = sectionRef.current?.getBoundingClientRect()
    const id = nextHole.current++
    const hole = { id, x: x - (rect?.left ?? 0), y: y - (rect?.top ?? 0), turn: (id * 137) % 360 }
    setHoles((current) => [...current.slice(-11), hole])
    later(() => setHoles((current) => current.filter((item) => item.id !== id)), HOLE_LIFE_MS)
    if (!reducedMotion) {
      setShaking(true)
      later(() => setShaking(false), 220)
    }
  }

  const moveCrosshair = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !crosshairRef.current) return
    const rect = sectionRef.current?.getBoundingClientRect()
    crosshairRef.current.style.opacity = '1'
    crosshairRef.current.style.transform = `translate(${event.clientX - (rect?.left ?? 0)}px, ${event.clientY - (rect?.top ?? 0)}px)`
  }

  const openTarget = (event: MouseEvent<HTMLAnchorElement>, label: string, href: string) => {
    // Ctrl+clique continua abrindo direto em outra aba.
    if (event.ctrlKey || event.metaKey || event.shiftKey) return
    event.preventDefault()
    event.stopPropagation()
    const box = event.currentTarget.getBoundingClientRect()
    // Pelo teclado o clique não tem posição: o tiro vai no centro da placa.
    const fromKeyboard = event.detail === 0
    shoot(
      fromKeyboard ? box.left + box.width / 2 : event.clientX,
      fromKeyboard ? box.top + box.height / 2 : event.clientY,
    )
    setHit(label)
    later(() => {
      setHit(null)
      if (href.startsWith('mailto:')) window.location.href = href
      else window.open(href, '_blank', 'noopener,noreferrer')
    }, OPEN_DELAY_MS)
  }

  return (
    <section
      ref={sectionRef}
      id="contato"
      onPointerMove={moveCrosshair}
      onClick={(event) => shoot(event.clientX, event.clientY)}
      className="relative h-svh min-h-160 cursor-crosshair overflow-hidden bg-black select-none [@media(hover:hover)]:cursor-none"
    >
      <div className={`absolute inset-0 ${shaking ? 'animate-shot-shake' : ''}`}>
        <Contact3D
          ref={stageRef}
          gunLayerRef={gunLayerRef}
          reducedMotion={reducedMotion}
          className="absolute inset-0"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(0_0_0/0.72))]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-linear-to-b from-black/80 to-transparent" />
      </div>

      <div className="pointer-events-none absolute top-28 left-6 lg:top-32 lg:left-10">
        <h1 className="text-[clamp(36px,4.5vw,68px)] leading-none font-semibold tracking-[-0.04em]">
          Vamos conversar?
        </h1>
        <p className="mt-2 font-pixel text-[10px] leading-relaxed text-[#ff5a3c]">{'{ MIRE EM UM CONTATO E ATIRE }'}</p>
      </div>

      <ul className="absolute inset-x-6 top-64 grid grid-cols-2 gap-3 lg:inset-x-[12%] lg:top-[38%] lg:grid-cols-4 lg:gap-6">
        {CONTACT_LINKS.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={link.href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noreferrer"
              aria-label={`${link.label}: ${link.handle}`}
              onClick={(event) => openTarget(event, link.label, link.href)}
              onPointerEnter={() => setAiming(true)}
              onPointerLeave={() => setAiming(false)}
              className={`group relative block cursor-crosshair border-4 border-t-[#6f665c] border-r-[#191512] border-b-[#191512] border-l-[#6f665c] bg-[#2d2823] px-2 py-4 text-center shadow-[0_10px_24px_rgb(0_0_0/0.65)] transition-[scale,filter] duration-150 outline-none hover:scale-105 hover:brightness-125 focus-visible:scale-105 focus-visible:brightness-125 [@media(hover:hover)]:cursor-none ${
                hit === link.label ? 'brightness-200' : ''
              }`}
            >
              {['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'right-1 bottom-1'].map((corner) => (
                <span key={corner} className={`absolute size-1.5 bg-[#8d8378] ${corner}`} />
              ))}
              <span className="block font-pixel text-xs text-[#ff4a2c] drop-shadow-[2px_2px_0_#000] lg:text-base">
                {link.label}
              </span>
              <span className="mt-2 block truncate text-[11px] text-paper/80 lg:text-xs">{link.handle}</span>
            </a>
          </li>
        ))}
      </ul>

      {/* A arma fica à frente das placas, sem bloquear o clique nelas. */}
      <div ref={gunLayerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" />

      {/* Buracos de bala. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {holes.map((hole) => (
          <span
            key={hole.id}
            style={{ left: hole.x, top: hole.y, rotate: `${hole.turn}deg` }}
            className="animate-bullet-hole absolute -mt-8 -ml-8 size-16"
          >
            <span className="animate-bullet-spark absolute inset-[-70%] rounded-full bg-[radial-gradient(circle,#fff6d0,#ffae3c_30%,rgb(255_80_20/0.5)_55%,transparent_72%)]" />
            <span className="absolute inset-[34%] rounded-full bg-black shadow-[0_0_0_3px_rgb(30_22_16/0.85),0_0_8px_5px_rgb(0_0_0/0.6)]" />
            <span className="absolute top-[12%] left-[20%] size-1 rounded-full bg-black/80" />
            <span className="absolute right-[12%] bottom-[24%] size-1.5 rounded-full bg-black/80" />
            <span className="absolute bottom-[8%] left-[32%] size-1 rounded-full bg-black/80" />
          </span>
        ))}
      </div>

      <div
        ref={crosshairRef}
        aria-hidden="true"
        style={{ opacity: 0 }}
        className="pointer-events-none absolute top-0 left-0 z-20 hidden [@media(hover:hover)]:block"
      >
        <span
          className={`absolute -top-3 left-0 h-2 w-0.5 -translate-x-1/2 ${aiming ? 'bg-[#ff3a20]' : 'bg-[#7dff5a]'}`}
        />
        <span
          className={`absolute top-1 left-0 h-2 w-0.5 -translate-x-1/2 ${aiming ? 'bg-[#ff3a20]' : 'bg-[#7dff5a]'}`}
        />
        <span
          className={`absolute top-0 -left-3 h-0.5 w-2 -translate-y-1/2 ${aiming ? 'bg-[#ff3a20]' : 'bg-[#7dff5a]'}`}
        />
        <span
          className={`absolute top-0 left-1 h-0.5 w-2 -translate-y-1/2 ${aiming ? 'bg-[#ff3a20]' : 'bg-[#7dff5a]'}`}
        />
      </div>

      <footer className="absolute inset-x-6 bottom-3 flex flex-col gap-0.5 text-[10px] text-paper/50 lg:inset-x-10 lg:flex-row lg:justify-between">
        <span>
          © {YEAR} {SITE_OWNER}
        </span>
        <span className="flex flex-wrap gap-x-3">
          {CONTACT_CREDITS.map((credit) => (
            <a
              key={credit.url}
              href={credit.url}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="hover:underline"
            >
              {credit.title} · {credit.author} · CC BY 4.0
            </a>
          ))}
        </span>
      </footer>
    </section>
  )
}
