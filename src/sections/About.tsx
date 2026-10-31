import { Gameboy3D } from '../components/three/Gameboy3D'
import { ABOUT, QUALITIES, SOCIAL_LINKS } from '../data/about'

interface AboutProps {
  reducedMotion: boolean
}

export function About({ reducedMotion }: AboutProps) {
  return (
    <section id="sobre" className="relative z-20 -mt-[40svh] bg-night">
      {/* A borda de cima se desfaz em preto: o fogo da seção anterior some atrás dela. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full h-[30svh] bg-linear-to-t from-night to-transparent" />

      <div className="mx-auto grid max-w-360 gap-10 px-6 pt-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-20">
        {/* O Game Boy fica parado na tela enquanto os textos correm ao lado. */}
        <div className="relative h-[56svh] lg:sticky lg:top-0 lg:-mt-24 lg:h-svh">
          <Gameboy3D reducedMotion={reducedMotion} className="absolute inset-0" />
          <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-sm whitespace-nowrap opacity-60 lg:bottom-8">
            {'{ clique para girar }'}
          </p>
        </div>

        <div className="lg:pt-10 lg:pb-24">
          <h2 className="text-[clamp(52px,7vw,104px)] leading-none font-semibold tracking-[-0.04em]">Sobre mim</h2>
          <p className="mt-6 max-w-xl text-xl leading-snug opacity-70">{ABOUT.lead}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 text-[clamp(40px,5.5vw,76px)] leading-none font-medium tracking-[-0.03em]">
            {ABOUT.accentA}
            <span className="text-ember">&</span>
            <span className="-rotate-2 bg-paper px-3 py-1 text-[0.55em] text-night">{ABOUT.accentB}</span>
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {/* Cartão de pergaminho preso por um selo. */}
            <article className="relative -rotate-1 bg-[#d9cfb8] p-6 text-night">
              <span className="absolute -top-2.5 left-6 size-5 rounded-full bg-ember shadow-[inset_0_-2px_3px_rgb(0_0_0/0.35)]" />
              <p className="text-2xl leading-tight font-semibold">{ABOUT.noteTitle}</p>
              <p className="mt-3 text-lg leading-snug">{ABOUT.note}</p>
            </article>

            {/* Cartão de terminal, como a tela da TV da entrada. */}
            <article className="rotate-1 border border-paper/20 bg-[#111a2e] p-6 sm:mt-8">
              <p className="font-mono text-xs text-ember">&gt; {ABOUT.terminalTitle}</p>
              <p className="mt-3 text-lg leading-snug opacity-85">{ABOUT.terminal}</p>
            </article>
          </div>

          <ul className="mt-14 grid gap-px border-y border-paper/15 sm:grid-cols-3">
            {QUALITIES.map((quality, index) => (
              <li key={quality.name} className="py-5 sm:pr-5">
                <span className="text-sm text-ember">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-1 text-2xl">{quality.name}</h3>
                <p className="mt-1 leading-snug opacity-65">{quality.description}</p>
              </li>
            ))}
          </ul>

          <p className="mt-10 flex flex-wrap gap-x-6 gap-y-1 text-lg">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 transition-colors hover:text-ember hover:underline"
              >
                {link.label} ↗
              </a>
            ))}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-360 px-6 pt-20 pb-24 lg:px-20">
        <p className="text-sm tracking-[0.14em] uppercase opacity-55">Salvar progresso</p>
        <h3 className="mt-4 text-[clamp(40px,5.5vw,84px)] leading-none font-semibold tracking-[-0.04em]">Jornada</h3>
        <p className="mt-10 border border-dashed border-paper/25 px-6 py-14 text-center text-2xl tracking-[0.04em] text-paper/70">
          Coming soon
        </p>
      </div>
    </section>
  )
}
