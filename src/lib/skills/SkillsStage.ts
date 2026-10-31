import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const FOV = 38
const ROOM_URL = '/models/waiting-room.glb'
const ARCADE_URL = '/models/arcade.glb'
/** Encaixe do arcade na sala e altura da mesa de centro, onde os logos ficam. */
const ARCADE = { x: 13, z: -4, scale: 2.6, turn: -0.35 }
const LOGO = { y: 5.3, z: 4.2, spacing: 2.5, size: 2 }
const REACH_SECONDS = 0.9
/** Ponto em que o zumbi segura o logo para mostrar ao usuário, em relação à frente do arcade. */
const HOLD_OFFSET = new THREE.Vector3(-5.5, 7.6, 8)
const HELD_LIGHT_OFFSET = new THREE.Vector3(0, 1, 3)
/** Intensidade da lâmpada do teto, que falha de vez em quando. */
const LAMP_POWER = 170

interface Logo {
  id: string
  group: THREE.Group
  home: THREE.Vector3
}

interface SkillsStageOptions {
  skills: string[]
  reducedMotion: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onLoaded: () => void
}

const worldPosition = (object: THREE.Object3D) => object.getWorldPosition(new THREE.Vector3())

/** Gira o osso (no espaço do mundo) para que a direção `from` passe a apontar para `to`. */
function aim(bone: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3) {
  const turn = new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize())
  const world = bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(turn)
  const parent = bone.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion()
  bone.quaternion.copy(parent.invert().multiply(world))
  bone.updateWorldMatrix(false, true)
}

/**
 * Cena das skills (classe, sem React): sala de espera, arcade com o zumbi e os logos sobre a mesa.
 * Ao escolher um logo, ele voa até a mão do zumbi, que o levanta para mostrar. O braço é a animação
 * do modelo misturada a um ajuste por código a cada quadro. Só desenha enquanto está visível.
 */
export class SkillsStage {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 200)
  private lamp = new THREE.PointLight(0xb8f0c8, LAMP_POWER, 60, 1.7)
  /** Luz que acompanha o logo na mão do zumbi, para ele não sumir no escuro. */
  private heldLight = new THREE.PointLight(0xfff0d0, 0, 12, 1.6)
  private mixer: THREE.AnimationMixer | null = null
  private clock = new THREE.Clock()
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private logos: Logo[] = []
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private container: HTMLElement
  private options: SkillsStageOptions
  private frame = 0
  private visible = false
  private disposed = false
  private ready = false
  private hovered: Logo | null = null
  private held: Logo | null = null
  /** 0 com o braço solto, 1 com o logo já na mão. */
  private grab = 0
  private shoulder: THREE.Object3D | null = null
  private elbow: THREE.Object3D | null = null
  private wrist: THREE.Object3D | null = null
  private holdPoint = new THREE.Vector3()
  private path = new THREE.Vector3()

  constructor(container: HTMLElement, options: SkillsStageOptions) {
    this.container = container
    this.options = options
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setClearColor(0x050706)
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.addEventListener('webglcontextlost', () => {
      this.renderer.domElement.style.visibility = 'hidden'
    })
    container.appendChild(this.renderer.domElement)

    // Pouca luz, esverdeada, como um corredor de Resident Evil.
    this.scene.fog = new THREE.Fog(0x050706, 24, 62)
    this.lamp.position.set(0, 20, 6)
    const rim = new THREE.PointLight(0xc02018, 260, 40, 1.8)
    rim.position.set(ARCADE.x + 7, 12, ARCADE.z + 2)
    const fill = new THREE.DirectionalLight(0xbcd8c8, 0.22)
    fill.position.set(0, 10, 30)
    this.scene.add(this.heldLight, this.lamp, rim, fill, new THREE.HemisphereLight(0x8aa498, 0x141010, 0.14))

    container.addEventListener('pointermove', this.handleMove)
    container.addEventListener('pointerleave', this.handleLeave)
    container.addEventListener('click', this.handleClick)

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

  /** Faz o zumbi pegar o logo; null devolve o logo à mesa. */
  select(id: string | null) {
    const next = this.logos.find((logo) => logo.id === id) ?? null
    if (next === this.held) return
    this.held = next
    this.grab = this.options.reducedMotion && next ? 1 : 0
    if (this.options.reducedMotion) {
      this.update(0)
      this.render()
    }
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    this.container.removeEventListener('pointermove', this.handleMove)
    this.container.removeEventListener('pointerleave', this.handleLeave)
    this.container.removeEventListener('click', this.handleClick)
    this.mixer?.stopAllAction()
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const material = object.material as THREE.MeshStandardMaterial
      material.map?.dispose()
      material.normalMap?.dispose()
      material.metalnessMap?.dispose()
      material.roughnessMap?.dispose()
      material.emissiveMap?.dispose()
      material.dispose()
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private async load() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const { skills } = this.options
    const [room, arcade, ...logoScenes] = await Promise.all(
      [ROOM_URL, ARCADE_URL, ...skills.map((id) => `/models/skills/${id}.glb`)].map((url) => loader.loadAsync(url)),
    )
    if (this.disposed) return

    this.scene.add(room.scene)

    const cabinet = arcade.scene
    cabinet.scale.setScalar(ARCADE.scale)
    cabinet.position.set(ARCADE.x, 0, ARCADE.z)
    cabinet.rotation.y = ARCADE.turn
    this.scene.add(cabinet)
    cabinet.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh) object.frustumCulled = false
    })
    this.shoulder = cabinet.getObjectByName('zombieShoulder_R_0274') ?? null
    this.elbow = cabinet.getObjectByName('zombieElbow_R_0275') ?? null
    this.wrist = cabinet.getObjectByName('zombieWrist_R_0276') ?? null
    this.holdPoint.copy(HOLD_OFFSET).add(cabinet.position)
    if (arcade.animations[0]) {
      this.mixer = new THREE.AnimationMixer(cabinet)
      this.mixer.clipAction(arcade.animations[0]).play()
    }

    const start = -((skills.length - 1) * LOGO.spacing) / 2
    skills.forEach((id, index) => {
      const model = logoScenes[index].scene
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)
      const holder = new THREE.Group()
      holder.add(model)
      holder.scale.setScalar(LOGO.size / Math.max(size.x, size.y, size.z))
      const group = new THREE.Group()
      group.add(holder)
      const home = new THREE.Vector3(start + index * LOGO.spacing, LOGO.y, LOGO.z)
      group.position.copy(home)
      this.logos.push({ id, group, home })
      this.scene.add(group)
    })

    this.ready = true
    this.update(0)
    this.render()
    this.options.onLoaded()
  }

  private logoAt(event: PointerEvent | MouseEvent) {
    const rect = this.container.getBoundingClientRect()
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(this.pointer, this.camera)
    // Teste contra uma esfera em volta de cada logo: bem mais simples e generoso que a malha.
    let found: Logo | null = null
    let best = Infinity
    const sphere = new THREE.Sphere()
    const hit = new THREE.Vector3()
    for (const logo of this.logos) {
      sphere.set(logo.group.position, LOGO.size * 0.72)
      if (this.raycaster.ray.intersectSphere(sphere, hit)) {
        const distance = hit.distanceTo(this.camera.position)
        if (distance < best) {
          best = distance
          found = logo
        }
      }
    }
    return found
  }

  private handleMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    const logo = this.logoAt(event)
    if (logo === this.hovered) return
    this.hovered = logo
    this.container.style.cursor = logo ? 'pointer' : ''
    this.options.onHover(logo?.id ?? null)
  }

  private handleLeave = () => {
    this.hovered = null
    this.container.style.cursor = ''
    this.options.onHover(null)
  }

  private handleClick = (event: MouseEvent) => {
    const logo = this.logoAt(event)
    if (logo) this.options.onSelect(logo.id)
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (!width || !height) return
    this.renderer.setSize(width, height)
    const aspect = width / height
    // Em tela estreita abre o ângulo, para os logos e o arcade continuarem cabendo.
    const tangent = Math.max(Math.tan(THREE.MathUtils.degToRad(FOV / 2)), 0.6 / aspect)
    this.camera.fov = THREE.MathUtils.radToDeg(Math.atan(tangent)) * 2
    this.camera.aspect = aspect
    // Em tela em pé a cena sobe, para o zumbi e os logos ficarem acima do arquivo aberto.
    const narrow = aspect < 0.8
    this.camera.position.set(narrow ? 3 : 2, 10.5, 31)
    this.camera.lookAt(narrow ? 3 : 2, narrow ? -8 : 7.5, -4)
    this.camera.updateProjectionMatrix()
    this.render()
  }

  private play() {
    cancelAnimationFrame(this.frame)
    this.clock.getDelta()
    if (this.options.reducedMotion) {
      this.update(0)
      this.render()
      return
    }
    const tick = () => {
      if (!this.visible || this.disposed) return
      this.update(Math.min(this.clock.getDelta(), 0.1))
      this.render()
      this.frame = requestAnimationFrame(tick)
    }
    this.frame = requestAnimationFrame(tick)
  }

  private update(delta: number) {
    if (!this.ready) return
    const time = performance.now() / 1000
    this.mixer?.update(delta)
    this.scene.updateMatrixWorld(true)

    if (this.held) this.grab = Math.min(1, this.grab + delta / REACH_SECONDS)
    const eased = THREE.MathUtils.smoothstep(this.grab, 0, 1)

    if (this.held && eased > 0) this.bendArm(eased)
    const hand = this.wrist ? worldPosition(this.wrist) : this.holdPoint

    for (const logo of this.logos) {
      const bob = this.options.reducedMotion ? 0 : Math.sin(time * 1.4 + logo.home.x) * 0.12
      const near = logo === this.hovered ? 1.2 : 1
      if (logo === this.held) {
        // Voa em arco da mesa até a mão.
        this.path.lerpVectors(logo.home, hand, eased)
        this.path.y += Math.sin(eased * Math.PI) * 2
        logo.group.position.copy(this.path)
        logo.group.scale.setScalar(1 + eased * 0.1)
        this.heldLight.position.copy(this.path).add(HELD_LIGHT_OFFSET)
      } else {
        logo.group.position.lerp(this.path.set(logo.home.x, logo.home.y + bob, logo.home.z), delta ? 0.12 : 1)
        logo.group.scale.lerp(new THREE.Vector3(near, near, near), delta ? 0.15 : 1)
      }
      if (!this.options.reducedMotion) logo.group.rotation.y = Math.sin(time * 0.7 + logo.home.x) * 0.55
    }

    this.heldLight.intensity = this.held ? eased * 40 : 0

    // A lâmpada falha de vez em quando.
    const flick = Math.sin(time * 37) * Math.sin(time * 5.3) > 0.72 ? 0.35 : 1
    this.lamp.intensity = this.options.reducedMotion ? LAMP_POWER : LAMP_POWER * flick
  }

  /** Mistura o braço da animação com o braço esticado até o ponto em que o zumbi mostra o logo. */
  private bendArm(weight: number) {
    const { shoulder, elbow, wrist } = this
    if (!shoulder || !elbow || !wrist) return
    const shoulderPose = shoulder.quaternion.clone()
    const elbowPose = elbow.quaternion.clone()

    const start = worldPosition(shoulder)
    const upper = worldPosition(elbow).distanceTo(start)
    const lower = worldPosition(wrist).distanceTo(worldPosition(elbow))
    const toTarget = this.holdPoint.clone().sub(start)
    const direction = toTarget.clone().normalize()
    const distance = Math.min(toTarget.length(), (upper + lower) * 0.98)
    const cosine = (upper * upper + distance * distance - lower * lower) / (2 * upper * distance)
    const side = new THREE.Vector3(0, -1, 0).addScaledVector(direction, direction.y).normalize()
    const elbowTarget = start
      .clone()
      .addScaledVector(direction, upper * cosine)
      .addScaledVector(side, upper * Math.sqrt(Math.max(0, 1 - cosine * cosine)))

    aim(shoulder, worldPosition(elbow).sub(start), elbowTarget.sub(start))
    const elbowAt = worldPosition(elbow)
    const wristGoal = start.clone().addScaledVector(direction, distance)
    aim(elbow, worldPosition(wrist).sub(elbowAt), wristGoal.sub(elbowAt))

    shoulder.quaternion.slerpQuaternions(shoulderPose, shoulder.quaternion.clone(), weight)
    elbow.quaternion.slerpQuaternions(elbowPose, elbow.quaternion.clone(), weight)
    shoulder.updateWorldMatrix(false, true)
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }
}
