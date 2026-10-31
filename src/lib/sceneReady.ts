export const SCENE_READY_EVENT = 'dar:scene-ready'

/** Avisa a troca de canal de que a cena 3D principal da página terminou de carregar. */
export function announceSceneReady() {
  window.dispatchEvent(new Event(SCENE_READY_EVENT))
}
