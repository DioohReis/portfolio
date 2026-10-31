import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const FOV = 35
const FLAME_COUNT = 320
const EMBER_COUNT = 90
/** Tempo fixo usado com movimento reduzido: o fogo fica como uma imagem parada. */
const STILL_TIME = 2.3
const BONFIRE_URL = '/models/bonfire.glb'
const KNIGHT_URL = '/models/artorias.glb'
/** Maior medida horizontal de cada modelo na cena. */
const BONFIRE_SIZE = 3
const KNIGHT_SIZE = 3.2

/**
 * Fogueira do Sobre (classe, sem React). O fogo e as brasas são feitos em shader, sobre o modelo da
 * fogueira; Artorias e Sif ficam ao lado, iluminados por ela.
 * Só desenha enquanto está visível.
 */
export class BonfireStage {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
  private light = new THREE.PointLight(0xff8a3c, 14, 12, 1.8)
  private knight = new THREE.Group()
  private flames: THREE.ShaderMaterial
  private embers: THREE.ShaderMaterial
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private container: HTMLElement
  private reducedMotion: boolean
  private frame = 0
  private visible = false
  private disposed = false
  private heat = 0
  private heatTarget = 0

  constructor(container: HTMLElement, reducedMotion: boolean) {
    this.container = container
    this.reducedMotion = reducedMotion
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x000000)
    this.renderer.domElement.style.display = 'block'
    container.appendChild(this.renderer.domElement)

    this.light.position.set(0, 0.85, 0.15)
    // Luz fria e fraca de cima: separa o cavaleiro e o lobo do fundo preto.
    const moon = new THREE.DirectionalLight(0xa8bcd8, 0.9)
    moon.position.set(-2, 4, 3)
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(9, 48),
      new THREE.MeshStandardMaterial({ color: 0x24211e, roughness: 1 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    this.scene.add(this.light, moon, new THREE.AmbientLight(0xffb080, 0.05), ground, this.knight)
    this.load()

    // Chamas: grandes, somem cedo. Brasas: pontinhas que sobem bem mais alto.
    this.flames = createFireMaterial({ speed: 0.75, rise: 1.15, spread: 0.3, size: 0.62, embers: 0 })
    this.embers = createFireMaterial({ speed: 0.16, rise: 3.1, spread: 0.55, size: 0.045, embers: 1 })
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

  /** Coloca o modelo com a base no chão, centralizado e com a maior medida horizontal pedida. */
  private async loadModel(loader: GLTFLoader, url: string, size: number) {
    const { scene } = await loader.loadAsync(url)
    // A caixa de uma malha com esqueleto depende dos ossos já calculados.
    scene.updateMatrixWorld(true)
    scene.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh) object.skeleton.update()
    })
    const box = new THREE.Box3().setFromObject(scene)
    const measures = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = size / Math.max(measures.x, measures.z)
    scene.scale.setScalar(scale)
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
    scene.traverse((object) => {
      // O esqueleto move a malha para longe da caixa original; sem isto ela some em alguns ângulos.
      if (object instanceof THREE.SkinnedMesh) object.frustumCulled = false
    })
    return scene
  }

  private async load() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const [bonfire, knight] = await Promise.all([
      this.loadModel(loader, BONFIRE_URL, BONFIRE_SIZE),
      this.loadModel(loader, KNIGHT_URL, KNIGHT_SIZE),
    ])
    if (this.disposed) return
    this.scene.add(bonfire)
    this.knight.add(knight)
    this.knight.position.set(0, 0, -2.2)
    if (this.reducedMotion) this.update(STILL_TIME)
    this.render()
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (!width || !height) return
    this.renderer.setSize(width, height)
    const aspect = width / height
    const tangent = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    // Afasta a câmera em telas estreitas para a fogueira e a espada do cavaleiro continuarem inteiras.
    const distance = Math.max(6, 3.5 / (2 * tangent * aspect))
    this.camera.aspect = aspect
    this.camera.position.set(0, 1.25, distance)
    this.camera.lookAt(0, 1, 0)
    this.camera.updateProjectionMatrix()
    const scale = (height * this.renderer.getPixelRatio()) / (2 * tangent)
    this.flames.uniforms.uScale.value = scale
    this.embers.uniforms.uScale.value = scale
    if (this.reducedMotion) {
      this.update(STILL_TIME)
    }
    this.render()
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
    this.light.intensity = 13 + this.heat * 9 + flicker * 1.6
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }
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
