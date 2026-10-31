export interface ContactLink {
  label: string
  /** Texto menor, abaixo do nome. */
  handle: string
  href: string
}

/** Alvos da página de contato. */
export const CONTACT_LINKS: ContactLink[] = [
  { label: 'E-mail', handle: 'diogo.gareis@gmail.com', href: 'mailto:diogo.gareis@gmail.com' },
  {
    label: 'LinkedIn',
    handle: 'Diogo Guilherme',
    href: 'https://www.linkedin.com/in/diogo-guilherme-de-assis-reis-002bb6208/',
  },
  { label: 'GitHub', handle: 'DioohReis', href: 'https://github.com/DioohReis' },
  { label: 'Instagram', handle: 'diooh_shadows', href: 'https://www.instagram.com/diooh_shadows/' },
]

export interface GunSkin {
  id: string
  label: string
  url: string
  /** Comprimento da arma na cena. */
  length: number
  /** Giro que aponta os canos para o fundo da sala (x, y, z). */
  rotation: [number, number, number]
}

/** Skins da shotgun. */
export const GUN_SKINS: GunSkin[] = [
  {
    id: 'classica',
    label: 'Clássica',
    url: '/models/supershotgun.glb',
    length: 0.62,
    rotation: [-Math.PI / 4, Math.PI, 0],
  },
  {
    id: 'eternal',
    label: 'Eternal',
    url: '/models/supershotgun-eternal.glb',
    length: 1.3,
    rotation: [0, Math.PI / 2, 0],
  },
  {
    id: 'dark-ages',
    label: 'The Dark Ages',
    url: '/models/supershotgun-dark-ages.glb',
    length: 0.95,
    rotation: [0, Math.PI / 2, 0],
  },
]

/** Créditos dos modelos da página (licença CC BY 4.0, exige citar autor e fonte). */
export const CONTACT_CREDITS = [
  {
    title: 'DOOM Cacodemon',
    author: 'Renafox',
    license: 'CC BY-NC 4.0',
    url: 'https://sketchfab.com/3d-models/doom-cacodemon-4902b58e85ae42dea7a341148cd3831b',
  },
  {
    title: 'Doom eternal super shotgun',
    author: 'Chenchanchong',
    url: 'https://sketchfab.com/3d-models/doom-eternal-super-shotgun-6722d96c4171414887191348eb1ec428',
  },
  {
    title: 'Super Shotgun - DOOM: The Dark Ages',
    author: 'wrimpr',
    url: 'https://sketchfab.com/3d-models/super-shotgun-doom-the-dark-ages-rigged-356a2e931cee4321b45a006b5c80c282',
  },
  {
    title: 'Doom E1M1: Hangar - Map',
    author: 'vrchris',
    url: 'https://sketchfab.com/3d-models/doom-e1m1-hangar-map-2148fb6a3fe7454b901fcea67d70b318',
  },
  {
    title: 'DOOM Supershotgun',
    author: 'yon4z',
    url: 'https://sketchfab.com/3d-models/doom-supershotgun-277049ab83f14ecc86551d2eb4931f48',
  },
]
