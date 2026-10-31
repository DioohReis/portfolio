import { Cartridge3D } from '../components/three/Cartridge3D'
import { Gameboy3D } from '../components/three/Gameboy3D'
import { Skills } from './Skills'
import { ABOUT, CARTRIDGE_LABEL, CLOSING, QUALITIES, SOCIAL_LINKS, TICKETS } from '../data/about'

interface AboutProps {
  reducedMotion: boolean
}

export function About({ reducedMotion }: AboutProps) {
  return (
    <section id="sobre" className="bg-night">
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

          {/* O cartucho com o texto e o monitor antigo, lado a lado. */}
          <div className="mt-10 grid items-center gap-2 sm:grid-cols-2">
            <div className="relative aspect-3/2 w-full">
              <Cartridge3D label={CARTRIDGE_LABEL} reducedMotion={reducedMotion} className="absolute inset-0" />
              <div className="sr-only">
                <h3>{ABOUT.noteTitle}</h3>
                <p>{ABOUT.note}</p>
              </div>
            </div>

            <article>
              <div className="rounded-t-2xl rounded-b-md border-b-8 border-[#a8a18e] bg-[#d6cfbd] p-3 shadow-[6px_6px_0_rgb(0_0_0/0.35)]">
                <div className="relative overflow-hidden rounded-[14px] border-6 border-[#8d8776] bg-[#0b2a12] p-4 text-[#9bdc6a] after:pointer-events-none after:absolute after:inset-0 after:bg-[repeating-linear-gradient(0deg,rgb(0_0_0/0.22)_0_1px,transparent_1px_3px)]">
                  <p className="font-pixel text-[9px] text-[#d8f7a0]">C:\&gt; {ABOUT.terminalTitle}</p>
                  <p className="mt-2 font-terminal text-xl leading-tight">{ABOUT.terminal}</p>
                  <p className="animate-blink font-terminal text-xl leading-none">_</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-pixel text-[7px] text-[#5a5548]">DAR-2026</span>
                  <span className="size-2 rounded-full bg-[#7be04a] shadow-[0_0_8px_#7be04a]" />
                </div>
              </div>
              <div className="mx-auto h-3 w-1/3 bg-[#b9b2a0]" />
            </article>
          </div>

          {/* Ingressos: os recortes laterais vêm de uma máscara. */}
          <ul className="mt-12 flex flex-wrap gap-3">
            {TICKETS.map((ticket, index) => (
              <li
                key={ticket}
                style={{ rotate: `${index % 2 === 0 ? -1.5 : 1.5}deg` }}
                className={`flex items-center gap-3 px-5 py-2.5 text-night [mask-image:radial-gradient(circle_8px_at_0_50%,transparent_98%,#000),radial-gradient(circle_8px_at_100%_50%,transparent_98%,#000)] [mask-composite:intersect] ${
                  index % 2 === 0 ? 'bg-[#a9c48a]' : 'bg-[#e8a0b6]'
                }`}
              >
                <span className="text-xl font-semibold">{String(index + 1).padStart(2, '0')}</span>
                <span className="h-5 border-l border-dashed border-night/50" />
                <span className="text-xs font-medium tracking-[0.14em] uppercase">{ticket}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-xl text-lg leading-snug opacity-65">{CLOSING.intro}</p>
          <p className="mt-3 text-[clamp(30px,3.6vw,52px)] leading-tight font-medium tracking-[-0.03em]">
            {CLOSING.statement}
          </p>
          <p className="mt-2 inline-block -rotate-1 border border-paper/15 bg-white/5 px-3 py-1.5 text-sm font-semibold tracking-[0.08em] uppercase lg:text-lg">
            {CLOSING.tag}
          </p>

          {/* Bilhete colado com fita. */}
          <div className="relative mt-10 max-w-2xl rotate-1 bg-[#f3e8b8] px-8 py-7 text-lg leading-relaxed text-night shadow-[0_12px_30px_rgb(0_0_0/0.4)]">
            <span className="absolute -top-3 left-6 h-6 w-24 -rotate-3 bg-paper/45" />
            <span className="absolute -top-3 right-6 h-6 w-24 rotate-3 bg-paper/45" />
            {CLOSING.noteBefore}{' '}
            <span className="relative mx-1 inline-block px-2 text-2xl font-medium whitespace-nowrap">
              {CLOSING.noteCircled}
              <svg
                aria-hidden="true"
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -inset-x-1 -inset-y-1 h-[calc(100%+8px)] w-[calc(100%+8px)] overflow-visible"
              >
                <ellipse
                  cx="50"
                  cy="20"
                  rx="49"
                  ry="18"
                  fill="none"
                  stroke="#2f6f5e"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </span>{' '}
            {CLOSING.noteAfter}
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

      <div className="mt-20">
        <Skills reducedMotion={reducedMotion} />
      </div>

      {/* Jornada: por enquanto, um save vazio esperando a história. */}
      <div className="relative overflow-hidden px-6 py-28 text-center lg:py-36">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(ellipse_at_top,rgb(240_146_74/0.14),transparent_70%)]"
        />
        <p className="relative text-sm tracking-[0.24em] uppercase opacity-55">Jornada</p>
        <h3 className="relative mt-5 text-[clamp(52px,10vw,148px)] leading-none font-semibold tracking-[-0.05em]">
          Coming <span className="text-ember">soon</span>
        </h3>
        <div aria-hidden="true" className="relative mx-auto mt-10 flex max-w-md items-center gap-2">
          <span className="size-2.5 rounded-full bg-ember shadow-[0_0_14px_var(--color-ember)] motion-safe:animate-blink" />
          <span className="h-px flex-1 border-t border-dashed border-paper/30" />
          <span className="size-2 rounded-full border border-paper/40" />
          <span className="h-px flex-1 border-t border-dashed border-paper/30" />
          <span className="size-2 rounded-full border border-paper/40" />
          <span className="h-px flex-1 border-t border-dashed border-paper/30" />
          <span className="size-2 rounded-full border border-paper/40" />
        </div>
        <p className="relative mt-6 font-terminal text-2xl text-[#9bdc6a]">Salvando progresso...</p>
      </div>
    </section>
  )
}
