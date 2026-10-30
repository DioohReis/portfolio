import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'

/**
 * Texto feito de partículas, desenhado com Three.js.
 *
 * Como funciona:
 * 1. O texto é desenhado com a fonte num canvas invisível.
 * 2. Cada pixel preenchido vira o "destino" (casa) de uma partícula.
 * 3. A cada quadro, uma mola puxa cada partícula para a casa dela (que flutua
 *    de leve) e o mouse empurra e carrega as partículas só de passar por cima.
 *    Clicando e arrastando, o raio cresce e elas giram em volta do ponteiro.
 *
 * Fases:
 * - idle: nada é desenhado (esperando a tela da TV).
 * - static: as partículas pulam para posições aleatórias a cada quadro,
 *   parecendo o chiado de uma TV.
 * - assemble: cada partícula se solta do chiado num momento diferente
 *   e voa até a casa dela.
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
  /** Fase (radianos) da flutuação em volta da casa. */
  phase: number
}

const MAX_PARTICLES = 90_000
const STATIC_MS = 380
const RELEASE_SPREAD_MS = 1100
const SPRING = 0.024
const DAMPING = 0.86
const TRAIL_FADE = 0.45
const DRIFT_PX = 1.4
const HOVER_FORCE = 3.2
const CARRY_FORCE = 0.3
const GRAB_CARRY_FORCE = 0.85
const GRAB_SWIRL_FORCE = 2.6
const OFFSCREEN = -1e4

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
  private camera = new OrthographicCamera(0, 1, 0, 1, -10, 10)
  private fadeMaterial: ShaderMaterial
  private pointsMaterial: ShaderMaterial
  private geometry = new BufferGeometry()
  private points: Points
  private positions = new Float32Array(0)
  private sizes = new Float32Array(0)
  private shades = new Float32Array(0)

  private particles: Particle[] = []
  private width = 0
  private height = 0
  private dpr = 1
  private phase: ParticlePhase = 'idle'
  private phaseStart = 0
  private visible = true
  private raf = 0
  private disposed = false

  private pointer = { x: OFFSCREEN, y: OFFSCREEN, px: OFFSCREEN, py: OFFSCREEN, down: false }
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
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab'
    container.appendChild(canvas)

    this.fadeMaterial = new ShaderMaterial({
      vertexShader: fadeVertex,
      fragmentShader: fadeFragment,
      uniforms: { uOpacity: { value: 1 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    this.fadeScene.add(new Mesh(new PlaneGeometry(1, 1), this.fadeMaterial))

    this.pointsMaterial = new ShaderMaterial({
      vertexShader: pointsVertex,
      fragmentShader: pointsFragment,
      uniforms: { uDpr: { value: 1 } },
      depthTest: false,
      depthWrite: false,
    })
    this.points = new Points(this.geometry, this.pointsMaterial)
    this.points.frustumCulled = false
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
    this.camera.right = this.width
    this.camera.bottom = this.height
    this.camera.updateProjectionMatrix()
    this.pointsMaterial.uniforms.uDpr.value = this.dpr
    this.renderer.clear()
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
        phase: prev ? prev.phase : Math.random() * Math.PI * 2,
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
    canvas.addEventListener('pointerdown', (e) => {
      this.pointer.down = true
      this.onPointerMove(e)
      canvas.style.cursor = 'grabbing'
    })
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
    this.pointer.down = false
    this.renderer.domElement.style.cursor = 'grab'
    // No toque não existe "passar por cima": ao soltar o dedo, o ponteiro some.
    if (e.pointerType !== 'mouse') this.clearPointer()
  }

  private clearPointer = () => {
    this.pointer.x = this.pointer.y = this.pointer.px = this.pointer.py = OFFSCREEN
  }

  /* ---------- quadro a quadro ---------- */

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick)
    if (!this.visible || this.phase === 'idle') return

    const reduced = this.opts.reducedMotion
    const staticMs = reduced ? 0 : STATIC_MS
    const spread = reduced ? 0 : RELEASE_SPREAD_MS
    if (this.phase === 'static' && now - this.phaseStart > staticMs) {
      this.phase = 'assemble'
      this.phaseStart = now
    }
    const elapsed = this.phase === 'assemble' ? now - this.phaseStart : -1

    const W = this.width
    const H = this.height
    const pt = this.pointer
    // O raio acompanha o tamanho da tela, para o efeito não sumir nos monitores grandes.
    const baseRadius = Math.max(90, Math.min(170, Math.min(W, H) * 0.17))
    const radius = pt.down ? baseRadius * 1.5 : baseRadius
    const r2 = radius * radius
    // Quando o ponteiro acaba de entrar na tela ainda não há movimento para medir.
    const hasPrev = pt.px !== OFFSCREEN
    const mvx = hasPrev ? pt.x - pt.px : 0
    const mvy = hasPrev ? pt.y - pt.py : 0
    pt.px = pt.x
    pt.py = pt.y
    const driftT = now * 0.0009
    const drift = reduced ? 0 : DRIFT_PX

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
      } else {
        const dx = p.x - pt.x
        const dy = p.y - pt.y
        const d2 = dx * dx + dy * dy
        if (d2 < r2) {
          const dist = Math.sqrt(d2)
          const k = 1 - dist / radius
          const inv = 1 / (dist + 0.01)
          if (pt.down) {
            p.vx += mvx * k * GRAB_CARRY_FORCE - dy * inv * k * GRAB_SWIRL_FORCE + (Math.random() - 0.5) * 3 * k
            p.vy += mvy * k * GRAB_CARRY_FORCE + dx * inv * k * GRAB_SWIRL_FORCE + (Math.random() - 0.5) * 3 * k
          } else {
            p.vx += dx * inv * k * HOVER_FORCE + mvx * k * CARRY_FORCE
            p.vy += dy * inv * k * HOVER_FORCE + mvy * k * CARRY_FORCE
          }
        }
        p.vx += (p.hx + Math.sin(driftT + p.phase) * drift - p.x) * SPRING
        p.vy += (p.hy + Math.cos(driftT * 0.8 + p.phase) * drift - p.y) * SPRING
        p.vx *= DAMPING
        p.vy *= DAMPING
        p.x += p.vx
        p.y += p.vy
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
