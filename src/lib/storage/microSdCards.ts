import * as THREE from 'three'
import type { StorageModel } from './StorageStage'

/** Frente e verso do cartão na textura original (imagem de 1024 x 512), onde ficam as marcas e os textos. */
const FRONT = { x: 106, y: 92, width: 240, height: 250 }
const BACK = { x: 700, y: 106, width: 260, height: 190 }
const CARD_COLOR = '#141414'
const BAND_COLORS = ['#6fbf3f', '#d8302f']
/** A foto do cartão fica achatada na textura: 1 px na largura vale menos que 1 px na altura. */
const STRETCH = 1.34

/** Cartões micro-SD com um texto do site no lugar das marcas impressas. */
export function microSdCards(labels: string[]): StorageModel {
  return {
    url: '/models/micro-sd.glb',
    count: labels.length,
    columns: (aspect) => (aspect >= 1.5 ? labels.length : 2),
    tilt: [-0.08, -0.14],
    ready: document.fonts.load('600 32px "Space Grotesk Variable"'),
    dress(model, index) {
      let painted: THREE.Texture | null = null
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        const material = (object.material as THREE.MeshStandardMaterial).clone()
        if (material.map) {
          painted ??= paintCard(material.map, labels[index], index)
          material.map = painted
        }
        object.material = material
      })
    },
  }
}

function paintCard(original: THREE.Texture, label: string, index: number) {
  const image = original.image as CanvasImageSource & { width: number; height: number }
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const context = canvas.getContext('2d')
  if (!context) return original
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  context.scale(canvas.width / 1024, canvas.height / 512)

  context.fillStyle = CARD_COLOR
  context.fillRect(BACK.x, BACK.y, BACK.width, BACK.height)
  context.fillRect(FRONT.x, FRONT.y, FRONT.width, FRONT.height)

  // A frente fica espelhada na horizontal na textura.
  context.translate(FRONT.x + FRONT.width / 2, FRONT.y + FRONT.height / 2)
  context.scale(-STRETCH, 1)
  const width = FRONT.width / STRETCH
  const left = -width / 2
  const top = -FRONT.height / 2

  context.fillStyle = BAND_COLORS[index % BAND_COLORS.length]
  context.fillRect(left, top, width, 96)
  context.fillStyle = CARD_COLOR
  context.font = '600 62px "Space Grotesk Variable"'
  context.textBaseline = 'middle'
  context.fillText(String(index + 1).padStart(2, '0'), left + 12, top + 50)

  context.fillStyle = '#ededed'
  context.textBaseline = 'alphabetic'
  context.font = '600 25px "Space Grotesk Variable"'
  let y = top + 140
  let line = ''
  for (const word of label.toUpperCase().split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (context.measureText(next).width > width - 24 && line) {
      context.fillText(line, left + 12, y)
      y += 32
      line = word
    } else line = next
  }
  context.fillText(line, left + 12, y)

  const texture = new THREE.CanvasTexture(canvas)
  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}
