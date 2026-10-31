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

/** Créditos dos modelos da página (licença CC BY 4.0, exige citar autor e fonte). */
export const CONTACT_CREDITS = [
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
