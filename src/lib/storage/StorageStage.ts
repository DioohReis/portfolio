import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const FOV = 24
const SPIN_SECONDS = 1.3
const GAP = 0.12

/** O que muda entre os componentes: qual modelo, quantas cópias e como cada uma é pintada. */
export interface StorageModel {
  url: string
  count: number
  /** Quantas colunas cabem na proporção da tela. */
  columns: (aspect: number) => number
  /** Inclinação de repouso, para o volume aparecer. */
  tilt: [number, number]
  /** Fontes e o que mais precisar estar pronto antes de pintar. */
  ready?: Promise<unknown>
  dress: (model: THREE.Object3D, index: number) => void
  /** Chamado quando a janela muda de tamanho, para repintar o que depender dela. */
  repaint?: () => void
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

interface Piece {
  group: THREE.Group
  spinStart: number
}

/** Peças de hardware flutuando lado a lado (classe, sem React). Clicar em uma faz ela girar. */
export class StorageStage {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
  private raycaster = new THREE.Raycaster()
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private container: HTMLElement
  private model: StorageModel
  private reducedMotion: boolean
  private onLoaded: () => void
  private pieces: Piece[] = []
  private pieceSize = new THREE.Vector2(1, 1)
  private frame = 0
  private visible = false
  private disposed = false

  constructor(container: HTMLElement, model: StorageModel, reducedMotion: boolean, onLoaded: () => void) {
    this.container = container
    this.model = model
    this.reducedMotion = reducedMotion
    this.onLoaded = onLoaded
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.domElement.style.display = 'block'
    container.appendChild(this.renderer.domElement)

    const key = new THREE.DirectionalLight(0xfff0e0, 2.6)
    key.position.set(-1, 2, 4)
    const rim = new THREE.DirectionalLight(0xbcd0ff, 1.4)
    rim.position.set(2, -1, 2)
    this.scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x3a2a20, 1.8), key, rim)

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

  /** Gira a peça que estiver embaixo do ponto clicado. */
  spinAt(clientX: number, clientY: number) {
    if (this.reducedMotion) return
    const rect = this.container.getBoundingClientRect()
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((clientY - rect.top) / rect.height) * 2,
    )
    this.raycaster.setFromCamera(pointer, this.camera)
    const hit = this.raycaster.intersectObjects(this.pieces.map((piece) => piece.group))[0]
    if (!hit) return
    const piece = this.pieces.find(({ group }) => {
      let found = false
      group.traverse((object) => {
        if (object === hit.object) found = true
      })
      return found
    })
    if (piece && piece.spinStart < 0) piece.spinStart = performance.now() / 1000
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
      material.dispose()
    })
    // Sem isto o navegador só devolve o contexto gráfico quando quiser.
    this.renderer.forceContextLoss()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private async load() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const [{ scene: original }] = await Promise.all([loader.loadAsync(this.model.url), this.model.ready])
    if (this.disposed) return

    const box = new THREE.Box3().setFromObject(original)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = 1 / Math.max(size.x, size.y)
    this.pieceSize.set(size.x * scale, size.y * scale)

    for (let index = 0; index < this.model.count; index++) {
      const model = original.clone()
      this.model.dress(model, index)
      model.position.sub(center)
      const holder = new THREE.Group()
      holder.scale.setScalar(scale)
      holder.add(model)
      const group = new THREE.Group()
      group.add(holder)
      this.scene.add(group)
      this.pieces.push({ group, spinStart: -1 })
    }

    this.resize()
    this.onLoaded()
    if (this.visible) this.play()
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (!width || !height) return
    this.renderer.setSize(width, height)
    this.model.repaint?.()
    const aspect = width / height
    const count = this.model.count
    const columns = Math.min(this.model.columns(aspect), count)
    const rows = Math.ceil(count / columns)
    const cellWidth = this.pieceSize.x + GAP
    const cellHeight = this.pieceSize.y + GAP
    this.pieces.forEach(({ group }, index) => {
      const row = Math.floor(index / columns)
      const inRow = row === rows - 1 ? count - row * columns : columns
      group.position.x = ((index % columns) - (inRow - 1) / 2) * cellWidth
      group.position.y = ((rows - 1) / 2 - row) * cellHeight
    })
    const visible = Math.max((columns * cellWidth) / aspect, rows * cellHeight)
    this.camera.aspect = aspect
    this.camera.position.set(0, 0, (visible * 1.04) / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)))
    this.camera.updateProjectionMatrix()
    this.update()
    this.render()
  }

  private play() {
    cancelAnimationFrame(this.frame)
    if (this.reducedMotion) {
      this.update()
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
    const [tiltX, tiltY] = this.model.tilt
    const time = this.reducedMotion ? 0 : performance.now() / 1000
    this.pieces.forEach((piece, index) => {
      const { group } = piece
      let spin = 0
      if (piece.spinStart >= 0) {
        const progress = Math.min((performance.now() / 1000 - piece.spinStart) / SPIN_SECONDS, 1)
        spin = easeInOut(progress) * Math.PI * 2
        if (progress >= 1) piece.spinStart = -1
      }
      const phase = index * 1.3
      group.rotation.x = tiltX + Math.sin(time * 0.6 + phase) * 0.05
      group.rotation.y = tiltY + Math.sin(time * 0.4 + phase) * 0.12 + spin
    })
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }
}
