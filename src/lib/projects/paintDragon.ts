import * as THREE from 'three'

/* O modelo não tem textura nem UV: as cores são pintadas por posição, em shader. */
const paintVertex = /* glsl */ `
  uniform mat4 uToModel;
  varying vec3 vPaint;
`

const paintFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vPaint;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z
    );
  }
  float fbm(vec3 p) {
    return noise(p) * 0.6 + noise(p * 2.1 + 3.1) * 0.3 + noise(p * 4.3 + 7.7) * 0.1;
  }
`

const paintColor = /* glsl */ `
  float crackLine = 1.0 - abs(2.0 * fbm(vPaint * 42.0) - 1.0);
  float crackMask = smoothstep(0.44, 0.6, fbm(vPaint * 7.0 + 11.0));
  float crack = smoothstep(0.945, 0.99, crackLine) * crackMask;
  float mottled = fbm(vPaint * 60.0);

  // Corpo: cinza de pedra, com manchas.
  vec3 stone = mix(vec3(0.035, 0.035, 0.04), vec3(0.15, 0.15, 0.16), mottled);
  // Asas: manchas verdes aparecem entre as penas.
  float wing = smoothstep(0.2, 0.34, abs(vPaint.x));
  float teal = wing * smoothstep(0.5, 0.64, fbm(vPaint * 6.0 + 23.0));
  stone = mix(stone, vec3(0.015, 0.1, 0.085), teal);
  // Peito dourado.
  float chest = 1.0 - smoothstep(0.03, 0.13, length(vPaint - uChest));
  stone = mix(stone, vec3(0.75, 0.52, 0.1), chest * smoothstep(0.3, 0.6, mottled));
  diffuseColor.rgb = stone;
`

const paintEmission = /* glsl */ `
  float pulse = 0.8 + 0.2 * sin(uTime * 1.6 + vPaint.z * 9.0);
  totalEmissiveRadiance += vec3(1.0, 0.56, 0.08) * (crack * 1.25 * pulse + chest * 0.1);
`

/** Pinta o dragão: pedra cinza, rachaduras douradas pulsando, peito dourado e manchas verdes. */
export function paintDragon(model: THREE.Object3D, chest: THREE.Vector3) {
  const time = { value: 0 }
  model.updateWorldMatrix(true, true)
  const toModel = model.matrixWorld.clone().invert()

  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const material = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.2, side: THREE.DoubleSide })
    const meshToModel = toModel.clone().multiply(object.matrixWorld)
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = time
      shader.uniforms.uToModel = { value: meshToModel }
      shader.uniforms.uChest = { value: chest }
      shader.vertexShader = (paintVertex + shader.vertexShader).replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  vPaint = (uToModel * vec4(position, 1.0)).xyz;',
      )
      shader.fragmentShader = (`uniform vec3 uChest;\n${paintFragment}` + shader.fragmentShader)
        .replace('#include <color_fragment>', `#include <color_fragment>\n${paintColor}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${paintEmission}`)
    }
    ;(object.material as THREE.Material).dispose()
    object.material = material
  })
  return time
}

/** Lança de relâmpago vermelho: desenhada em canvas, com um galho novo em cada ponta. */
export function createLightningSpear(length: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 320
  const context = canvas.getContext('2d')
  if (context) {
    const middle = canvas.height / 2
    const stroke = (points: [number, number][], width: number, blur: number, color: string) => {
      context.beginPath()
      points.forEach(([x, y], index) => (index ? context.lineTo(x, y) : context.moveTo(x, y)))
      context.lineWidth = width
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.strokeStyle = color
      context.shadowBlur = blur
      context.shadowColor = '#ff1a10'
      context.stroke()
    }
    const bolt = (fromX: number, fromY: number, toX: number, toY: number, roughness: number) => {
      const points: [number, number][] = [[fromX, fromY]]
      const steps = 8
      for (let i = 1; i < steps; i++) {
        const t = i / steps
        points.push([fromX + (toX - fromX) * t, fromY + (toY - fromY) * t + (Math.random() - 0.5) * roughness])
      }
      points.push([toX, toY])
      return points
    }

    // A ponta fica à esquerda: a lança afina até ela, com galhos apontando para trás.
    const shaft = bolt(16, middle, 1008, middle, 30)
    const taper = (blur: number, scale: number, color: string) => {
      for (let i = 0; i < shaft.length - 1; i++) {
        const width = (2 + (i / shaft.length) * 22) * scale
        stroke([shaft[i], shaft[i + 1]], width, blur, color)
      }
    }
    taper(90, 2.4, 'rgba(255,30,20,0.55)')
    taper(40, 1.2, 'rgba(255,60,40,0.9)')
    for (let i = 0; i < 40; i++) {
      const x = 90 + Math.random() * 860
      const up = Math.random() > 0.5 ? 1 : -1
      const size = (18 + Math.random() * 62) * (0.45 + (x / 1024) * 0.55)
      const tipX = x + size * 0.9
      const tipY = middle + up * size
      stroke(bolt(x, middle, tipX, tipY, 12), 3, 20, 'rgba(255,110,90,0.95)')
      // Um galho menor saindo do meio do primeiro.
      const midX = (x + tipX) / 2
      const midY = (middle + tipY) / 2
      stroke(bolt(midX, midY, midX + size * 0.4, midY - up * size * 0.25, 5), 2, 12, 'rgba(255,150,130,0.9)')
    }
    taper(16, 0.42, 'rgba(255,232,222,1)')
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  return new THREE.Mesh(new THREE.PlaneGeometry(length, (length * 320) / 1024), material)
}
