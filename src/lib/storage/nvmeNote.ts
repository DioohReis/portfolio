import * as THREE from 'three'
import type { StorageModel } from './StorageStage'

/** Área da etiqueta no modelo: da parte logo depois dos contatos até a outra ponta da placa. */
const STICKER = { left: -2.1, right: 4.95, bottom: -1.03, top: 0.86, z: 0.045 }
/** O modelo vem em metros, com a placa 100 vezes menor que as medidas acima. */
const MODEL_SCALE = 0.01
const PIXELS_PER_UNIT = 260
/** Abaixo disso a etiqueta ficaria pequena demais para ler; o texto completo aparece embaixo do SSD. */
const COMPACT_WIDTH = 640

export interface NvmeNoteText {
  before: string
  circled: string
  after: string
}

/** SSD NVMe com o bilhete do site impresso numa etiqueta sobre os chips. */
export function nvmeNote(note: NvmeNoteText): StorageModel {
  const canvas = document.createElement('canvas')
  canvas.width = (STICKER.right - STICKER.left) * PIXELS_PER_UNIT
  canvas.height = (STICKER.top - STICKER.bottom) * PIXELS_PER_UNIT
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  let compact: boolean | null = null

  const paint = () => {
    const nextCompact = window.innerWidth < COMPACT_WIDTH
    if (nextCompact === compact) return
    compact = nextCompact
    paintSticker(canvas, note, nextCompact)
    texture.needsUpdate = true
  }

  return {
    url: '/models/nvme-ssd.glb',
    count: 1,
    columns: () => 1,
    tilt: [-0.22, -0.12],
    ready: document.fonts.load('500 32px "Space Grotesk Variable"').then(paint),
    dress(model) {
      const sticker = new THREE.Mesh(
        new THREE.PlaneGeometry(STICKER.right - STICKER.left, STICKER.top - STICKER.bottom),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 }),
      )
      sticker.position.set((STICKER.left + STICKER.right) / 2, (STICKER.bottom + STICKER.top) / 2, STICKER.z)
      sticker.position.multiplyScalar(MODEL_SCALE)
      sticker.scale.setScalar(MODEL_SCALE)
      model.add(sticker)
    },
    repaint: paint,
  }
}

function paintSticker(canvas: HTMLCanvasElement, note: NvmeNoteText, compact: boolean) {
  const context = canvas.getContext('2d')
  if (!context) return
  const { width, height } = canvas
  context.fillStyle = '#17181c'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#f0924a'
  context.fillRect(0, 0, 18, height)

  context.fillStyle = '#ededed'
  context.textBaseline = 'alphabetic'
  if (compact) {
    context.font = '500 150px "Space Grotesk Variable"'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(note.circled, width / 2, height / 2)
    context.textAlign = 'left'
    return
  }

  const words = [
    ...note.before.split(' ').map((text) => ({ text, circled: false })),
    { text: note.circled, circled: true },
    ...note.after.split(' ').map((text) => ({ text, circled: false })),
  ]
  const margin = 70
  // Diminui a letra até o bilhete inteiro caber na etiqueta.
  let size = 84
  let placed = flow(context, words, size, width - margin * 2)
  while (placed.lines * size * 1.32 > height - 60 && size > 30) {
    size -= 2
    placed = flow(context, words, size, width - margin * 2)
  }
  const line = size * 1.32
  const top = (height - placed.lines * line) / 2 + size
  context.font = `500 ${size}px "Space Grotesk Variable"`
  for (const word of placed.words) {
    const y = top + word.line * line
    context.fillStyle = '#ededed'
    context.fillText(word.text, margin + word.x, y)
    if (!word.circled) continue
    context.strokeStyle = '#7dd3a8'
    context.lineWidth = 5
    context.beginPath()
    context.ellipse(
      margin + word.x + word.width / 2,
      y - size * 0.32,
      word.width / 2 + 18,
      size * 0.74,
      0,
      0,
      Math.PI * 2,
    )
    context.stroke()
  }
}

/** Distribui as palavras em linhas, com folga em volta do trecho circulado. */
function flow(
  context: CanvasRenderingContext2D,
  words: { text: string; circled: boolean }[],
  size: number,
  maxWidth: number,
) {
  context.font = `500 ${size}px "Space Grotesk Variable"`
  const space = context.measureText(' ').width
  const placed: { text: string; circled: boolean; x: number; width: number; line: number }[] = []
  let x = 0
  let line = 0
  for (const { text, circled } of words) {
    const width = context.measureText(text).width
    const pad = circled ? 26 : 0
    if (x > 0 && x + pad + width > maxWidth) {
      x = 0
      line += 1
    }
    placed.push({ text, circled, x: x + pad, width, line })
    x += pad * 2 + width + space
  }
  return { words: placed, lines: line + 1 }
}
