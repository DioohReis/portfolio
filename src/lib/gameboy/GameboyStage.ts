import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const URL = '/models/gameboy.glb'
const FOV = 26
/** Altura do Game Boy e o quanto da cena precisa caber na tela. */
const MODEL_HEIGHT = 1.9
const VIEW_HEIGHT = 3
const PIVOT_Y = 1.75
const SPIN_SECONDS = 1.3
const PHOTO_URL = '/images/diogo-gameboy.jpg'
const PHOTO_WIDTH = 320
/** Centro e tamanho da área visível do visor, nas medidas do modelo. */
const SCREEN = { x: 0.05, y: 10.15, z: 1.17, width: 7.2, height: 6.3 }

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Game Boy pendurado por um cordão na seção Sobre (classe, sem React). Balança e gira de leve sozinho,
 * sem seguir o mouse, e dá uma volta no clique. Só desenha enquanto está visível.
 */
export class GameboyStage {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
  private swing = new THREE.Group()
  private device = new THREE.Group()
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private container: HTMLElement
  private reducedMotion: boolean
  private onLoaded: () => void
  private frame = 0
  private visible = false
  private disposed = false
  private spinStart = -1
  private spinTurns = 0

  constructor(container: HTMLElement, reducedMotion: boolean, onLoaded: () => void) {
    this.container = container
    this.reducedMotion = reducedMotion
    this.onLoaded = onLoaded
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.domElement.style.display = 'block'
    container.appendChild(this.renderer.domElement)

    const key = new THREE.DirectionalLight(0xfff0e0, 2.2)
    key.position.set(1.5, 2.5, 4)
    const ember = new THREE.PointLight(0xff8a3c, 6, 8, 1.6)
    ember.position.set(-1.6, -1.6, 1.5)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x3a2a20, 1.2), key, ember)

    // O cordão sai do ponto de apoio, acima da tela, e desce até o aparelho.
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 2.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9 }),
    )
    cord.position.y = PIVOT_Y - 0.15
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.012, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xc8c0b0, roughness: 0.3, metalness: 0.9 }),
    )
    ring.position.y = MODEL_HEIGHT / 2 + 0.03
    this.device.add(ring)
    this.swing.add(cord, this.device)
    this.swing.position.y = PIVOT_Y
    this.device.position.y = -PIVOT_Y
    cord.position.y = 1.3 - 0.0 - (PIVOT_Y - (MODEL_HEIGHT / 2 + 0.07))
    this.scene.add(this.swing)

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

  /** Dá uma volta completa; cliques seguidos somam voltas. */
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
      material.emissiveMap?.dispose()
      material.dispose()
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private async load() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const { scene: model } = await loader.loadAsync(URL)
    if (this.disposed) return

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      // Todas as peças vêm marcadas como transparentes, o que embaralha a ordem delas ao girar: só o vidro é.
      const glass = object.name.startsWith('Object001')
      object.material = (object.material as THREE.Material).clone()
      object.material.transparent = glass
      object.material.depthWrite = !glass
    })
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = MODEL_HEIGHT / size.y
    const holder = new THREE.Group()
    model.position.sub(center)
    holder.add(model)
    holder.add(createScreen(center, () => this.render()))
    holder.scale.setScalar(scale)
    this.device.add(holder)

    this.onLoaded()
    this.render()
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (!width || !height) return
    this.renderer.setSize(width, height)
    const aspect = width / height
    const visible = Math.max(VIEW_HEIGHT, 1.6 / aspect)
    this.camera.aspect = aspect
    this.camera.position.set(0, 0.1, visible / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)))
    this.camera.lookAt(0, 0.1, 0)
    this.camera.updateProjectionMatrix()
    this.render()
  }

  private play() {
    cancelAnimationFrame(this.frame)
    if (this.reducedMotion) {
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

    // Duas ondas lentas somadas: o balanço não fica repetitivo.
    this.swing.rotation.z = Math.sin(time * 0.9) * 0.045 + Math.sin(time * 0.37) * 0.02
    this.device.rotation.y = spinAngle + Math.sin(time * 0.45) * 0.28
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }
}

/** Tela do Game Boy: a foto nos tons de verde do visor original, com os pixels aparentes. */
function createScreen(modelCenter: THREE.Vector3, onReady: () => void) {
  const canvas = document.createElement('canvas')
  canvas.width = PHOTO_WIDTH
  canvas.height = Math.round((PHOTO_WIDTH * SCREEN.height) / SCREEN.width)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter

  if (context) {
    context.fillStyle = '#9bbc0f'
    context.fillRect(0, 0, canvas.width, canvas.height)
    const photo = new Image()
    photo.onload = () => {
      context.drawImage(photo, 0, 0, canvas.width, canvas.height)
      const image = context.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = image.data
      for (let i = 0; i < pixels.length; i += 4) {
        const light = (pixels[i] * 0.3 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.11) / 255
        // Clareia as sombras: a foto é escura e o visor tem pouco contraste.
        const tone = Math.pow(light, 0.7)
        pixels[i] = 15 + tone * 140
        pixels[i + 1] = 56 + tone * 132
        pixels[i + 2] = 15 + tone * 15
      }
      context.putImageData(image, 0, 0)
      texture.needsUpdate = true
      onReady()
    }
    photo.src = PHOTO_URL
  }

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(SCREEN.width, SCREEN.height),
    new THREE.MeshBasicMaterial({ map: texture }),
  )
  screen.position.set(SCREEN.x - modelCenter.x, SCREEN.y - modelCenter.y, SCREEN.z - modelCenter.z)
  return screen
}
