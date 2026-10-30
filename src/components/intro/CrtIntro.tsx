import { useCallback, useEffect, useRef, useState } from 'react'
import { playHiss } from '../../lib/hiss'
import { useCrtScreen } from './useCrtScreen'

type Stage = 'loading' | 'ready' | 'expanding' | 'fading'

interface CrtIntroProps {
  /** true quando as partículas e a fonte terminaram de carregar. */
  assetsReady: boolean
  reducedMotion: boolean
  /** Chamado quando a TV ocupa a tela toda: hora de começar o chiado das partículas. */
  onEnter: () => void
  /** Chamado quando a TV terminou de sumir e pode sair da página. */
  onFinished: () => void
}

const MIN_LOADING_MS = 1900
const EXPAND_MS = 760
const FADE_MS = 720

export function CrtIntro({ assetsReady, reducedMotion, onEnter, onFinished }: CrtIntroProps) {
  const screenRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [stage, setStage] = useState<Stage>('loading')
  const [percent, setPercent] = useState(0)
  const boostRef = useRef(0)

  useCrtScreen({ screenRef, canvasRef, boostRef, running: stage !== 'fading' })

  // Contador: acompanha o carregamento real, mas leva pelo menos MIN_LOADING_MS.
  const readyRef = useRef(assetsReady)
  useEffect(() => {
    readyRef.current = assetsReady
  }, [assetsReady])

  useEffect(() => {
    const start = performance.now()
    let shown = 0
    let raf = 0
    const loop = (now: number) => {
      const timeP = Math.min(1, (now - start) / MIN_LOADING_MS)
      const eased = 1 - Math.pow(1 - timeP, 2.2)
      const real = readyRef.current ? 1 : 0.35
      const target = Math.min(real, eased)
      shown += (target - shown) * 0.18
      if (target >= 1 && shown > 0.995) shown = 1
      setPercent(Math.floor(shown * 100))
      if (shown >= 1) {
        setStage('ready')
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (stage === 'ready') buttonRef.current?.focus({ preventScroll: true })
  }, [stage])

  const enter = useCallback(() => {
    if (stage !== 'ready') return
    setStage('expanding')
    playHiss()
    const t0 = performance.now()
    const ramp = (now: number) => {
      boostRef.current = Math.min(1, (now - t0) / 450)
      if (boostRef.current < 1) requestAnimationFrame(ramp)
    }
    requestAnimationFrame(ramp)
  }, [stage])

  // Sequência depois do clique: expande → começa o chiado das partículas → some.
  useEffect(() => {
    if (stage === 'expanding') {
      const t = window.setTimeout(
        () => {
          onEnter()
          setStage('fading')
        },
        reducedMotion ? 50 : EXPAND_MS,
      )
      return () => window.clearTimeout(t)
    }
    if (stage === 'fading') {
      const t = window.setTimeout(onFinished, FADE_MS)
      return () => window.clearTimeout(t)
    }
  }, [stage, reducedMotion, onEnter, onFinished])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage === 'ready' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        enter()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage, enter])

  const expanded = stage === 'expanding' || stage === 'fading'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tela de entrada"
      className={`fixed inset-0 z-100 bg-ink font-mono transition-opacity duration-700 ease-out-soft ${
        stage === 'fading' ? 'pointer-events-none opacity-0' : ''
      }`}
    >
      <div
        ref={screenRef}
        onClick={enter}
        className={`crt-scanlines absolute overflow-hidden bg-[#0b0b0b] transition-[inset,border-radius] duration-750 ease-crt motion-safe:animate-flicker ${
          expanded ? 'crt-full inset-0 rounded-none' : 'inset-[3.5vh_3vw] rounded-[5%/9%]'
        } ${stage === 'ready' ? 'cursor-pointer' : ''}`}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 z-2 h-[22%] bg-linear-to-b from-transparent via-white/[0.035] to-transparent motion-safe:animate-roll" />

        <div
          className={`pointer-events-none absolute inset-0 z-4 flex flex-col justify-between p-[clamp(20px,4vw,48px)] text-[10px] tracking-[0.08em] sm:text-xs text-[#cfcfcf] uppercase transition-opacity duration-300 ${
            expanded ? 'opacity-0' : ''
          }`}
        >
          <div className="flex justify-between gap-4">
            <span className="whitespace-nowrap">{'{ Portfólio · 2026 }'}</span>
            <span className="text-right whitespace-nowrap opacity-55">
              {stage === 'loading' ? '{ Sinal: sintonizando }' : '{ Sinal: OK }'}
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <span className="opacity-55">
              {'{ CH 03 }'}
              <br />
              {'{ São Paulo / BR }'}
            </span>
            <span className="text-[clamp(28px,4vw,44px)] tracking-normal text-paper tabular-nums" aria-live="polite">
              {String(percent).padStart(3, '0')}%
            </span>
          </div>
        </div>

        <div
          className={`absolute bottom-[clamp(64px,13vh,120px)] left-1/2 z-5 flex -translate-x-1/2 flex-col items-center gap-2.5 transition-opacity duration-500 ${
            stage === 'ready' ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <button
            ref={buttonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              enter()
            }}
            tabIndex={stage === 'ready' ? 0 : -1}
            className="cursor-pointer bg-paper px-3.5 py-2 text-[13px] tracking-widest whitespace-nowrap text-ink uppercase outline-none hover:animate-none focus-visible:animate-none motion-safe:animate-blink"
          >
            [ Clique para entrar ]
          </button>
          <span className="text-[11px] opacity-55">( som recomendado )</span>
        </div>
      </div>
    </div>
  )
}
