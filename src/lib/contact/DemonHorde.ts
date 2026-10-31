import * as THREE from 'three'

const DEMON_SIZE = 40
const HIT_RADIUS = 24
const FLOATERS = 2
const WALKER_SPEED = 75
const DEATH_SECONDS = 0.4
const SPAWN_SECONDS = 0.45
const RESPAWN_MIN = 1
const RESPAWN_MAX = 2.6

type DemonState = 'waiting' | 'spawning' | 'alive' | 'dying'

interface Demon {
  object: THREE.Object3D
  walker: boolean
  state: DemonState
  /** Segundos restantes do estado atual. */
  timer: number
  home: THREE.Vector3
  direction: number
  phase: number
}

/**
 * Os demônios do joguinho (classe, sem React). Todos são cópias do mesmo modelo, dividindo malha e
 * textura na memória. Os que flutuam ficam parados; o outro atravessa a sala de um lado ao outro.
 */
export class DemonHorde {
  private demons: Demon[] = []
  private ray = new THREE.Raycaster()
  private sphere = new THREE.Sphere()
  private point = new THREE.Vector3()
  private camera: THREE.PerspectiveCamera
  private eye: THREE.Vector3
  private reducedMotion: boolean

  constructor(
    scene: THREE.Scene,
    model: THREE.Object3D,
    camera: THREE.PerspectiveCamera,
    eye: THREE.Vector3,
    reducedMotion: boolean,
  ) {
    this.camera = camera
    this.eye = eye
    this.reducedMotion = reducedMotion

    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    model.position.sub(center)
    const base = new THREE.Group()
    base.add(model)
    base.scale.setScalar(DEMON_SIZE / Math.max(size.x, size.y, size.z))

    for (let index = 0; index <= FLOATERS; index++) {
      // clone() copia só os nós: malha, material e textura continuam os mesmos.
      const object = base.clone()
      object.visible = false
      scene.add(object)
      this.demons.push({
        object,
        walker: index === FLOATERS,
        state: 'waiting',
        timer: reducedMotion ? 0 : 0.4 + index * 0.7,
        home: new THREE.Vector3(),
        direction: 1,
        phase: index * 2.1,
      })
    }
    this.update(0, 0)
  }

  /** Testa o tiro em um ponto da tela (-1 a 1); mata o demônio atingido mais próximo. */
  shoot(pointer: THREE.Vector2) {
    this.ray.setFromCamera(pointer, this.camera)
    let target: Demon | null = null
    let best = Infinity
    for (const demon of this.demons) {
      if (demon.state !== 'alive' && demon.state !== 'spawning') continue
      this.sphere.set(demon.object.position, HIT_RADIUS)
      if (!this.ray.ray.intersectSphere(this.sphere, this.point)) continue
      const distance = this.point.distanceTo(this.camera.position)
      if (distance < best) {
        best = distance
        target = demon
      }
    }
    if (!target) return false
    target.state = 'dying'
    target.timer = this.reducedMotion ? 0 : DEATH_SECONDS
    this.update(0, 0)
    return true
  }

  update(delta: number, time: number) {
    for (const demon of this.demons) {
      demon.timer -= delta
      if (demon.state === 'waiting' && demon.timer <= 0) this.spawn(demon)
      else if (demon.state === 'spawning' && demon.timer <= 0) demon.state = 'alive'
      else if (demon.state === 'dying' && demon.timer <= 0) {
        demon.state = 'waiting'
        demon.object.visible = false
        demon.timer = this.reducedMotion ? 0 : RESPAWN_MIN + Math.random() * (RESPAWN_MAX - RESPAWN_MIN)
        if (this.reducedMotion) this.spawn(demon)
      }
      if (demon.state !== 'waiting') this.place(demon, delta, time)
    }
  }

  /** Meia largura da sala visível nessa distância, para os demônios nascerem dentro da tela. */
  private reach(distance: number) {
    return Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * distance * this.camera.aspect
  }

  private spawn(demon: Demon) {
    // Em tela em pé ficam mais longe, para caberem lado a lado.
    const distance = (110 + Math.random() * 60) * (this.camera.aspect < 0.8 ? 1.8 : 1)
    const reach = this.reach(distance) * 0.82
    demon.direction = Math.random() < 0.5 ? 1 : -1
    // Rente ao chão, abaixo das placas de contato, e fora do meio da tela, onde fica a arma.
    const y = this.eye.y - 12 - Math.random() * 3
    const x = demon.walker ? -demon.direction * reach : demon.direction * reach * (0.3 + Math.random() * 0.7)
    demon.home.set(this.eye.x + x, y, this.eye.z + distance)
    demon.object.position.copy(demon.home)
    demon.object.visible = true
    demon.state = this.reducedMotion ? 'alive' : 'spawning'
    demon.timer = this.reducedMotion ? 0 : SPAWN_SECONDS
  }

  private place(demon: Demon, delta: number, time: number) {
    if (demon.walker && !this.reducedMotion && demon.state === 'alive') {
      demon.home.x += demon.direction * WALKER_SPEED * delta
      const limit = this.reach(demon.home.z - this.eye.z) * 0.9
      // Na parede invisível da tela, dá meia-volta.
      if (Math.abs(demon.home.x - this.eye.x) > limit) {
        demon.direction = demon.home.x > this.eye.x ? -1 : 1
        demon.home.x = this.eye.x + Math.sign(demon.home.x - this.eye.x) * limit
      }
    }
    const bob = this.reducedMotion ? 0 : Math.sin(time * 1.8 + demon.phase) * 3
    demon.object.position.set(demon.home.x, demon.home.y + bob, demon.home.z)
    demon.object.lookAt(this.eye)

    let scale = 1
    if (demon.state === 'spawning') scale = 1 - demon.timer / SPAWN_SECONDS
    if (demon.state === 'dying') {
      const left = Math.max(demon.timer / DEATH_SECONDS, 0)
      scale = left * (1 + (1 - left) * 0.7)
      demon.object.rotateZ((1 - left) * 2.4)
    }
    demon.object.scale.setScalar((DEMON_SIZE / this.modelSize(demon)) * Math.max(scale, 0.001))
  }

  private sizes = new Map<Demon, number>()

  /** Tamanho original do modelo, guardado na primeira leitura da escala. */
  private modelSize(demon: Demon) {
    let size = this.sizes.get(demon)
    if (!size) {
      size = DEMON_SIZE / demon.object.scale.x
      this.sizes.set(demon, size)
    }
    return size
  }
}
