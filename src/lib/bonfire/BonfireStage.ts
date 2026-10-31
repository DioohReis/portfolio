import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { poseSpearKnight } from './poseSpearKnight'

const FOV = 46
/** Largura da cena que precisa caber na tela, medida como tangente do ângulo horizontal. */
const FIT_TANGENT = 0.52
const FLAME_COUNT = 320
const EMBER_COUNT = 90
/** Tempo fixo usado com movimento reduzido: o fogo fica como uma imagem parada. */
const STILL_TIME = 2.3
/** Velocidade com que a câmera vai até o elemento em destaque. */
const ZOOM_EASE = 0.05
const ROOM_URL = '/models/room.glb'
const BONFIRE_URL = '/models/bonfire.glb'
const KNIGHT_URL = '/models/artorias.glb'
const SPEAR_KNIGHT_URL = '/models/ornstein.glb'
/** Maior medida horizontal da fogueira na cena. */
const BONFIRE_SIZE = 3.2
/** Encaixa o salão: o vitral fica atrás dos personagens e o centro das cinzas, na origem. */
const ROOM_POSITION = new THREE.Vector3(0.4, -0.9, -0.1)
/** Onde cada personagem fica: nome do nó no modelo, altura, posição no chão e giro (radianos). */
const FIGURES = [
  { name: 'Artorias', height: 3.6, x: -1.9, z: -0.9, turn: 0.15 },
  { name: 'Sif', height: 2.1, x: -0.1, z: -2.2, turn: -0.7 },
]
/** Em tela em pé os personagens chegam mais perto da fogueira, para todos caberem. */
const NARROW_SPREAD = 0.68
/** Giro que deixa a cabeça do Artorias reta, olhando para a frente (no modelo ela olha para o lado). */
const KNIGHT_HEAD = { bone: 'Head_067', turn: new THREE.Euler(-0.2, 0.7, 0) }
const SPEAR_KNIGHT = { height: 3.5, x: 1.9, z: -0.9, turn: 0 }
/** Aonde a câmera vai quando cada elemento ganha destaque: posição e ponto para onde olha. */
const VIEWS: Record<string, { position: THREE.Vector3; look: THREE.Vector3 }> = {
  Artorias: { position: new THREE.Vector3(-1.6, 2.7, 1.6), look: new THREE.Vector3(-1.9, 2.6, -0.9) },
  Ornstein: { position: new THREE.Vector3(1.6, 2.7, 1.6), look: new THREE.Vector3(1.9, 2.6, -0.9) },
  Sif: { position: new THREE.Vector3(-0.2, 1.7, 0.8), look: new THREE.Vector3(-1, 1.35, -2.2) },
  bonfire: { position: new THREE.Vector3(0.2, 1.5, 2.7), look: new THREE.Vector3(0, 0.8, 0) },
}

export interface StagePoint {
  x: number
  y: number
}

interface BonfireStageOptions {
  reducedMotion: boolean
  /** Pontos da cena que precisam de uma etiqueta por cima. */
  anchors: [number, number, number][]
  /** Devolve onde cada ponto cai na tela, em pixels; muda só quando a tela muda de tamanho. */
  onProject: (points: StagePoint[]) => void
  onLoaded: () => void
}

/**
 * Fogueira do menu (classe, sem React). O fogo e as brasas são feitos em shader, sobre o modelo da
 * fogueira, no meio do salão; Artorias e Sif de um lado e Ornstein do outro, iluminados por ela.
 * Só desenha enquanto está visível.
 */
export class BonfireStage {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60)
  private light = new THREE.PointLight(0xff8a3c, 40, 18, 1.6)
  private flames: THREE.ShaderMaterial
  private embers: THREE.ShaderMaterial
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private container: HTMLElement
  private reducedMotion: boolean
  private options: BonfireStageOptions
  private focusTarget: string | null = null
  /** Personagens e a posição x de cada um, para aproximá-los em tela estreita. */
  private figures: { group: THREE.Group; x: number }[] = []
  private spread = 1
  /** 0 com a câmera no lugar de sempre, 1 com ela já perto do elemento em destaque. */
  private zoom = 0
  private zoomProgress = 0
  private zoomPosition = new THREE.Vector3()
  private zoomLook = new THREE.Vector3()
  private cameraLook = new THREE.Vector3()
  private frame = 0
  private visible = false
  private disposed = false
  private heat = 0
  private heatTarget = 0

  constructor(container: HTMLElement, options: BonfireStageOptions) {
    this.container = container
    this.options = options
    this.reducedMotion = options.reducedMotion
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setClearColor(0x000000)
    this.renderer.domElement.style.display = 'block'
    // Sem memória de vídeo o canvas fica branco; escondido, sobra o fundo preto da seção.
    this.renderer.domElement.addEventListener('webglcontextlost', () => {
      this.renderer.domElement.style.visibility = 'hidden'
    })
    container.appendChild(this.renderer.domElement)

    this.light.position.set(0, 1.4, 0.4)
    // Luz fria vinda do vitral e um pouco de claridade geral, para o salão não sumir no preto.
    const windowLight = new THREE.DirectionalLight(0xa8bcd8, 1.1)
    windowLight.position.set(0.5, 5, -5)
    const front = new THREE.DirectionalLight(0xffd8b8, 1.1)
    front.position.set(0, 3, 5)
    this.scene.add(this.light, windowLight, front, new THREE.HemisphereLight(0xb8c4d8, 0x2a1c14, 0.55))
    this.load()

    // Chamas: grandes, somem cedo. Brasas: pontinhas que sobem bem mais alto.
    this.flames = createFireMaterial({ speed: 0.75, rise: 1.7, spread: 0.42, size: 0.95, embers: 0 })
    this.embers = createFireMaterial({ speed: 0.16, rise: 4.6, spread: 0.85, size: 0.06, embers: 1 })
    this.scene.add(createFirePoints(FLAME_COUNT, this.flames), createFirePoints(EMBER_COUNT, this.embers))

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.visibilityObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting
      if (this.visible) this.play()
      else cancelAnimationFrame(this.frame)
    })
    this.visibilityObserver.observe(container)
    this.resize()
  }

  /** O fogo cresce com o mouse em cima (ou com o foco do teclado). */
  setHot(hot: boolean) {
    this.heatTarget = hot ? 1 : 0
    if (this.reducedMotion) {
      this.heat = this.heatTarget
      this.update(STILL_TIME)
      this.render()
    }
  }

  /** Dá destaque a um elemento da cena; null tira o destaque. */
  setFocus(target: string | null) {
    this.focusTarget = target
    if (this.reducedMotion) {
      this.updateZoom(1)
      this.followScroll()
      this.render()
    }
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return
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
    const [room, bonfire, knight, spearKnight] = await Promise.all(
      [ROOM_URL, BONFIRE_URL, KNIGHT_URL, SPEAR_KNIGHT_URL].map((url) =>
        loader.loadAsync(url).then((gltf) => gltf.scene),
      ),
    )
    if (this.disposed) return

    room.rotation.y = Math.PI
    room.position.copy(ROOM_POSITION)
    this.scene.add(room)

    bonfire.traverse((object) => {
      // O chão do modelo da fogueira sairia como um disco sobre o piso do salão.
      if (object instanceof THREE.Mesh && (object.material as THREE.Material).name === 'boden') object.visible = false
    })
    const bonfireBox = measure(bonfire)
    const bonfireSize = bonfireBox.getSize(new THREE.Vector3())
    const bonfireCenter = bonfireBox.getCenter(new THREE.Vector3())
    const bonfireScale = BONFIRE_SIZE / Math.max(bonfireSize.x, bonfireSize.z)
    bonfire.scale.setScalar(bonfireScale)
    bonfire.position.set(
      -bonfireCenter.x * bonfireScale,
      -bonfireBox.min.y * bonfireScale,
      -bonfireCenter.z * bonfireScale,
    )
    this.scene.add(bonfire)

    for (const figure of FIGURES) {
      const node = knight.getObjectByName(figure.name)
      if (!node) continue
      // Um pivô no pé de cada personagem: gira e escala sem tirá-lo do lugar.
      const box = measure(node)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const pivot = new THREE.Group()
      pivot.position.set(center.x, box.min.y, center.z)
      pivot.updateMatrixWorld()
      pivot.attach(node)
      pivot.scale.setScalar(figure.height / size.y)
      pivot.position.set(figure.x * this.spread, 0, figure.z)
      this.figures.push({ group: pivot, x: figure.x })
      pivot.rotation.y = figure.turn
      this.scene.add(pivot)
    }

    straightenHead(this.scene)

    // A medida vem antes da pose: com a lança de pé, a caixa ficaria mais alta que o personagem.
    const spearBox = measure(spearKnight)
    const spearHeight = spearBox.max.y - spearBox.min.y
    const spearCenter = spearBox.getCenter(new THREE.Vector3())
    poseSpearKnight(spearKnight, spearHeight)
    const spearPivot = new THREE.Group()
    spearPivot.position.set(spearCenter.x, spearBox.min.y, 0)
    spearPivot.updateMatrixWorld()
    spearPivot.attach(spearKnight)
    spearPivot.scale.setScalar(SPEAR_KNIGHT.height / spearHeight)
    spearPivot.position.set(SPEAR_KNIGHT.x * this.spread, 0, SPEAR_KNIGHT.z)
    this.figures.push({ group: spearPivot, x: SPEAR_KNIGHT.x })
    spearPivot.rotation.y = SPEAR_KNIGHT.turn
    this.scene.add(spearPivot)

    if (this.reducedMotion) this.update(STILL_TIME)
    this.render()
    this.options.onLoaded()
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (!width || !height) return
    this.renderer.setSize(width, height)
    const aspect = width / height
    this.spread = aspect < 0.8 ? NARROW_SPREAD : 1
    for (const figure of this.figures) figure.group.position.x = figure.x * this.spread
    // A câmera fica presa dentro do salão: em tela estreita, abre o ângulo em vez de se afastar.
    const tangent = Math.max(Math.tan(THREE.MathUtils.degToRad(FOV / 2)), FIT_TANGENT / aspect)
    this.camera.fov = THREE.MathUtils.radToDeg(Math.atan(tangent)) * 2
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
    // As etiquetas ficam presas à posição de descanso da câmera.
    this.placeCamera(0, 0)
    this.options.onProject(
      this.options.anchors.map(([x, y, z]) => {
        const point = new THREE.Vector3(x * this.spread, y, z).project(this.camera)
        return { x: ((point.x + 1) / 2) * width, y: ((1 - point.y) / 2) * height }
      }),
    )
    const scale = (height * this.renderer.getPixelRatio()) / (2 * tangent)
    this.flames.uniforms.uScale.value = scale
    this.embers.uniforms.uScale.value = scale
    if (this.reducedMotion) {
      this.update(STILL_TIME)
    }
    this.followScroll()
    this.render()
  }

  /** enter: 1 com a seção ainda embaixo da tela. exit: 1 com a câmera já dentro do fogo. */
  private placeCamera(enter: number, exit: number, zoom = 0) {
    const push = exit * exit
    this.camera.position.set(0.5 - push * 0.4, 1.9 + enter * 2.6 - push * 0.6, 4.6 - push * 3)
    this.cameraLook.set(0.2 - push * 0.2, 1.6 + enter * 1.2 - push * 0.6, -1 + push)
    if (zoom > 0) {
      this.camera.position.lerp(this.zoomPosition, zoom)
      this.cameraLook.lerp(this.zoomLook, zoom)
    }
    this.camera.lookAt(this.cameraLook)
    this.camera.updateMatrixWorld()
  }

  /** A câmera acompanha a rolagem: desce para o salão ao chegar e avança para o fogo ao sair. */
  private followScroll() {
    if (this.reducedMotion) {
      this.placeCamera(0, 0, this.zoom)
      return
    }
    const section = this.container.closest('section')
    if (!section) return
    const { top } = section.getBoundingClientRect()
    const height = window.innerHeight
    this.placeCamera(
      THREE.MathUtils.clamp(top / height, 0, 1),
      THREE.MathUtils.clamp(-top / (height * 0.7), 0, 1),
      this.zoom,
    )
  }

  private updateZoom(ease: number) {
    const view = this.focusTarget ? VIEWS[this.focusTarget] : null
    // A curva suaviza o começo e o fim do movimento da câmera.
    this.zoomProgress += ((view ? 1 : 0) - this.zoomProgress) * ease
    if (view) {
      this.zoomPosition.lerp(view.position, this.zoomProgress > 0.02 ? ease * 2 : 1)
      this.zoomLook.lerp(view.look, this.zoomProgress > 0.02 ? ease * 2 : 1)
    }
    this.zoom = THREE.MathUtils.smoothstep(this.zoomProgress, 0, 1)
  }

  private play() {
    cancelAnimationFrame(this.frame)
    if (this.reducedMotion) {
      this.update(STILL_TIME)
      this.render()
      return
    }
    const tick = () => {
      if (!this.visible) return
      this.heat += (this.heatTarget - this.heat) * 0.05
      this.updateZoom(ZOOM_EASE)
      this.followScroll()
      this.update(performance.now() / 1000)
      this.render()
      this.frame = requestAnimationFrame(tick)
    }
    this.frame = requestAnimationFrame(tick)
  }

  private update(time: number) {
    for (const material of [this.flames, this.embers]) {
      material.uniforms.uTime.value = time
      material.uniforms.uHeat.value = this.heat
    }
    const flicker = Math.sin(time * 11) * 0.5 + Math.sin(time * 23.7) * 0.3 + Math.sin(time * 5.3) * 0.6
    this.light.intensity = 40 + this.heat * 26 + flicker * 4
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }
}

function straightenHead(scene: THREE.Object3D) {
  const bone = scene.getObjectByName(KNIGHT_HEAD.bone)
  if (!bone?.parent) return
  scene.updateMatrixWorld(true)
  const turn = new THREE.Quaternion().setFromEuler(KNIGHT_HEAD.turn)
  const world = bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(turn)
  bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world))
}

/** Caixa do objeto com o esqueleto já calculado; sem isso, malhas com ossos dão uma caixa errada. */
function measure(object: THREE.Object3D) {
  object.updateWorldMatrix(true, true)
  object.traverse((child) => {
    if (child instanceof THREE.SkinnedMesh) {
      child.skeleton.update()
      // Os ossos movem a malha para longe da caixa original; sem isto ela some em alguns ângulos.
      child.frustumCulled = false
    }
  })
  return new THREE.Box3().setFromObject(object)
}

interface FireOptions {
  speed: number
  rise: number
  spread: number
  size: number
  embers: number
}

function createFirePoints(count: number, material: THREE.ShaderMaterial) {
  const geometry = new THREE.BufferGeometry()
  const offsets = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.sqrt(Math.random())
    offsets[i * 3] = Math.cos(angle) * radius
    offsets[i * 3 + 1] = 0.22
    offsets[i * 3 + 2] = Math.sin(angle) * radius
    seeds[i] = Math.random()
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(offsets, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return points
}

function createFireMaterial({ speed, rise, spread, size, embers }: FireOptions) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uHeat: { value: 0 },
      uScale: { value: 1 },
      uSpeed: { value: speed },
      uRise: { value: rise },
      uSpread: { value: spread },
      uSize: { value: size },
      uEmbers: { value: embers },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uHeat, uScale, uSpeed, uRise, uSpread, uSize, uEmbers;
      varying float vLife;
      varying float vSeed;
      void main() {
        float life = fract(uTime * uSpeed * (0.75 + aSeed * 0.5) + aSeed * 37.0);
        float height = life * uRise * (1.0 + uHeat * 0.65) * (0.65 + aSeed * 0.7);
        // As chamas afinam para o alto; as brasas se abrem e balançam com o ar quente.
        float narrow = mix(pow(1.0 - life, 1.3), 0.5 + life * 0.8, uEmbers);
        vec3 p = vec3(position.x, 0.0, position.z) * uSpread * narrow * (1.0 + uHeat * 0.25);
        float sway = mix(0.05, 0.28, uEmbers) * life;
        p.x += sin(uTime * 2.7 + aSeed * 40.0 + life * 5.0) * sway;
        p.z += cos(uTime * 2.1 + aSeed * 23.0 + life * 4.0) * sway;
        p.y = position.y + height;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        float grow = mix(mix(0.55, 1.0, smoothstep(0.0, 0.18, life)) * (1.0 - life * 0.72), 1.0, uEmbers);
        gl_PointSize = uSize * grow * (1.0 + uHeat * 0.25) * uScale / -view.z;
        gl_Position = projectionMatrix * view;
        vLife = life;
        vSeed = aSeed;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uEmbers;
      varying float vLife;
      varying float vSeed;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float shape = smoothstep(1.0, 0.0, d);
        vec3 core = vec3(1.0, 0.82, 0.48);
        vec3 mid = vec3(1.0, 0.38, 0.07);
        vec3 tip = vec3(0.55, 0.08, 0.02);
        vec3 color = mix(mix(core, mid, smoothstep(0.05, 0.45, vLife)), tip, smoothstep(0.45, 1.0, vLife));
        float fade = smoothstep(0.0, 0.08, vLife) * (1.0 - vLife);
        float alpha = shape * shape * fade * 0.42;
        if (uEmbers > 0.5) {
          float blink = 0.6 + 0.4 * sin(uTime * 7.0 + vSeed * 60.0);
          color = mix(vec3(1.0, 0.6, 0.2), vec3(1.0, 0.25, 0.05), vLife);
          alpha = smoothstep(1.0, 0.3, d) * fade * blink * 1.6;
        }
        gl_FragColor = vec4(color * alpha, alpha);
      }
    `,
  })
}
