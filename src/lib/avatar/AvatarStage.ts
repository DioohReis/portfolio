import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

interface AvatarStageOptions {
  url: string
  reducedMotion: boolean
  onLoaded?: () => void
}

/** Largura que precisa caber na tela (ombros e mangas), em unidades do modelo. */
const FIT_WIDTH = 1.75
/** Altura visível mínima: do corte da cintura até um pouco acima do cabelo. */
const FIT_HEIGHT = 2.25
/** O modelo termina na cintura; a base da tela fica logo acima para esconder o corte. */
const BOTTOM_Y = 0.06
const FOV = 24
const SPIN_SECONDS = 1.3

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Avatar 3D do Sobre (classe, sem React). A malha é única e sem esqueleto, então o movimento
 * é do grupo inteiro: flutua, gira um pouco com o mouse e o scroll e dá uma volta no clique.
 * Só desenha enquanto está visível.
 */
export class AvatarStage {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)
  private group = new THREE.Group()
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private frame = 0
  private visible = false
  private disposed = false
  private pointerX = 0
  private pointerY = 0
  private yaw = 0
  private pitch = 0
  private spinStart = -1
  private spinTurns = 0

  private container: HTMLElement
  private options: AvatarStageOptions

  constructor(container: HTMLElement, options: AvatarStageOptions) {
    this.container = container
    this.options = options
    this.renderer =new THREE.WebGLRenderer({ alpha: true, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.display = 'block'
    this.scene.add(this.group)

    // Luz de frente para o rosto e duas de trás para o preto do cabelo e da camiseta não sumir no fundo.
    const key = new THREE.DirectionalLight(0xfff4e8, 2.4)
    key.position.set(1.5, 3, 4)
    const rimLeft = new THREE.DirectionalLight(0xffffff, 3)
    rimLeft.position.set(-3, 2.5, -3)
    const rimRight = new THREE.DirectionalLight(0xffffff, 3)
    rimRight.position.set(3, 2.5, -3)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.5), key, rimLeft, rimRight)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.visibilityObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting
      if (this.visible) this.play()
      else cancelAnimationFrame(this.frame)
    })
    this.visibilityObserver.observe(container)
    window.addEventListener('pointermove', this.handlePointer, { passive: true })

    this.resize()
    this.load()
  }

  /** Dá uma volta completa; cliques seguidos somam voltas. */
  spin() {
    if (this.options.reducedMotion) return
    if (this.spinStart < 0) this.spinStart = performance.now() / 1000
    this.spinTurns += 1
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    window.removeEventListener('pointermove', this.handlePointer)
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const material = object.material as THREE.MeshStandardMaterial
      material.map?.dispose()
      material.normalMap?.dispose()
      material.metalnessMap?.dispose()
      material.roughnessMap?.dispose()
      material.dispose()
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private handlePointer = (event: PointerEvent) => {
    this.pointerX = (event.clientX / window.innerWidth) * 2 - 1
    this.pointerY = (event.clientY / window.innerHeight) * 2 - 1
  }

  private async load() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const gltf = await loader.loadAsync(this.options.url)
    if (this.disposed) return

    const meshes: THREE.Mesh[] = []
    gltf.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) meshes.push(object)
    })
    for (const mesh of meshes) {
      const outline = new THREE.Mesh(mesh.geometry, createOutlineMaterial())
      mesh.add(outline)
    }
    this.group.add(gltf.scene)
    this.options.onLoaded?.()
    this.render()
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (!width || !height) return
    this.renderer.setSize(width, height)
    const aspect = width / height
    const visibleHeight = Math.max(FIT_HEIGHT, FIT_WIDTH / aspect)
    const distance = visibleHeight / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    const centerY = BOTTOM_Y + visibleHeight / 2
    this.camera.aspect = aspect
    this.camera.position.set(0, centerY, distance)
    this.camera.lookAt(0, centerY, 0)
    this.camera.updateProjectionMatrix()
    this.render()
  }

  private play() {
    cancelAnimationFrame(this.frame)
    if (this.options.reducedMotion) {
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
    const rect = this.container.getBoundingClientRect()
    // -1 quando a seção está entrando por baixo, 0 quando ocupa a tela, 1 quando já saiu por cima.
    const scroll = THREE.MathUtils.clamp(-rect.top / rect.height, -1, 1)

    const yawTarget = this.pointerX * 0.32 + scroll * 0.55
    this.yaw += (yawTarget - this.yaw) * 0.06
    this.pitch += (this.pointerY * 0.025 - this.pitch) * 0.06

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

    this.group.rotation.set(this.pitch, this.yaw + spinAngle + Math.sin(time * 0.5) * 0.03, 0)
    this.group.position.y = Math.sin(time * 0.9) * 0.012
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }
}

/** Contorno de casco invertido: a própria malha, um pouco inflada, desenhada só por dentro. */
function createOutlineMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: /* glsl */ `
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        viewPosition.xyz += normalize(normalMatrix * normal) * 0.006;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    `,
  })
}
