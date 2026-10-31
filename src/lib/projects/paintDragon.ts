import * as THREE from 'three'

/** Peças do modelo que são asas; o resto é corpo de pedra. */
const WING_MATERIALS = new Set(['mat0'])
/** Peça minúscula na frente da cabeça: os olhos. */
const EYE_MATERIAL = 'mat4'

/* O modelo não tem textura nem UV: as cores são pintadas por posição, em shader. */
const paintVertex = /* glsl */ `
  uniform mat4 uToModel;
  varying vec3 vPaint;
`

const paintFragment = /* glsl */ `
  uniform float uWing;
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
  // Corpo: pedra cinza-clara, escurecendo nas manchas.
  float mottled = fbm(vPaint * 55.0) * 0.7 + fbm(vPaint * 14.0 + 5.0) * 0.3;
  vec3 stone = mix(vec3(0.07, 0.07, 0.065), vec3(0.5, 0.49, 0.46), smoothstep(0.3, 0.7, mottled));

  // Asas: faixas onduladas de laranja e marrom, em volta do ombro, com verde perto das pontas.
  float reach = length(vec2(abs(vPaint.x) - 0.08, vPaint.y - 0.33));
  float wave = reach * 210.0 + fbm(vPaint * 9.0) * 22.0 + fbm(vPaint * 40.0) * 4.0;
  float band = 0.5 + 0.5 * sin(wave);
  vec3 wing = mix(vec3(0.035, 0.022, 0.01), vec3(0.34, 0.17, 0.04), smoothstep(0.1, 0.55, band));
  wing = mix(wing, vec3(0.78, 0.43, 0.08), smoothstep(0.55, 0.95, band));
  float moss = smoothstep(0.36, 0.56, reach) * smoothstep(0.48, 0.62, fbm(vPaint * 11.0 + 31.0));
  wing = mix(wing, vec3(0.3, 0.36, 0.08), moss * band);

  // Onde a superfície dobra rápido, escurece: dá relevo às rugas e entre as penas.
  float crease = smoothstep(0.02, 0.32, length(fwidth(vNormal)));
  diffuseColor.rgb = mix(stone, wing, uWing) * (1.0 - crease * 0.75);
`

/** Pinta o dragão: corpo de pedra e asas em faixas laranja, conforme a peça do modelo. */
export function paintDragon(model: THREE.Object3D) {
  model.updateWorldMatrix(true, true)
  const toModel = model.matrixWorld.clone().invert()

  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const name = (object.material as THREE.Material).name
    const material = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, side: THREE.DoubleSide })
    if (name === EYE_MATERIAL) {
      material.color.set(0x000000)
      material.emissive.set(0xd98a1c)
    } else {
      const meshToModel = toModel.clone().multiply(object.matrixWorld)
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uToModel = { value: meshToModel }
        shader.uniforms.uWing = { value: WING_MATERIALS.has(name) ? 1 : 0 }
        shader.vertexShader = (paintVertex + shader.vertexShader).replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n  vPaint = (uToModel * vec4(position, 1.0)).xyz;',
        )
        shader.fragmentShader = (paintFragment + shader.fragmentShader).replace(
          '#include <color_fragment>',
          `#include <color_fragment>\n${paintColor}`,
        )
      }
    }
    ;(object.material as THREE.Material).dispose()
    object.material = material
  })
}
