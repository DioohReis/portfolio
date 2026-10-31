import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { paintDragon } from './paintDragon'

const DRAGON_URL = '/models/fortissax.glb'
const FOV = 34
const RADIUS = 3.7
const PANEL_WIDTH = 3.1
const PANEL_HEIGHT = 1.94
/** O projeto ativo descansa um pouco à esquerda, deixando o dragão à mostra. */
const REST_ANGLE = 0.72
const EASE = 0.07
const DUST_COUNT = 140
/** Arraste, em pixels, a partir do qual o clique deixa de contar como clique. */
const DRAG_LIMIT = 6

interface ProjectsStageOptions {
  covers: string[]
  reducedMotion: boolean
  onActive: (index: number) => void
  onOpen: (index: number) => void
  onLoaded: () => void
}

interface Panel {
  mesh: THREE.Mesh
  material: THREE.ShaderMaterial
  glow: THREE.ShaderMaterial
}

const panelVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/* A imagem se separa em vermelho, verde e azul conforme o carrossel ganha velocidade. */
const panelFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uShift, uLight, uFade;
  varying vec2 vUv;
  void main() {
    vec2 shift = vec2(uShift, uShift * 0.25);
    vec3 color = vec3(
      texture2D(uMap, vUv + shift).r,
      texture2D(uMap, vUv).g,
      texture2D(uMap, vUv - shift).b
    );
    vec2 edge = abs(vUv - 0.5) * 2.0;
    float shade = 1.0 - smoothstep(0.75, 1.0, max(edge.x, edge.y)) * 0.25;
    gl_FragColor = vec4(color * shade * uLight, uFade);
  }
`

const glowFragment = /* glsl */ `
  uniform float uLight;
  varying vec2 vUv;
  void main() {
    vec2 edge = abs(vUv - 0.5) * 2.0;
    float glow = (1.0 - smoothstep(0.7, 1.0, edge.x)) * (1.0 - smoothstep(0.7, 1.0, edge.y));
    gl_FragColor = vec4(vec3(1.0, 0.9, 0.82) * glow * 0.16 * uLight * uLight, 1.0);
  }
`

/** Trecho de cilindro: a tela curva que acompanha o anel. */
function arcGeometry(radius: number, width: number, height: number) {
  const length = width / radius
  return new THREE.CylinderGeometry(radius, radius, height, 40, 1, true, -length / 2, length)
}

/**
 * Carrossel dos projetos (classe, sem React): telas curvas girando em volta do dragão, entre partículas.
 * Arrastar ou rolar gira o anel; ao soltar, ele encaixa no projeto mais próximo.
 * Só desenha enquanto está visível.
 */
export class ProjectsStage {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60)
  private ring = new THREE.Group()
  private figure = new THREE.Group()
  private panels: Panel[] = []
  private dust: THREE.Points
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private container: HTMLElement
  private options: ProjectsStageOptions
  private step: number
  private frame = 0
  private visible = false
  private disposed = false
  private angle = 0
  private target = 0
  private active = 0
  private shift = 0
  private dragging = false
  private dragStartX = 0
  private dragStartTarget = 0
  private dragDistance = 0
  private wheelLock = 0

  constructor(container: HTMLElement, options: ProjectsStageOptions) {
    this.container = container
    this.options = options
    this.step = (Math.PI * 2) / options.covers.length
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setClearColor(0x000000)
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.addEventListener('webglcontextlost', () => {
      this.renderer.domElement.style.visibility = 'hidden'
    })
    container.appendChild(this.renderer.domElement)

    // O anel fica levemente inclinado, com a frente mais baixa, para não tapar a cabeça do dragão.
    this.ring.position.y = -0.7
    this.ring.rotation.x = 0.1
    this.ring.rotation.z = -0.05
    const rimLeft = new THREE.DirectionalLight(0xdfe4ea, 1.1)
    rimLeft.position.set(-3, 2, -3)
    const rimRight = new THREE.DirectionalLight(0xffd8b0, 1.1)
    rimRight.position.set(3, 2, -3)
    const front = new THREE.DirectionalLight(0xfff4ea, 2.4)
    front.position.set(-1.5, 4, 5)
    this.scene.add(
      new THREE.HemisphereLight(0xe8e6e0, 0x2a2622, 0.55),
      rimLeft,
      rimRight,
      front,
      this.ring,
      this.figure,
    )

    this.dust = createDust()
    this.scene.add(this.dust)

    container.addEventListener('pointerdown', this.handleDown)
    window.addEventListener('pointermove', this.handleMove, { passive: true })
    window.addEventListener('pointerup', this.handleUp)
    container.addEventListener('wheel', this.handleWheel, { passive: false })
    container.addEventListener('pointermove', this.handleHover)

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

  /** Gira até o projeto pelo caminho mais curto. */
  goTo(index: number) {
    const count = this.panels.length || this.options.covers.length
    const current = Math.round(-this.target / this.step)
    const delta = ((((index - current) % count) + count + count / 2) % count) - count / 2
    this.setTarget(this.target - Math.round(delta) * this.step)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    window.clearTimeout(this.wheelLock)
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    this.container.removeEventListener('pointerdown', this.handleDown)
    window.removeEventListener('pointermove', this.handleMove)
    window.removeEventListener('pointerup', this.handleUp)
    this.container.removeEventListener('wheel', this.handleWheel)
    this.container.removeEventListener('pointermove', this.handleHover)
    for (const panel of this.panels) (panel.material.uniforms.uMap.value as THREE.Texture).dispose()
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return
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

  private async load() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const textureLoader = new THREE.TextureLoader()
    const [{ scene: dragon }, ...textures] = await Promise.all([
      loader.loadAsync(DRAGON_URL),
      ...this.options.covers.map((url) => textureLoader.loadAsync(url)),
    ])
    if (this.disposed) return

    // De frente para a câmera, com a cabeça no meio da tela e as asas abertas até as bordas.
    dragon.scale.setScalar(15.5)
    dragon.position.set(0, -4.75, -5.2)
    paintDragon(dragon)
    this.figure.add(dragon)

    const geometry = arcGeometry(RADIUS, PANEL_WIDTH, PANEL_HEIGHT)
    const glowGeometry = arcGeometry(RADIUS - 0.02, PANEL_WIDTH * 1.14, PANEL_HEIGHT * 1.24)
    textures.forEach((texture, index) => {
      // Sem conversão de cor: o shader devolve a imagem como ela é.
      texture.colorSpace = THREE.NoColorSpace
      texture.anisotropy = 8
      const material = new THREE.ShaderMaterial({
        vertexShader: panelVertex,
        fragmentShader: panelFragment,
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: { uMap: { value: texture }, uShift: { value: 0 }, uLight: { value: 1 }, uFade: { value: 1 } },
      })
      const glow = new THREE.ShaderMaterial({
        vertexShader: panelVertex,
        fragmentShader: glowFragment,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uLight: { value: 1 } },
      })
      const holder = new THREE.Group()
      holder.rotation.y = index * this.step
      const mesh = new THREE.Mesh(geometry, material)
      mesh.userData.index = index
      holder.add(new THREE.Mesh(glowGeometry, glow), mesh)
      this.ring.add(holder)
      this.panels.push({ mesh, material, glow })
    })

    this.update(0)
    this.render()
    this.options.onLoaded()
  }

  private setTarget(target: number) {
    this.target = target
    const count = this.panels.length || this.options.covers.length
    const index = ((Math.round(-target / this.step) % count) + count) % count
    if (index !== this.active) {
      this.active = index
      this.options.onActive(index)
    }
    if (this.options.reducedMotion) {
      this.angle = target
      this.update(0)
      this.render()
    }
  }

  private panelAt(event: PointerEvent) {
    const rect = this.container.getBoundingClientRect()
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const [hit] = this.raycaster.intersectObjects(
      this.panels.filter((panel) => panel.mesh.visible).map((panel) => panel.mesh),
    )
    return hit ? (hit.object.userData.index as number) : null
  }

  private handleDown = (event: PointerEvent) => {
    this.dragging = true
    this.dragStartX = event.clientX
    this.dragStartTarget = this.target
    this.dragDistance = 0
  }

  private handleMove = (event: PointerEvent) => {
    if (!this.dragging) return
    const moved = event.clientX - this.dragStartX
    this.dragDistance = Math.max(this.dragDistance, Math.abs(moved))
    this.target = this.dragStartTarget + moved * 0.006
  }

  private handleUp = (event: PointerEvent) => {
    if (!this.dragging) return
    this.dragging = false
    if (this.dragDistance < DRAG_LIMIT) {
      // Clique: a tela da frente abre o projeto; as outras vêm para a frente.
      const index = this.panelAt(event)
      if (index === this.active) this.options.onOpen(index)
      else if (index !== null) this.goTo(index)
      return
    }
    this.setTarget(Math.round(this.target / this.step) * this.step)
  }

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault()
    if (this.wheelLock || Math.abs(event.deltaY) < 4) return
    this.setTarget(this.target - Math.sign(event.deltaY) * this.step)
    // Um giro por vez, mesmo com a inércia do trackpad.
    this.wheelLock = window.setTimeout(() => (this.wheelLock = 0), 650)
  }

  private handleHover = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    this.container.style.cursor = this.dragging ? 'grabbing' : this.panelAt(event) !== null ? 'pointer' : 'grab'
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (!width || !height) return
    this.renderer.setSize(width, height)
    const aspect = width / height
    const tangent = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    // Em tela estreita a câmera se afasta para o anel continuar cabendo.
    const narrow = aspect < 1.1
    const distance = Math.max(9, 4.3 / (tangent * aspect))
    this.ring.position.x = this.figure.position.x = 0
    this.camera.aspect = aspect
    this.camera.position.set(0, 0.3, distance)
    this.camera.lookAt(0, narrow ? -1.5 : -0.15, 0)
    this.camera.updateProjectionMatrix()
    this.render()
  }

  private play() {
    cancelAnimationFrame(this.frame)
    if (this.options.reducedMotion) {
      this.update(0)
      this.render()
      return
    }
    const tick = () => {
      if (!this.visible || this.disposed) return
      this.update(performance.now() / 1000)
      this.render()
      this.frame = requestAnimationFrame(tick)
    }
    this.frame = requestAnimationFrame(tick)
  }

  private update(time: number) {
    const before = this.angle
    this.angle += (this.target - this.angle) * EASE
    const speed = this.angle - before
    this.shift += (THREE.MathUtils.clamp(speed * 0.35, -0.03, 0.03) - this.shift) * 0.2

    this.ring.rotation.y = this.angle + REST_ANGLE * -1
    if (!this.options.reducedMotion) {
      this.figure.rotation.y = Math.sin(time * 0.4) * 0.025 - speed * 0.8
      this.figure.position.y = Math.sin(time * 0.9) * 0.02
      this.dust.rotation.y = time * 0.015
    }

    this.panels.forEach((panel, index) => {
      // Só as telas na frente ficam acesas; as de trás somem no escuro.
      const facing = Math.cos(this.ring.rotation.y + index * this.step)
      const light = THREE.MathUtils.lerp(0.14, 1, THREE.MathUtils.smoothstep(facing, -0.3, 0.6))
      panel.material.uniforms.uShift.value = this.shift
      panel.material.uniforms.uLight.value = light
      // Passando atrás do dragão, a tela some, para não aparecer na frente das asas.
      const fade = THREE.MathUtils.smoothstep(facing, -0.2, 0.2)
      panel.material.uniforms.uFade.value = fade
      panel.glow.uniforms.uLight.value = light * fade
      panel.mesh.visible = fade > 0.01
    })
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }
}

/** Poeira flutuando em volta do anel. */
function createDust() {
  const positions = new Float32Array(DUST_COUNT * 3)
  for (let i = 0; i < DUST_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 2 + Math.random() * 7
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = (Math.random() - 0.5) * 7
    positions[i * 3 + 2] = Math.sin(angle) * radius
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xffc8b8, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false }),
  )
}
