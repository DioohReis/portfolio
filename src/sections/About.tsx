import type { ReactNode } from 'react'
import { Cartridge3D } from '../components/three/Cartridge3D'
import { Gameboy3D } from '../components/three/Gameboy3D'
import { ABOUT, CARTRIDGE_LABEL, POSTERS, QUALITIES, SHELF_ITEMS, SOCIAL_LINKS, WALL_POSTERS } from '../data/about'

interface AboutProps {
  reducedMotion: boolean
}

/** Janela de diálogo de jogo antigo: fundo do visor e borda dupla. */
function Dialog({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`border-4 border-[#0f380f] bg-[#c4d29a] p-1 text-[#0f380f] shadow-[6px_6px_0_rgb(0_0_0/0.45)] ${className}`}
    >
      <div className="h-full border-2 border-[#0f380f] p-5 lg:p-6">{children}</div>
    </div>
  )
}

/** Quarto à noite, todo desenhado em CSS: papel de parede, luz do abajur e janela estrelada. */
function RoomWall() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.025)_0_2px,transparent_2px_72px)]" />
      <div className="absolute right-[-10%] bottom-0 size-[70vw] rounded-full bg-[radial-gradient(closest-side,rgb(240_146_74/0.28),transparent)]" />
      {WALL_POSTERS.map((poster) => (
        <div
          key={poster.title}
          style={{ background: poster.background, left: poster.left, top: poster.top, rotate: `${poster.turn}deg` }}
          className="absolute hidden aspect-3/4 w-[10vw] max-w-44 flex-col justify-between border-2 border-[#e8e4f4]/70 p-2 text-white opacity-80 shadow-[4px_4px_0_rgb(0_0_0/0.4)] lg:flex"
        >
          <span className="font-pixel text-[8px] leading-tight">{poster.title}</span>
          <span className="text-center text-4xl">{poster.icon}</span>
          <span className="font-terminal text-base leading-none">{poster.caption}</span>
        </div>
      ))}

      {/* Prateleira com fitas. */}
      <div className="absolute top-[5%] right-[20%] hidden w-[18vw] xl:block">
        <div className="flex items-end gap-1 px-3">
          {SHELF_ITEMS.map((color, index) => (
            <span
              key={`${color}-${index}`}
              style={{ background: color, height: `${44 + (index % 3) * 12}px` }}
              className="flex-1 border-t-4 border-white/25"
            />
          ))}
        </div>
        <div className="h-3 bg-[#5c3826] shadow-[0_6px_10px_rgb(0_0_0/0.45)]" />
      </div>

      <div className="absolute top-[12%] right-[3%] hidden aspect-3/4 w-[15vw] border-[10px] border-[#d8d3e8] bg-linear-to-b from-[#0a1450] to-[#2a50b0] shadow-[0_0_80px_rgb(90_120_255/0.45)] xl:block">
        <div className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 bg-[#d8d3e8]" />
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-[#d8d3e8]" />
        <span className="absolute top-[14%] left-[20%] size-1 bg-white shadow-[42px_18px_0_#fff,90px_-6px_0_#cfd8ff,20px_70px_0_#fff,110px_60px_0_#fff,70px_120px_0_#cfd8ff,14px_170px_0_#fff,120px_190px_0_#fff]" />
      </div>
    </div>
  )
}

export function About({ reducedMotion }: AboutProps) {
  return (
    <section id="sobre" className="relative overflow-hidden bg-linear-to-b from-[#141a45] via-[#232560] to-[#2c2458]">
      <RoomWall />

      <div className="relative mx-auto grid max-w-360 gap-8 px-6 pt-28 lg:min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:px-20 lg:pt-0">
        <div className="relative h-[56svh] lg:h-svh">
          <Gameboy3D reducedMotion={reducedMotion} className="absolute inset-0" />
          <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-terminal text-xl whitespace-nowrap text-[#c4d29a] lg:bottom-8">
            {'{ clique para girar }'}
          </p>
        </div>

        <div className="flex flex-col justify-center pb-10 lg:pt-24 lg:pb-16 xl:pr-[15vw] 2xl:pr-48">
          {/* Pôsteres originais, com os meus próprios projetos, colados na parede. */}
          <ul aria-hidden="true" className="mb-8 flex items-end gap-3">
            {POSTERS.map((poster, index) => (
              <li
                key={poster.title}
                style={{ background: poster.background, rotate: `${index % 2 === 0 ? -2 : 2}deg` }}
                className="flex aspect-3/4 w-1/3 max-w-36 flex-col justify-between border-2 border-[#e8e4f4] p-2 text-white shadow-[4px_4px_0_rgb(0_0_0/0.4)]"
              >
                <span className="font-pixel text-[8px] leading-tight">{poster.title}</span>
                <span className="text-center text-3xl lg:text-4xl">{poster.icon}</span>
                <span className="font-terminal text-base leading-none">{poster.caption}</span>
              </li>
            ))}
          </ul>

          <Dialog>
            <h2 className="font-pixel text-[clamp(24px,3.4vw,44px)] leading-tight">Sobre mim</h2>
            <p className="mt-4 font-terminal text-2xl leading-tight">{ABOUT.lead}</p>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-pixel text-[clamp(14px,1.7vw,22px)]">
              {ABOUT.accentA}
              <span className="text-[#b0234f]">&</span>
              <span className="-rotate-1 bg-[#0f380f] px-2 py-1.5 text-[#c4d29a]">{ABOUT.accentB}</span>
            </p>
          </Dialog>
        </div>
      </div>

      {/* A mesa: o cartucho com o texto de um lado e o monitor antigo do outro. */}
      <div className="relative mx-auto grid max-w-360 items-end gap-6 px-6 pt-6 lg:grid-cols-2 lg:px-20">
        <div>
          <div className="relative aspect-3/2 w-full">
            <Cartridge3D label={CARTRIDGE_LABEL} reducedMotion={reducedMotion} className="absolute inset-0" />
          </div>
          <div className="sr-only">
            <h3>{ABOUT.noteTitle}</h3>
            <p>{ABOUT.note}</p>
          </div>
        </div>

        <article className="relative mx-auto mb-[-6px] w-full max-w-xl">
          <div className="rounded-t-2xl rounded-b-md border-b-8 border-[#a8a18e] bg-[#d6cfbd] p-5 pb-8 shadow-[8px_8px_0_rgb(0_0_0/0.35)]">
            <div className="relative overflow-hidden rounded-[18px] border-8 border-[#8d8776] bg-[#0b2a12] p-5 text-[#9bdc6a] after:pointer-events-none after:absolute after:inset-0 after:bg-[repeating-linear-gradient(0deg,rgb(0_0_0/0.22)_0_1px,transparent_1px_3px)]">
              <p className="font-pixel text-[10px] text-[#d8f7a0]">C:\&gt; {ABOUT.terminalTitle}</p>
              <p className="mt-3 font-terminal text-[23px] leading-tight">{ABOUT.terminal}</p>
              <p className="mt-3 animate-blink font-terminal text-2xl">_</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-pixel text-[8px] text-[#5a5548]">DAR-2026</span>
              <span className="size-2.5 rounded-full bg-[#7be04a] shadow-[0_0_8px_#7be04a]" />
            </div>
          </div>
          <div className="mx-auto h-5 w-1/3 bg-[#b9b2a0]" />
        </article>
      </div>

      {/* Objetos sobre a mesa. */}
      <div aria-hidden="true" className="relative mx-auto hidden h-0 max-w-360 lg:block">
        {/* Abajur vermelho */}
        <div className="absolute bottom-0 left-[46%]">
          <div className="absolute -top-44 -left-16 size-44 rounded-full bg-[radial-gradient(closest-side,rgb(255_190_110/0.5),transparent)]" />
          <div className="absolute -top-36 left-0 h-14 w-20 -rotate-12 rounded-t-full bg-[#b0234f] shadow-[inset_-6px_-4px_0_rgb(0_0_0/0.25)]" />
          <div className="absolute -top-24 left-8 h-24 w-1.5 bg-[#8d8776]" />
          <div className="absolute -bottom-0 left-2 h-2.5 w-14 rounded-t bg-[#b0234f]" />
        </div>
        {/* Disquetes empilhados */}
        <div className="absolute bottom-0 left-[56%] flex flex-col">
          <span className="h-2.5 w-20 rotate-2 bg-[#2d6cdf]" />
          <span className="h-2.5 w-20 -rotate-1 bg-[#d8a31f]" />
          <span className="h-2.5 w-20 bg-[#1a1a2a]" />
        </div>
      </div>

      {/* Tampo e frente da mesa de madeira. */}
      <div className="relative h-5 bg-[#7a4a2e] shadow-[0_-2px_0_#9a6340]" />
      <div className="relative bg-[#4a2c1f] bg-[repeating-linear-gradient(0deg,rgb(0_0_0/0.08)_0_2px,transparent_2px_26px)]">
        <div className="mx-auto max-w-360 px-6 py-14 lg:px-20">
          <ul className="grid gap-5 md:grid-cols-3">
            {QUALITIES.map((quality, index) => (
              <li key={quality.name}>
                <Dialog className="h-full">
                  <p className="font-pixel text-[10px]">ATRIBUTO {String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mt-3 font-pixel text-sm leading-snug lg:text-base">{quality.name}</h3>
                  <p className="mt-3 font-terminal text-xl leading-tight">{quality.description}</p>
                </Dialog>
              </li>
            ))}
          </ul>

          <p className="mt-8 flex flex-wrap gap-4">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="bg-[#b0234f] px-4 py-3 font-pixel text-[11px] text-white shadow-[4px_4px_0_rgb(0_0_0/0.45)] transition-transform hover:-translate-y-0.5"
              >
                {link.label} ▸
              </a>
            ))}
          </p>

          <Dialog className="mt-12">
            <h3 className="font-pixel text-lg">Jornada</h3>
            <p className="mt-4 font-terminal text-3xl">Coming soon ▾</p>
          </Dialog>
        </div>
      </div>
    </section>
  )
}
