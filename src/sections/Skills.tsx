import { useCallback, useState } from 'react'
import { Skills3D } from '../components/three/Skills3D'
import { SKILLS, SKILLS_CREDITS } from '../data/skills'

interface SkillsProps {
  reducedMotion: boolean
}

const SKILL_IDS = SKILLS.map((skill) => skill.id)

/** Skills em clima de Resident Evil: escolhido um logo, o zumbi o pega e o arquivo da skill abre. */
export function Skills({ reducedMotion }: SkillsProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const active = SKILLS.find((skill) => skill.id === selected)
  const handleSelect = useCallback((id: string) => setSelected((current) => (current === id ? null : id)), [])

  return (
    <section id="skills" className="relative h-svh min-h-160 overflow-hidden bg-[#050706]">
      <Skills3D
        skills={SKILL_IDS}
        selected={selected}
        reducedMotion={reducedMotion}
        onSelect={handleSelect}
        onHover={setHovered}
        className="absolute inset-0"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(0_0_0/0.75))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-night to-transparent" />

      <div className="pointer-events-none absolute top-20 left-6 lg:top-24 lg:left-20">
        <h2 className="font-typewriter text-4xl tracking-[0.08em] text-[#c9302a] lg:text-6xl">SKILLS</h2>
        <p className="mt-1 max-w-96 font-typewriter text-sm text-paper/70">
          Escolha um item na mesa. Ele vai pegar para você.
        </p>
      </div>

      {/* Arquivo da skill, como os documentos que se encontram no jogo. */}
      {active && (
        <article
          key={active.id}
          style={{ animationDelay: reducedMotion ? '0s' : '0.7s' }}
          className="animate-page-in absolute bottom-32 left-6 max-h-[48%] w-[min(calc(100%-3rem),25rem)] -rotate-1 overflow-y-auto bg-[#d8ceb0] p-5 font-typewriter text-[#1c1712] shadow-[0_16px_40px_rgb(0_0_0/0.7)] lg:top-52 lg:bottom-auto lg:left-20 lg:max-h-[calc(100%-18rem)]"
        >
          <div className="flex items-start justify-between gap-3 border-b-2 border-[#1c1712]/60 pb-2">
            <p className="text-xs tracking-[0.12em]">ARQUIVO Nº {active.file}</p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Fechar arquivo"
              className="cursor-pointer text-sm hover:text-[#b5261e]"
            >
              [ X ]
            </button>
          </div>
          <h3 className="mt-4 text-3xl text-[#8f1a14]">{active.label}</h3>
          <p className="mt-3 leading-snug">{active.summary}</p>
          <p className="mt-4 text-xs tracking-[0.12em] opacity-70">NO DIA A DIA</p>
          <ul className="mt-2 grid gap-1 text-sm leading-snug">
            {active.daily.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>
      )}

      <div className="absolute inset-x-6 bottom-5 lg:inset-x-20">
        <ul className="flex flex-wrap gap-2">
          {SKILLS.map((skill) => {
            const lit = selected === skill.id || hovered === skill.id
            return (
              <li key={skill.id}>
                <button
                  type="button"
                  aria-pressed={selected === skill.id}
                  onClick={() => handleSelect(skill.id)}
                  className={`cursor-pointer border px-3 py-1.5 font-typewriter text-sm transition-colors outline-none focus-visible:border-paper ${
                    lit ? 'border-[#b5261e] bg-[#b5261e] text-paper' : 'border-paper/30 bg-black/60 text-paper/80'
                  }`}
                >
                  {skill.label}
                </button>
              </li>
            )
          })}
        </ul>
        <details className="mt-2 text-[10px] text-paper/45">
          <summary className="cursor-pointer">Créditos dos modelos</summary>
          <p className="mt-1">
            {SKILLS_CREDITS.map((credit) => (
              <a
                key={credit.url}
                href={credit.url}
                target="_blank"
                rel="noreferrer"
                className="mr-3 inline-block hover:underline"
              >
                {credit.title} · {credit.author} · CC BY 4.0
              </a>
            ))}
          </p>
        </details>
      </div>
    </section>
  )
}
