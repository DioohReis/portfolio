import * as THREE from 'three'

const FOV = 35
const FLAME_COUNT = 320
const EMBER_COUNT = 90
/** Tempo fixo usado com movimento reduzido: o fogo fica como uma imagem parada. */
const STILL_TIME = 2.3

/**
 * Fogueira do Sobre (classe, sem React). O fogo e as brasas são feitos em shader; o monte de cinzas,
 * os ossos e a espada são formas simples, provisórias, até o modelo definitivo chegar.
 * Só desenha enquanto está visível.
 */
export class BonfireStage {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
  private light = new THREE.PointLight(0xff8a3c, 14, 12, 1.8)
  private flames: THREE.ShaderMaterial
  private embers: THREE.ShaderMaterial
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private container: HTMLElement
  private reducedMotion: boolean
  private frame = 0
  private visible = false
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
    this.scene.add(this.light, new THREE.AmbientLight(0xffb080, 0.05))
    this.buildScenery()

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
    cancelAnimationFrame(this.frame)
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return
      object.geometry.dispose()
      ;(object.material as THREE.Material).dispose()
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private buildScenery() {
    const ash = new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 1, flatShading: true })
    const bone = new THREE.MeshStandardMaterial({ color: 0xa89d8a, roughness: 0.9, flatShading: true })
    const iron = new THREE.MeshStandardMaterial({ color: 0x3a3836, roughness: 0.55, metalness: 0.7, flatShading: true })

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(9, 48),
      new THREE.MeshStandardMaterial({ color: 0x24211e, roughness: 1 }),
    )
    ground.rotation.x = -Math.PI / 2
    this.scene.add(ground)

    const moundGeometry = new THREE.IcosahedronGeometry(1, 4)
    const position = moundGeometry.attributes.position
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i)
      const y = position.getY(i)
      const z = position.getZ(i)
      // Mesmo ponto, mesmo deslocamento: a malha não abre ao ficar irregular.
      const bump = Math.sin(x * 9.1 + z * 4.3) * Math.cos(z * 8.7 - y * 5.9) * 0.09 + Math.sin(x * 21 + z * 23) * 0.025
      position.setXYZ(i, x * (1 + bump), y * (1 + bump * 1.6), z * (1 + bump))
    }
    moundGeometry.computeVertexNormals()
    const mound = new THREE.Mesh(moundGeometry, ash)
    mound.scale.set(1.05, 0.34, 1.05)
    this.scene.add(mound)

    const bones: [number, number, number, number, number][] = [
      [-0.72, 0.13, 0.42, 0.9, 0.4],
      [0.62, 0.12, 0.55, -0.7, 1.2],
      [0.3, 0.2, 0.72, 1.3, -0.5],
      [-0.25, 0.17, 0.78, -1.2, 2.3],
      [0.82, 0.08, -0.1, 0.4, 0.7],
    ]
    for (const [x, y, z, tilt, turn] of bones) {
      const piece = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.42, 2, 6), bone)
      piece.position.set(x, y, z)
      piece.rotation.set(tilt, turn, Math.PI / 2 - tilt * 0.3)
      this.scene.add(piece)
    }

    // A espada fica levemente inclinada, cravada no meio das cinzas.
    const sword = new THREE.Group()
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.085, 1.5, 0.022), iron)
    blade.position.y = 0.6
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.06), iron)
    guard.position.y = 1.37
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.3, 6), iron)
    grip.position.y = 1.54
    const pommel = new THREE.Mesh(new THREE.IcosahedronGeometry(0.048, 0), iron)
    pommel.position.y = 1.72
    sword.add(blade, guard, grip, pommel)
    sword.position.set(0.02, 0.05, 0)
    sword.rotation.set(0.05, 0.5, -0.09)
    this.scene.add(sword)
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (!width || !height) return
    this.renderer.setSize(width, height)
    const aspect = width / height
    const tangent = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    // Afasta a câmera em telas estreitas para o monte de cinzas continuar inteiro.
    const distance = Math.max(5.2, 2.7 / (2 * tangent * aspect))
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
