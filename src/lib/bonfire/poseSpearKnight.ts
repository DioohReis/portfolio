import * as THREE from 'three'

const worldPosition = (bone: THREE.Object3D) => bone.getWorldPosition(new THREE.Vector3())

/** Gira o osso (no espaço do mundo) para que a direção `from` passe a apontar para `to`. */
function aim(bone: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3) {
  const turn = new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize())
  const world = bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(turn)
  const parent = bone.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion()
  bone.quaternion.copy(parent.invert().multiply(world))
  bone.updateWorldMatrix(false, true)
}

/** Dobra o braço para o pulso chegar em `target`; o cotovelo abre na direção de `pole`. */
function reach(
  shoulder: THREE.Object3D,
  elbow: THREE.Object3D,
  wrist: THREE.Object3D,
  target: THREE.Vector3,
  pole: THREE.Vector3,
) {
  const start = worldPosition(shoulder)
  const upper = worldPosition(elbow).distanceTo(start)
  const lower = worldPosition(wrist).distanceTo(worldPosition(elbow))
  const toTarget = target.clone().sub(start)
  const distance = Math.min(toTarget.length(), (upper + lower) * 0.995)
  const direction = toTarget.clone().normalize()
  const cosine = (upper * upper + distance * distance - lower * lower) / (2 * upper * distance)
  const side = pole.clone().addScaledVector(direction, -pole.dot(direction)).normalize()
  const newElbow = start
    .clone()
    .addScaledVector(direction, upper * cosine)
    .addScaledVector(side, upper * Math.sqrt(Math.max(0, 1 - cosine * cosine)))

  aim(shoulder, worldPosition(elbow).sub(start), newElbow.sub(start))
  const elbowAt = worldPosition(elbow)
  aim(elbow, worldPosition(wrist).sub(elbowAt), target.clone().sub(elbowAt))
}

/**
 * O modelo vem em pose de T, com a lança deitada na mão direita apontando para a frente (+z).
 * Coloca as duas mãos na lança, de pé na frente do corpo e com a ponta para cima.
 */
export function poseSpearKnight(model: THREE.Object3D, height: number) {
  const bones = new Map<string, THREE.Object3D>()
  model.traverse((object) => {
    if (object.name) bones.set(object.name.replace(/_\d+$/, '').replace(/\s/g, '_'), object)
  })
  const bone = (name: string) => bones.get(name)
  const hips = bone('root_hips')
  const rightShoulder = bone('arm_right_shoulder_2')
  const rightElbow = bone('arm_right_elbow')
  const rightWrist = bone('arm_right_wrist')
  const leftShoulder = bone('arm_left_shoulder_2')
  const leftElbow = bone('arm_left_elbow')
  const leftWrist = bone('arm_left_wrist')
  const spear = bone('weapon_spear')
  if (!hips || !rightShoulder || !rightElbow || !rightWrist) return
  if (!leftShoulder || !leftElbow || !leftWrist || !spear) return

  model.updateWorldMatrix(true, true)
  const center = worldPosition(hips)
  const up = new THREE.Vector3(0, 1, 0)
  const restSpear = spear.getWorldQuaternion(new THREE.Quaternion()).invert()

  // Mão direita embaixo, um pouco abaixo do peito.
  const grip = new THREE.Vector3(center.x - height * 0.03, height * 0.56, center.z + height * 0.24)
  reach(rightShoulder, rightElbow, rightWrist, grip, new THREE.Vector3(-1, -0.6, -0.4))

  // A direção da lança é +z na pose original; acompanha o quanto a mão já girou.
  const current = spear.getWorldQuaternion(new THREE.Quaternion()).multiply(restSpear)
  aim(rightWrist, new THREE.Vector3(0, 0, 1).applyQuaternion(current), up)

  // Mão esquerda acima da direita, chegando na haste pelo outro lado.
  const shaft = worldPosition(spear)
  const leftGrip = shaft.clone().addScaledVector(up, height * 0.17)
  leftGrip.x += height * 0.07
  reach(leftShoulder, leftElbow, leftWrist, leftGrip, new THREE.Vector3(1, -0.6, -0.4))
  const leftHand = worldPosition(bone('arm_left_finger_c1') ?? leftWrist).sub(worldPosition(leftWrist))
  aim(leftWrist, leftHand, new THREE.Vector3(-1, 0, 0.15))
}
