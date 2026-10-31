import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const URL = '/models/cartridge.glb'
const FOV = 24
const WIDTH = 2.1
const SPIN_SECONDS = 1.3
const TEXTURE_SIZE = 2048
/* Áreas na textura original (imagem de 1024 px): o rótulo e a marca em relevo logo abaixo dele. */
const LABEL = { x: 108, y: 416, width: 429, height: 226 }
const MARK = { x: 195, y: 646, width: 265, height: 30 }
const SHELL_COLOR = '#2a2a2a'

export interface CartridgeLabel {
  title: string
  text: string
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/** Cartucho flutuando (classe, sem React), com o rótulo repintado com o texto do site. Gira no clique. */
export class CartridgeStage {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
  private group = new THREE.Group()
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private container: HTMLElement
  private reducedMotion: boolean
  private label: CartridgeLabel
  private onLoaded: () => void
  private frame = 0
  private visible = false
  private disposed = false
  private spinStart = -1
  private spinTurns = 0

  constructor(container: HTMLElement, label: CartridgeLabel, reducedMotion: boolean, onLoaded: () => void) {
    this.container = container
    this.label = label
    this.reducedMotion = reducedMotion
    this.onLoaded = onLoaded
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.domElement.style.display = 'block'
    container.appendChild(this.renderer.domElement)

    const key = new THREE.DirectionalLight(0xfff0e0, 2.4)
    key.position.set(-1, 2, 4)
    this.scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x3a2a20, 1.6), key, this.group)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.visibilityObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting
      if (this.visible) this.play()
      else cancelAnimationFrame(this.frame)
    })
    this.visibilityObserver.observe(container)

    this.resize()
    this.load()
  }

  spin() {
    if (this.reducedMotion) return
    if (this.spinStart < 0) this.spinStart = performance.now() / 1000
    this.spinTurns += 1
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const material = object.material as THREE.MeshStandardMaterial
      material.map?.dispose()
      material.normalMap?.dispose()
      material.metalnessMap?.dispose()
      material.dispose()
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private async load() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const [{ scene: model }] = await Promise.all([
      loader.loadAsync(URL),
      document.fonts.load('32px "Press Start 2P"'),
      document.fonts.load('40px "VT323"'),
    ])
    if (this.disposed) return

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const material = object.material as THREE.MeshStandardMaterial
      if (material.map) material.map = paintLabel(material.map, this.label)
      if (material.normalMap) material.normalMap = flattenMark(material.normalMap)
    })
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const holder = new THREE.Group()
    model.position.sub(center)
    holder.add(model)
    holder.scale.setScalar(WIDTH / size.x)
    this.group.add(holder)

    this.onLoaded()
    this.render()
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (!width || !height) return
    this.renderer.setSize(width, height)
    const aspect = width / height
    const visible = Math.max(1.75, 2.4 / aspect)
    this.camera.aspect = aspect
    this.camera.position.set(0, 0, visible / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)))
    this.camera.updateProjectionMatrix()
    this.render()
  }

  private play() {
    cancelAnimationFrame(this.frame)
    if (this.reducedMotion) {
      this.group.rotation.set(0.05, -0.2, 0)
      this.render()
      return
    }
    const tick = () => {
      if (!this.visible || this.disposed) return
      this.update()
      this.render()
      this.frame = requestAnimationFrame(tick)
    }
    this.frame = requestAnimationFrame(tick)
  }

  private update() {
    const time = performance.now() / 1000
    let spinAngle = 0
    if (this.spinStart >= 0) {
      const duration = SPIN_SECONDS + (this.spinTurns - 1) * 0.5
      const progress = Math.min((time - this.spinStart) / duration, 1)
      spinAngle = easeInOut(progress) * this.spinTurns * Math.PI * 2
      if (progress >= 1) {
        this.spinStart = -1
        this.spinTurns = 0
        spinAngle = 0
      }
    }
    this.group.rotation.set(
      Math.sin(time * 0.6) * 0.05,
      Math.sin(time * 0.4) * 0.16 + spinAngle,
      Math.sin(time * 0.5) * 0.02,
    )
    this.group.position.y = Math.sin(time * 0.8) * 0.025
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }
}

/** Redesenha a textura trocando o rótulo original pelo do site e apagando a marca em relevo. */
function paintLabel(original: THREE.Texture, label: CartridgeLabel) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = TEXTURE_SIZE
  const context = canvas.getContext('2d')
  if (!context) return original
  const scale = TEXTURE_SIZE / 1024
  context.drawImage(original.image as CanvasImageSource, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  context.scale(scale, scale)

  context.fillStyle = SHELL_COLOR
  context.fillRect(MARK.x, MARK.y, MARK.width, MARK.height)

  // O rótulo fica espelhado na vertical na textura.
  context.translate(LABEL.x, LABEL.y + LABEL.height)
  context.scale(1, -1)
  const { width, height } = LABEL
  context.fillStyle = '#9bbc0f'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#0f380f'
  context.fillRect(0, 0, width, 38)
  context.fillStyle = '#9bbc0f'
  context.font = '13px "Press Start 2P"'
  context.textBaseline = 'middle'
  context.fillText('DIOGO A. REIS', 16, 20)
  context.fillStyle = '#0f380f'
  context.textBaseline = 'alphabetic'
  context.font = '17px "Press Start 2P"'
  let y = wrap(context, label.title, 16, 72, width - 32, 26)
  context.font = '27px "VT323"'
  y = wrap(context, label.text, 16, y + 10, width - 32, 26)

  const texture = new THREE.CanvasTexture(canvas)
  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  original.dispose()
  return texture
}

/** Tira do relevo a marca do modelo, pintando a área com a cor de uma superfície lisa. */
function flattenMark(original: THREE.Texture) {
  const image = original.image as CanvasImageSource & { width: number; height: number }
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')
  if (!context) return original
  const scale = image.width / 1024
  context.drawImage(image, 0, 0)
  context.fillStyle = 'rgb(128 128 255)'
  context.fillRect(MARK.x * scale, MARK.y * scale, MARK.width * scale, MARK.height * scale)
  const texture = new THREE.CanvasTexture(canvas)
  texture.flipY = false
  texture.colorSpace = THREE.NoColorSpace
  original.dispose()
  return texture
}

/** Escreve o texto quebrando as linhas; devolve a altura da linha seguinte. */
function wrap(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, line: number) {
  let current = ''
  let top = y
  for (const word of text.split(' ')) {
    const next = current ? `${current} ${word}` : word
    if (context.measureText(next).width > width && current) {
      context.fillText(current, x, top)
      current = word
      top += line
    } else current = next
  }
  context.fillText(current, x, top)
  return top + line
}
