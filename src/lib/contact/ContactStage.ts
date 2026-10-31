import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const MAP_URL = '/models/doom-e1m1.glb'
const GUN_URL = '/models/supershotgun.glb'
const FOV = 62
/** Ponto do mapa de onde se olha e para onde. */
const VIEW = { position: new THREE.Vector3(-1056, 41, -3616), look: new THREE.Vector3(-1056, 6, -3300) }
const GUN_Y = -0.3
const RECOIL_DECAY = 0.86
const FLASH_DECAY = 0.72
/** Mapa mais escuro que o original, para os contatos se destacarem. */
const MAP_SHADE = 0.5

/**
 * Fundo e arma da página de contato (classe, sem React): um canto do mapa de Doom e a super shotgun em
 * primeira pessoa, que acompanha a mira e dá o coice no tiro. Só desenha enquanto está visível.
 */
export class ContactStage {
  private renderer: THREE.WebGLRenderer
  /** A arma tem canvas próprio, por cima das placas de contato. */
  private gunRenderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 1, 9000)
  private gunScene = new THREE.Scene()
  private gunCamera = new THREE.PerspectiveCamera(40, 1, 0.01, 20)
  private gun = new THREE.Group()
  private flash: THREE.Sprite
  private mapMaterials: THREE.MeshBasicMaterial[] = []
  private gunLight = new THREE.PointLight(0xffb060, 0, 6, 1.5)
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private container: HTMLElement
  private reducedMotion: boolean
  private onLoaded: () => void
  private frame = 0
  private visible = false
  private disposed = false
  private aimX = 0
  private aimY = 0
  private smoothX = 0
  private smoothY = 0
  private recoil = 0
  private flashLevel = 0
  private gunY = GUN_Y

  constructor(container: HTMLElement, gunContainer: HTMLElement, reducedMotion: boolean, onLoaded: () => void) {
    this.container = container
    this.reducedMotion = reducedMotion
    this.onLoaded = onLoaded
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setClearColor(0x050303)
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.addEventListener('webglcontextlost', () => {
      this.renderer.domElement.style.visibility = 'hidden'
    })
    container.appendChild(this.renderer.domElement)

    this.gunRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    this.gunRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.gunRenderer.domElement.style.display = 'block'
    gunContainer.appendChild(this.gunRenderer.domElement)

    this.scene.fog = new THREE.Fog(0x050303, 500, 2600)
    this.camera.position.copy(VIEW.position)
    this.camera.lookAt(VIEW.look)

    const key = new THREE.DirectionalLight(0xffe8d0, 1.8)
    key.position.set(-1, 2, 2)
    this.gunScene.add(new THREE.HemisphereLight(0xc8c0b8, 0x201814, 1.3), key, this.gunLight, this.gun)

    this.flash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createFlashTexture(),
        transparent: true,
        opacity: 0,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    this.gunScene.add(this.flash)

    window.addEventListener('pointermove', this.handlePointer, { passive: true })
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

  /** Dispara na direção de um ponto da tela, em pixels. */
  fire(x: number, y: number) {
    this.setAim(x, y)
    if (this.reducedMotion) {
      this.smoothX = this.aimX
      this.smoothY = this.aimY
    } else {
      this.recoil = 1
      this.flashLevel = 1
    }
    this.update()
    this.render()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    window.removeEventListener('pointermove', this.handlePointer)
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    const flashMaterial = this.flash.material
    flashMaterial.map?.dispose()
    flashMaterial.dispose()
    for (const scene of [this.scene, this.gunScene]) {
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry.dispose()
        const material = object.material as THREE.MeshStandardMaterial
        material.map?.dispose()
        material.normalMap?.dispose()
        material.metalnessMap?.dispose()
        material.roughnessMap?.dispose()
        material.dispose()
      })
    }
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.gunRenderer.dispose()
    this.gunRenderer.domElement.remove()
  }

  private handlePointer = (event: PointerEvent) => this.setAim(event.clientX, event.clientY)

  private setAim(x: number, y: number) {
    this.aimX = (x / window.innerWidth) * 2 - 1
    this.aimY = (y / window.innerHeight) * 2 - 1
  }

  private async load() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const [{ scene: map }, { scene: gun }] = await Promise.all([loader.loadAsync(MAP_URL), loader.loadAsync(GUN_URL)])
    if (this.disposed) return

    // Texturas sem suavização: os pixels do jogo original ficam à mostra.
    map.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const material = object.material as THREE.MeshBasicMaterial
      material.side = THREE.DoubleSide
      this.mapMaterials.push(material)
      if (material.map) {
        material.map.magFilter = THREE.NearestFilter
        material.map.needsUpdate = true
      }
    })
    this.scene.add(map)

    const box = new THREE.Box3().setFromObject(gun)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    gun.position.sub(center)
    const holder = new THREE.Group()
    holder.add(gun)
    holder.scale.setScalar(1 / Math.max(size.x, size.y, size.z))
    holder.rotation.set(GUN_ROTATION.x, GUN_ROTATION.y, GUN_ROTATION.z)
    this.gun.add(holder)

    this.update()
    this.render()
    this.onLoaded()
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (!width || !height) return
    this.renderer.setSize(width, height)
    this.gunRenderer.setSize(width, height)
    const aspect = width / height
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
    this.gunCamera.aspect = aspect
    this.gunCamera.updateProjectionMatrix()
    // Em tela estreita a arma recua, para continuar inteira.
    this.gunCamera.position.set(0, 0, aspect < 0.8 ? 2.1 : 1.35)
    this.gunY = aspect < 0.8 ? GUN_Y - 0.2 : GUN_Y
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
    const time = performance.now() / 1000
    this.smoothX += (this.aimX - this.smoothX) * 0.14
    this.smoothY += (this.aimY - this.smoothY) * 0.14
    this.recoil *= RECOIL_DECAY
    this.flashLevel *= FLASH_DECAY

    // O balanço de quem está parado, respirando.
    const sway = this.reducedMotion ? 0 : Math.sin(time * 1.6) * 0.006
    this.gun.position.set(
      this.smoothX * 0.1,
      this.gunY + sway - this.smoothY * 0.03 - this.recoil * 0.02,
      this.recoil * 0.22,
    )
    this.gun.rotation.set(-this.smoothY * 0.34 + this.recoil * 0.3, -this.smoothX * 0.52, 0)

    this.camera.lookAt(VIEW.look.x - this.smoothX * 34, VIEW.look.y - this.smoothY * 18, VIEW.look.z)

    // A ponta dos canos, com o giro da arma, é de onde sai o clarão.
    const muzzle = new THREE.Vector3(0, 0.03, -0.72).applyEuler(this.gun.rotation).add(this.gun.position)
    this.flash.position.copy(muzzle)
    this.flash.scale.setScalar(0.45 + this.flashLevel * 0.4)
    this.flash.material.opacity = this.flashLevel > 0.03 ? this.flashLevel : 0
    this.gunLight.position.copy(muzzle)
    this.gunLight.intensity = this.flashLevel * 9
    // O mapa não recebe luz: quem clareia no clarão é a cor dos materiais.
    const shade = MAP_SHADE + this.flashLevel * 0.9
    for (const material of this.mapMaterials) material.color.setScalar(shade)
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
    this.gunRenderer.render(this.gunScene, this.gunCamera)
  }
}

const GUN_ROTATION = new THREE.Euler(-Math.PI / 4, 0, 0)

/** Clarão do tiro, desenhado em canvas: núcleo branco e pontas alaranjadas. */
function createFlashTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')
  if (context) {
    const glow = context.createRadialGradient(128, 128, 4, 128, 128, 128)
    glow.addColorStop(0, 'rgba(255,250,225,1)')
    glow.addColorStop(0.2, 'rgba(255,190,80,0.95)')
    glow.addColorStop(0.55, 'rgba(255,90,20,0.35)')
    glow.addColorStop(1, 'rgba(255,40,0,0)')
    context.fillStyle = glow
    context.translate(128, 128)
    for (let i = 0; i < 9; i++) {
      context.rotate((Math.PI * 2) / 9)
      const reach = 70 + (i % 3) * 26
      context.beginPath()
      context.moveTo(-14, -128 + (128 - 24))
      context.lineTo(0, -reach)
      context.lineTo(14, -128 + (128 - 24))
      context.fill()
    }
    context.beginPath()
    context.arc(0, 0, 58, 0, Math.PI * 2)
    context.fill()
  }
  return new THREE.CanvasTexture(canvas)
}
