import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Euler,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'

/**
 * Texto feito de partículas, levadas por um fluido invisível e desenhadas com Three.js.
 *
 * Como funciona:
 * 1. O texto é desenhado com a fonte num canvas invisível.
 * 2. Cada pixel preenchido vira o "destino" (casa) de uma partícula.
 * 3. A tela é dividida numa grade de velocidades. O mouse não toca nas partículas:
 *    ele passa o próprio movimento para a grade, e o movimento se espalha pelos
 *    vizinhos, formando redemoinhos que continuam depois que ele passa.
 * 4. As partículas pegam carona na grade. Só voltam para casa quando ficam quase paradas.
 *
 * Fases:
 * - idle: nada é desenhado (esperando a tela da TV).
 * - static: as partículas pulam para posições aleatórias a cada quadro,
 *   parecendo o chiado de uma TV.
 * - assemble: cada partícula se solta do chiado num momento diferente
 *   e voa até a casa dela. Depois disso, só o fluido as move.
 */

export type ParticlePhase = 'idle' | 'static' | 'assemble'

export interface ParticleFieldOptions {
  /** Linhas do texto, de cima para baixo. */
  lines: string[]
  /** Nome da família da fonte (precisa estar carregada via @font-face). */
  fontFamily: string
  /** Versão calma, sem chiado nem tremor, para quem pede menos movimento. */
  reducedMotion?: boolean
}

interface Particle {
  hx: number
  hy: number
  x: number
  y: number
  vx: number
  vy: number
  shade: number
  big: boolean
  /** Atraso (0–1) para se soltar do chiado durante a montagem. */
  delay: number
  /** Momento (s) em que começou a voltar para casa; -1 enquanto o fluido a carrega. */
  returnAt: number
}

const MAX_PARTICLES = 90_000
const STATIC_MS = 380
const RELEASE_SPREAD_MS = 1100
const TRAIL_FADE = 0.45
const OFFSCREEN = -1e4

/* Montagem: mola suave até o texto se formar. */
const ASSEMBLE_SETTLE_MS = 1400
const ASSEMBLE_SPRING = 0.03
const ASSEMBLE_DAMPING = 0.84

/* A física roda em passos fixos, para ser igual em monitores de 60 Hz, 120 Hz etc. */
const STEP_MS = 1000 / 60
const STEP_S = STEP_MS / 1000
const MAX_STEPS_PER_FRAME = 3

/* Fluido */
const CELL = 10
const BRUSH_RADIUS = 48
const BRUSH_SPACING = 6
const FLUID_FRICTION = 0.99
const FLUID_MAX_SPEED = 100
const AMBIENT_FORCE = 0.005

/* Partículas */
const FLUID_INFLUENCE = 0.06
const PARTICLE_MAX_SPEED = 30
const PARTICLE_DAMPING = 0.4
const RETURN_BELOW_SPEED = 0.5
const RETURN_FORCE = 50
const RETURN_RAMP_S = 0.05

/* Inclinação do texto na direção do mouse */
const TILT_MAX_RAD = (8 * Math.PI) / 180
const TILT_EASE = 0.08

const pointsVertex = /* glsl */ `
  attribute float aSize;
  attribute float aShade;
  uniform float uDpr;
  varying float vShade;
  void main() {
    vShade = aShade;
    gl_PointSize = aSize * uDpr;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const pointsFragment = /* glsl */ `
  varying float vShade;
  void main() {
    gl_FragColor = vec4(vec3(vShade), 1.0);
  }
`

/* Retângulo preto translúcido que cobre a tela: escurece o quadro anterior e cria o rastro. */
const fadeVertex = /* glsl */ `
  void main() { gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }
`
const fadeFragment = /* glsl */ `
  uniform float uOpacity;
  void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, uOpacity); }
`

export class ParticleField {
  readonly ready: Promise<void>

  private container: HTMLElement
  private opts: Required<ParticleFieldOptions>
  private renderer: WebGLRenderer
  private scene = new Scene()
  private fadeScene = new Scene()
  private camera = new PerspectiveCamera(50, 1, 0.1, 10)
  private fadeMaterial: ShaderMaterial
  private pointsMaterial: ShaderMaterial
  private geometry = new BufferGeometry()
  private points: Points
  private positions = new Float32Array(0)
  private sizes = new Float32Array(0)
  private shades = new Float32Array(0)

  /* Grade do fluido, com uma borda de células sempre zeradas em volta. */
  private cols = 0
  private rows = 0
  private stride = 0
  private gridVx = new Float32Array(0)
  private gridVy = new Float32Array(0)
  private gridPressure = new Float32Array(0)

  private particles: Particle[] = []
  private width = 0
  private height = 0
  private dpr = 1
  private phase: ParticlePhase = 'idle'
  private phaseStart = 0
  private visible = true
  private raf = 0
  private disposed = false
  private lastFrame = 0
  private accumulator = 0
  private simTime = 0

  private tiltX = 0
  private tiltY = 0
  private tiltEuler = new Euler()
  private tiltRotation = new Matrix4()
  private toCenter = new Matrix4()
  private fromCenter = new Matrix4()
  private flipY = new Matrix4().makeScale(1, -1, 1)

  private pointer = { x: OFFSCREEN, y: OFFSCREEN, px: OFFSCREEN, py: OFFSCREEN }
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private resizeTimer = 0

  constructor(container: HTMLElement, options: ParticleFieldOptions) {
    this.container = container
    this.opts = { reducedMotion: false, ...options }

    this.renderer = new WebGLRenderer({ antialias: false, alpha: false, preserveDrawingBuffer: true })
    this.renderer.autoClear = false
    this.renderer.setClearColor(0x000000, 1)
    const canvas = this.renderer.domElement
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y'
    container.appendChild(canvas)

    this.fadeMaterial = new ShaderMaterial({
      vertexShader: fadeVertex,
      fragmentShader: fadeFragment,
      uniforms: { uOpacity: { value: 1 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const fadeQuad = new Mesh(new PlaneGeometry(1, 1), this.fadeMaterial)
    fadeQuad.frustumCulled = false
    this.fadeScene.add(fadeQuad)

    this.pointsMaterial = new ShaderMaterial({
      vertexShader: pointsVertex,
      fragmentShader: pointsFragment,
      uniforms: { uDpr: { value: 1 } },
      depthTest: false,
      depthWrite: false,
    })
    this.points = new Points(this.geometry, this.pointsMaterial)
    this.points.frustumCulled = false
    this.points.matrixAutoUpdate = false
    this.scene.add(this.points)

    this.bindPointer(canvas)
    this.resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(this.resizeTimer)
      this.resizeTimer = window.setTimeout(() => this.handleResize(), 150)
    })
    this.visibilityObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting
    })

    this.measure()
    this.ready = this.build(true).then(() => {
      if (this.disposed) return
      this.resizeObserver.observe(container)
      this.visibilityObserver.observe(container)
      this.raf = requestAnimationFrame(this.tick)
    })
  }

  /** Começa o chiado e, logo depois, a montagem do texto. */
  start() {
    if (this.phase !== 'idle') return
    this.phase = 'static'
    this.phaseStart = performance.now()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.clearTimeout(this.resizeTimer)
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointercancel', this.onPointerUp)
    document.documentElement.removeEventListener('pointerleave', this.clearPointer)
    this.geometry.dispose()
    this.pointsMaterial.dispose()
    this.fadeMaterial.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
  }

  /* ---------- preparação ---------- */

  private measure() {
    const rect = this.container.getBoundingClientRect()
    this.width = Math.max(1, Math.round(rect.width))
    this.height = Math.max(1, Math.round(rect.height))
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.setSize(this.width, this.height, false)

    // Câmera a uma distância em que 1 unidade = 1 pixel no plano do texto.
    const W = this.width
    const H = this.height
    this.camera.fov = 2 * Math.atan(0.5) * (180 / Math.PI)
    this.camera.aspect = W / H
    this.camera.far = H * 3
    this.camera.position.set(W / 2, H / 2, H)
    this.camera.lookAt(W / 2, H / 2, 0)
    this.camera.updateProjectionMatrix()
    this.toCenter.makeTranslation(-W / 2, -H / 2, 0)
    this.fromCenter.makeTranslation(W / 2, H / 2, 0)
    this.updateTilt()

    this.pointsMaterial.uniforms.uDpr.value = this.dpr
    this.renderer.clear()

    this.cols = Math.ceil(W / CELL)
    this.rows = Math.ceil(H / CELL)
    this.stride = this.cols + 2
    const cells = this.stride * (this.rows + 2)
    this.gridVx = new Float32Array(cells)
    this.gridVy = new Float32Array(cells)
    this.gridPressure = new Float32Array(cells)
  }

  private async build(scatter: boolean) {
    const { fontFamily, lines } = this.opts
    await document.fonts.load(`100px "${fontFamily}"`)
    if (this.disposed) return

    const W = this.width
    const H = this.height
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const ctx = off.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const lineHeight = 1.02
    let fontSize = Math.min((H * 0.68) / (lines.length * lineHeight), W * 0.24)
    ctx.font = `${fontSize}px "${fontFamily}"`
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
    if (widest > W * 0.86) {
      fontSize *= (W * 0.86) / widest
      ctx.font = `${fontSize}px "${fontFamily}"`
    }
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, H * 0.52 + (i - (lines.length - 1) / 2) * fontSize * lineHeight)
    })

    const data = ctx.getImageData(0, 0, W, H).data
    let gap = 2
    let targets = sample(data, W, H, gap)
    while (targets.length > MAX_PARTICLES) {
      gap += 1
      targets = sample(data, W, H, gap)
    }
    shuffle(targets)

    const old = this.particles
    this.particles = targets.map(([hx, hy], i) => {
      const prev = old[i]
      const fresh = scatter || !prev
      return {
        hx,
        hy,
        x: fresh ? Math.random() * W : prev.x,
        y: fresh ? Math.random() * H : prev.y,
        vx: 0,
        vy: 0,
        shade: prev ? prev.shade : (110 + Math.random() * 145) / 255,
        big: prev ? prev.big : Math.random() < 0.25,
        delay: prev ? prev.delay : Math.pow(Math.random(), 1.6),
        returnAt: -1,
      }
    })

    const n = this.particles.length
    this.positions = new Float32Array(n * 3)
    this.sizes = new Float32Array(n)
    this.shades = new Float32Array(n)
    this.particles.forEach((p, i) => (this.shades[i] = p.shade))
    this.geometry.setAttribute('position', new BufferAttribute(this.positions, 3).setUsage(DynamicDrawUsage))
    this.geometry.setAttribute('aSize', new BufferAttribute(this.sizes, 1).setUsage(DynamicDrawUsage))
    this.geometry.setAttribute('aShade', new BufferAttribute(this.shades, 1))
  }

  private async handleResize() {
    const rect = this.container.getBoundingClientRect()
    if (Math.round(rect.width) === this.width && Math.round(rect.height) === this.height) return
    this.measure()
    await this.build(false)
  }

  /* ---------- interação ---------- */

  private bindPointer(canvas: HTMLCanvasElement) {
    canvas.addEventListener('pointerdown', this.onPointerMove)
    // Na janela, e não no canvas: o cabeçalho e outros elementos por cima não cortam a interação.
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)
    document.documentElement.addEventListener('pointerleave', this.clearPointer)
  }

  private onPointerMove = (e: PointerEvent) => {
    const r = this.container.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (x < 0 || y < 0 || x > r.width || y > r.height) {
      this.clearPointer()
      return
    }
    this.pointer.x = x
    this.pointer.y = y
  }

  private onPointerUp = (e: PointerEvent) => {
    // No toque não existe "passar por cima": ao soltar o dedo, o ponteiro some.
    if (e.pointerType !== 'mouse') this.clearPointer()
  }

  private clearPointer = () => {
    this.pointer.x = this.pointer.y = this.pointer.px = this.pointer.py = OFFSCREEN
  }

  /* ---------- fluido ---------- */

  /** Passa o movimento do mouse para a grade, preenchendo todo o caminho desde o último quadro. */
  private stirFluid() {
    const pt = this.pointer
    if (pt.x !== OFFSCREEN && pt.px !== OFFSCREEN) {
      const mvx = pt.x - pt.px
      const mvy = pt.y - pt.py
      if (mvx !== 0 || mvy !== 0) {
        const stops = Math.max(1, Math.ceil(Math.hypot(mvx, mvy) / BRUSH_SPACING))
        for (let s = 0; s <= stops; s++) {
          const t = s / stops
          this.brush(pt.px + mvx * t, pt.py + mvy * t, mvx, mvy)
        }
      }
    }
    pt.px = pt.x
    pt.py = pt.y
  }

  private brush(x: number, y: number, mvx: number, mvy: number) {
    const { gridVx, gridVy, stride } = this
    const minCol = Math.max(0, ((x - BRUSH_RADIUS) / CELL) | 0)
    const maxCol = Math.min(this.cols - 1, ((x + BRUSH_RADIUS) / CELL) | 0)
    const minRow = Math.max(0, ((y - BRUSH_RADIUS) / CELL) | 0)
    const maxRow = Math.min(this.rows - 1, ((y + BRUSH_RADIUS) / CELL) | 0)
    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        let dist = Math.hypot(c * CELL - x, r * CELL - y)
        if (dist >= BRUSH_RADIUS) continue
        if (dist < 4) dist = BRUSH_RADIUS
        const k = BRUSH_RADIUS / dist
        const i = c + 1 + (r + 1) * stride
        gridVx[i] += mvx * k
        gridVy[i] += mvy * k
      }
    }
  }

  /** Um passo do fluido: corrente de fundo, pressão entre vizinhos e atrito. */
  private stepFluid() {
    const { cols, rows, stride: st, gridVx: vx, gridVy: vy, gridPressure: pr } = this
    const flow = this.opts.reducedMotion ? 0 : AMBIENT_FORCE
    const time = this.simTime * 0.06

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = c + 1 + (r + 1) * st
        vx[i] += flow * Math.sin(r * CELL * 0.005 + time)
        vy[i] += flow * Math.cos(c * CELL * 0.005 - time * 1.1)
        const west = 0.5 * vx[i - st - 1] + vx[i - 1] + 0.5 * vx[i + st - 1]
        const east = 0.5 * vx[i - st + 1] + vx[i + 1] + 0.5 * vx[i + st + 1]
        const north = 0.5 * vy[i - st - 1] + vy[i - st] + 0.5 * vy[i - st + 1]
        const south = 0.5 * vy[i + st - 1] + vy[i + st] + 0.5 * vy[i + st + 1]
        pr[i] = (west - east + north - south) * 0.25
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = c + 1 + (r + 1) * st
        const west = 0.5 * pr[i - st - 1] + pr[i - 1] + 0.5 * pr[i + st - 1]
        const east = 0.5 * pr[i - st + 1] + pr[i + 1] + 0.5 * pr[i + st + 1]
        const north = 0.5 * pr[i - st - 1] + pr[i - st] + 0.5 * pr[i - st + 1]
        const south = 0.5 * pr[i + st - 1] + pr[i + st] + 0.5 * pr[i + st + 1]
        let nextX = vx[i] + (west - east) * 0.25
        let nextY = vy[i] + (north - south) * 0.25
        const speed = Math.hypot(nextX, nextY)
        if (speed > FLUID_MAX_SPEED) {
          const cap = FLUID_MAX_SPEED / speed
          nextX *= cap
          nextY *= cap
        }
        vx[i] = nextX * FLUID_FRICTION
        vy[i] = nextY * FLUID_FRICTION
      }
    }
  }

  /** Soma à partícula a velocidade do fluido no ponto onde ela está. */
  private carry(p: Particle) {
    const { gridVx: vx, gridVy: vy, stride } = this
    const col = Math.min(this.cols - 1, Math.max(0, (p.x / CELL) | 0))
    const row = Math.min(this.rows - 1, Math.max(0, (p.y / CELL) | 0))
    const i = col + 1 + (row + 1) * stride
    const fx = (((p.x % CELL) + CELL) % CELL) / CELL
    const fy = (((p.y % CELL) + CELL) % CELL) / CELL
    p.vx += ((1 - fx) * vx[i] + fx * vx[i + 1] + fy * vx[i + stride]) * FLUID_INFLUENCE
    p.vy += ((1 - fy) * vy[i] + fx * vy[i + 1] + fy * vy[i + stride]) * FLUID_INFLUENCE
  }

  /* ---------- quadro a quadro ---------- */

  private stepParticles(elapsed: number, spread: number) {
    const list = this.particles
    const assembling = elapsed < spread + ASSEMBLE_SETTLE_MS
    const t = this.simTime

    for (let i = 0; i < list.length; i++) {
      const p = list[i]
      if (elapsed < p.delay * spread) continue

      if (assembling) {
        p.vx += (p.hx - p.x) * ASSEMBLE_SPRING
        p.vy += (p.hy - p.y) * ASSEMBLE_SPRING
        this.carry(p)
        p.vx *= ASSEMBLE_DAMPING
        p.vy *= ASSEMBLE_DAMPING
        p.x += p.vx
        p.y += p.vy
        continue
      }

      // Enquanto o fluido a carrega nada a puxa; quase parada, ela volta para casa.
      if (Math.hypot(p.vx, p.vy) > RETURN_BELOW_SPEED) p.returnAt = -1
      else if (p.returnAt < 0) p.returnAt = t
      if (p.returnAt >= 0) {
        const n = Math.min(1, (t - p.returnAt) / RETURN_RAMP_S)
        const pull = RETURN_FORCE * STEP_S * (0.15 + 0.85 * n * n * (3 - 2 * n))
        p.vx += (p.hx - p.x) * pull
        p.vy += (p.hy - p.y) * pull
      }

      this.carry(p)
      const speed = Math.hypot(p.vx, p.vy)
      if (speed > PARTICLE_MAX_SPEED) {
        const cap = PARTICLE_MAX_SPEED / speed
        p.vx *= cap
        p.vy *= cap
      }
      p.x += p.vx
      p.y += p.vy
      p.vx *= PARTICLE_DAMPING
      p.vy *= PARTICLE_DAMPING
    }
  }

  /** Inclina o texto na direção do mouse, em volta do centro da tela. */
  private updateTilt() {
    const pt = this.pointer
    const active = !this.opts.reducedMotion && pt.x !== OFFSCREEN
    const targetX = active ? (pt.x / this.width - 0.5) * 2 : 0
    const targetY = active ? (pt.y / this.height - 0.5) * 2 : 0
    this.tiltX += (targetX - this.tiltX) * TILT_EASE
    this.tiltY += (targetY - this.tiltY) * TILT_EASE
    this.tiltEuler.set(this.tiltY * TILT_MAX_RAD, this.tiltX * TILT_MAX_RAD, 0)
    this.tiltRotation.makeRotationFromEuler(this.tiltEuler)
    this.points.matrix
      .copy(this.fromCenter)
      .multiply(this.tiltRotation)
      .multiply(this.flipY)
      .multiply(this.toCenter)
    this.points.matrixWorldNeedsUpdate = true
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick)
    const delta = now - this.lastFrame
    this.lastFrame = now
    if (!this.visible || this.phase === 'idle') return

    const reduced = this.opts.reducedMotion
    const staticMs = reduced ? 0 : STATIC_MS
    const spread = reduced ? 0 : RELEASE_SPREAD_MS
    if (this.phase === 'static' && now - this.phaseStart > staticMs) {
      this.phase = 'assemble'
      this.phaseStart = now
    }
    const elapsed = this.phase === 'assemble' ? now - this.phaseStart : -1

    this.stirFluid()
    this.accumulator += Math.min(delta, 100)
    let steps = 0
    while (this.accumulator >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      this.simTime += STEP_S
      this.stepFluid()
      if (elapsed >= 0) this.stepParticles(elapsed, spread)
      this.updateTilt()
      this.accumulator -= STEP_MS
      steps++
    }
    if (steps === MAX_STEPS_PER_FRAME) this.accumulator = 0

    const W = this.width
    const H = this.height
    const pos = this.positions
    const sizes = this.sizes
    const list = this.particles
    let stillStatic = false

    for (let i = 0; i < list.length; i++) {
      const p = list[i]
      const inStatic = elapsed < p.delay * spread
      if (inStatic) {
        stillStatic = true
        p.x = Math.random() * W
        p.y = Math.random() * H
        p.vx = (Math.random() - 0.5) * 6
        p.vy = (Math.random() - 0.5) * 6
      }
      pos[i * 3] = p.x
      pos[i * 3 + 1] = p.y
      sizes[i] = p.big || inStatic ? 2 : 1
    }

    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.aSize.needsUpdate = true

    // Durante o chiado o quadro é limpo por completo; depois, fica um rastro curto.
    this.fadeMaterial.uniforms.uOpacity.value = stillStatic && elapsed < 0 ? 1 : TRAIL_FADE
    this.renderer.render(this.fadeScene, this.camera)
    this.renderer.render(this.scene, this.camera)
  }
}

function sample(data: Uint8ClampedArray, W: number, H: number, gap: number): [number, number][] {
  const out: [number, number][] = []
  for (let y = 0; y < H; y += gap) {
    for (let x = 0; x < W; x += gap) {
      if (data[(y * W + x) * 4 + 3] > 140) out.push([x + Math.random() * gap, y + Math.random() * gap])
    }
  }
  return out
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
