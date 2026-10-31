import { useEffect, useRef, useState } from 'react'
import { NAV_ITEMS } from '../../data/navigation'
import { playHiss } from '../../lib/hiss'
import { SCENE_READY_EVENT } from '../../lib/sceneReady'
import { useCrtScreen } from './useCrtScreen'

interface ChannelChangeProps {
  path: string
  hash: string
  reducedMotion: boolean
}

const MIN_MS = 1000
/** Sem resposta da cena nesse tempo, a página abre mesmo assim. */
const MAX_MS = 7000
const STATIC_MS = 240
const FADE_MS = 280
/** Páginas cuja cena 3D principal avisa quando carregou. */
const SCENE_PAGES = ['/sobre', '/projetos', '/contato']

/** Troca de canal entre as páginas: chiado, nome da página em ASCII e contador, como a TV da entrada. */
export function ChannelChange({ path, hash, reducedMotion }: ChannelChangeProps) {
  // A página inicial tem a própria TV ao abrir; a troca só aparece ao chegar nela navegando.
  const [showing, setShowing] = useState(path !== '/')
  const [lastPath, setLastPath] = useState(path)
  if (path !== lastPath) {
    setLastPath(path)
    setShowing(true)
  }

  if (reducedMotion || !showing) return null
  return <ChannelScreen key={path} path={path} hash={hash} onDone={() => setShowing(false)} />
}

function ChannelScreen({ path, hash, onDone }: { path: string; hash: string; onDone: () => void }) {
  const screenRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boostRef = useRef(1)
  const onDoneRef = useRef(onDone)
  const [percent, setPercent] = useState(0)
  const [fading, setFading] = useState(false)

  const index = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.href === (hash ? `${path}#${hash}` : path)),
  )
  const channel = NAV_ITEMS[index]

  useCrtScreen({ screenRef, canvasRef, boostRef, running: true, text: channel.label.toUpperCase() })

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  // O contador acompanha o carregamento real da cena, mas leva pelo menos MIN_MS.
  useEffect(() => {
    playHiss({ volume: 0.06, duration: 1 })
    let ready = !SCENE_PAGES.includes(path)
    const markReady = () => {
      ready = true
    }
    window.addEventListener(SCENE_READY_EVENT, markReady)

    const start = performance.now()
    let shown = 0
    let raf = 0
    let fadeTimer = 0
    const loop = (now: number) => {
      // O horário do quadro pode ser anterior ao início medido quando a página nova pesa para montar.
      const elapsed = Math.max(now - start, 0)
      // Começa só no chiado; depois o nome do canal aparece.
      boostRef.current = 1 - Math.min(Math.max((elapsed - STATIC_MS) / 260, 0), 1) * 0.85
      const eased = 1 - Math.pow(1 - Math.min(elapsed / MIN_MS, 1), 2.2)
      const target = Math.min(ready || elapsed > MAX_MS ? 1 : 0.8, eased)
      shown += (target - shown) * 0.2
      if (target >= 1 && shown > 0.99) shown = 1
      setPercent(Math.floor(shown * 100))
      if (shown >= 1) {
        boostRef.current = 1
        setFading(true)
        fadeTimer = window.setTimeout(() => onDoneRef.current(), FADE_MS)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fadeTimer)
      window.removeEventListener(SCENE_READY_EVENT, markReady)
    }
  }, [path])

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-100 bg-ink font-mono transition-opacity duration-280 ease-out-soft ${
        fading ? 'pointer-events-none opacity-0' : ''
      }`}
    >
      <div ref={screenRef} className="crt-scanlines crt-full absolute inset-0 overflow-hidden bg-[#0b0b0b]">
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 z-2 h-[22%] animate-roll bg-linear-to-b from-transparent via-white/[0.035] to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-4 flex flex-col justify-between p-[clamp(20px,4vw,48px)] text-[10px] tracking-[0.08em] text-[#cfcfcf] uppercase sm:text-xs">
          <div className="flex justify-between gap-4 pt-16">
            <span className="text-[clamp(22px,3vw,36px)] tracking-normal text-[#7dff5a]">
              CH {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-right whitespace-nowrap opacity-85">{'{ Sinal: sintonizando }'}</span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <span className="opacity-85">{`{ ${channel.label} }`}</span>
            <span className="text-[clamp(28px,4vw,44px)] tracking-normal text-paper tabular-nums">
              {String(percent).padStart(3, '0')}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
