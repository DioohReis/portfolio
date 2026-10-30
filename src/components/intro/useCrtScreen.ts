import { useEffect } from 'react'
import type { RefObject } from 'react'

interface UseCrtScreenArgs {
  screenRef: RefObject<HTMLDivElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  /** 0 a 1 — aumenta o chiado e apaga o logo durante a transição. */
  boostRef: RefObject<number>
  running: boolean
  text?: string
  fontFamily?: string
}

const ASCII_RAMP = ' .:-=+*#%@'
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'

/** Desenha o chiado da TV e o nome em ASCII dentro do canvas da tela. */
export function useCrtScreen({
  screenRef,
  canvasRef,
  boostRef,
  running,
  text = 'DIOGO A REIS',
  fontFamily = 'Sanguine Frost',
}: UseCrtScreenArgs) {
  useEffect(() => {
    const screen = screenRef.current
    const canvas = canvasRef.current
    if (!running || !screen || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0
    let H = 0
    let cell = 9
    let ascii: string[] = []
    let noise: HTMLCanvasElement
    let noiseCtx: CanvasRenderingContext2D
    let noiseImg: ImageData
    let noiseBuf: Uint32Array
    let raf = 0
    let cancelled = false

    const resize = () => {
      const r = screen.getBoundingClientRect()
      W = r.width
      H = r.height
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      noise = document.createElement('canvas')
      noise.width = Math.ceil(W / 2)
      noise.height = Math.ceil(H / 2)
      noiseCtx = noise.getContext('2d')!
      noiseImg = noiseCtx.createImageData(noise.width, noise.height)
      noiseBuf = new Uint32Array(noiseImg.data.buffer)
    }

    const buildAscii = () => {
      cell = W < 700 ? 7 : 9
      const cols = Math.floor((W * 0.8) / (cell * 0.62))
      const rows = Math.floor((H * 0.5) / cell)
      const S = 4
      const off = document.createElement('canvas')
      off.width = cols * S
      off.height = rows * S * 1.65
      const c = off.getContext('2d', { willReadFrequently: true })
      if (!c || cols < 1 || rows < 1) return
      const words = text.split(' ')
      const lines = W < 700 && words.length > 1 ? [words[0], words.slice(1).join(' ')] : [text]
      const multi = lines.length > 1
      let fs = off.height / (lines.length * (multi ? 1.3 : 1.05))
      c.font = `${fs}px "${fontFamily}"`
      const widest = Math.max(...lines.map((l) => c.measureText(l).width))
      if (widest > off.width * 0.96) {
        fs *= (off.width * 0.96) / widest
        c.font = `${fs}px "${fontFamily}"`
      }
      c.fillStyle = '#fff'
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      lines.forEach((l, i) =>
        c.fillText(l, off.width / 2, off.height / 2 + (i - (lines.length - 1) / 2) * fs * (multi ? 1.18 : 1.02)),
      )

      const d = c.getImageData(0, 0, off.width, off.height).data
      const ch = off.height / rows
      const cw = off.width / cols
      ascii = []
      for (let r = 0; r < rows; r++) {
        let row = ''
        for (let k = 0; k < cols; k++) {
          let sum = 0
          let n = 0
          for (let y = (r * ch) | 0; y < (((r + 1) * ch) | 0); y++) {
            for (let x = (k * cw) | 0; x < (((k + 1) * cw) | 0); x++) {
              sum += d[(y * off.width + x) * 4 + 3]
              n++
            }
          }
          row += ASCII_RAMP[Math.min(ASCII_RAMP.length - 1, Math.round((sum / n / 255) * (ASCII_RAMP.length - 1)))]
        }
        ascii.push(row)
      }
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const boost = boostRef.current ?? 0
      const density = 0.22 + boost * 0.75
      for (let i = 0; i < noiseBuf.length; i++) {
        const g = (Math.random() * 255 * (Math.random() < density ? 1 : 0.12)) | 0
        noiseBuf[i] = 0xff000000 | (g << 16) | (g << 8) | g
      }
      noiseCtx.putImageData(noiseImg, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.globalAlpha = 0.55 + boost * 0.45
      ctx.drawImage(noise, 0, 0, W, H)
      ctx.globalAlpha = 1

      if (ascii.length && boost < 0.9) {
        ctx.font = `${cell * 1.05}px ${MONO}`
        ctx.textBaseline = 'top'
        ctx.textAlign = 'center'
        ctx.fillStyle = `rgba(225,225,225,${0.92 * (1 - boost)})`
        const y0 = H * 0.47 - (ascii.length * cell) / 2
        const glitch = Math.random() < 0.06 ? (Math.random() * ascii.length) | 0 : -1
        ascii.forEach((row, i) => {
          const jitter =
            Math.abs(i - glitch) < 2 && glitch >= 0 ? (Math.random() - 0.5) * 28 : Math.sin(now / 700 + i * 0.4) * 0.6
          ctx.fillText(row, W / 2 + jitter, y0 + i * cell)
        })
      }
    }

    resize()
    raf = requestAnimationFrame(draw)
    document.fonts.load(`100px "${fontFamily}"`).then(() => {
      if (!cancelled) buildAscii()
    })

    // A tela muda de tamanho durante a expansão: o canvas acompanha na hora,
    // o ASCII (mais pesado de calcular) só é refeito quando o tamanho para de mudar.
    let asciiTimer = 0
    const ro = new ResizeObserver(() => {
      resize()
      window.clearTimeout(asciiTimer)
      asciiTimer = window.setTimeout(buildAscii, 150)
    })
    ro.observe(screen)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.clearTimeout(asciiTimer)
      ro.disconnect()
    }
  }, [screenRef, canvasRef, boostRef, running, text, fontFamily])
}
