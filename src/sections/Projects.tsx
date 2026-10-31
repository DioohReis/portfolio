import { useCallback, useState } from 'react'
import { Projects3D } from '../components/three/Projects3D'
import { PROJECTS, PROJECTS_CREDIT } from '../data/projects'

interface ProjectsProps {
  reducedMotion: boolean
}

const COVERS = PROJECTS.map((project) => project.cover)

/** Carrossel 3D: as telas dos projetos giram em volta do avatar. */
export function Projects({ reducedMotion }: ProjectsProps) {
  const [active, setActive] = useState(0)
  const project = PROJECTS[active]
  const move = (by: number) => setActive((current) => (current + by + PROJECTS.length) % PROJECTS.length)
  const handleOpen = useCallback((index: number) => {
    window.open(PROJECTS[index].liveUrl, '_blank', 'noopener,noreferrer')
  }, [])

  return (
    <section id="projetos" className="relative h-svh min-h-160 overflow-hidden bg-ink">
      <Projects3D
        covers={COVERS}
        active={active}
        reducedMotion={reducedMotion}
        onActive={setActive}
        onOpen={handleOpen}
        className="absolute inset-0"
      />

      {/* No celular, o texto cobre a parte de baixo da cena e esconde o corte do avatar. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[56%] bg-linear-to-t from-ink from-70% to-transparent lg:hidden" />

      {/* Sombra atrás do texto, para ele continuar legível sobre as asas. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 bg-linear-to-l from-ink from-40% via-ink/80 to-transparent lg:block" />
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/4 bg-linear-to-r from-ink/70 to-transparent lg:block" />

      <h1 className="pointer-events-none absolute top-28 left-6 text-[clamp(40px,5vw,72px)] leading-none font-semibold tracking-[-0.04em] lg:top-32 lg:left-10">
        Projetos
      </h1>

      <a
        href={PROJECTS_CREDIT.url}
        target="_blank"
        rel="noreferrer"
        className="absolute top-44 left-6 text-[10px] opacity-40 hover:underline lg:top-auto lg:bottom-4 lg:left-10"
      >
        {PROJECTS_CREDIT.title} · {PROJECTS_CREDIT.author} · CC BY 4.0
      </a>

      {/* Informações do projeto da frente. A troca reinicia o fade pela chave. */}
      <div
        key={project.slug}
        aria-live="polite"
        className="animate-page-in absolute inset-x-6 bottom-6 lg:top-1/2 lg:right-10 lg:bottom-auto lg:left-auto lg:w-96 lg:-translate-y-1/2"
      >
        <p className="text-xs font-medium tracking-[0.18em] uppercase opacity-60">
          {String(active + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')} · {project.tag}
        </p>
        <h2 className="mt-3 text-3xl leading-none font-semibold tracking-[-0.03em] lg:text-5xl">{project.title}</h2>
        <p className="mt-3 text-sm leading-snug opacity-75 lg:mt-4 lg:text-base">{project.summary}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5 lg:mt-4">
          {project.stack.map((item) => (
            <li key={item} className="border border-paper/25 bg-black/50 px-2 py-0.5 text-xs">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex flex-wrap items-center gap-3 lg:mt-5">
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-paper px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-80"
          >
            Ver site ↗
          </a>
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="border border-paper/40 px-4 py-2 text-sm font-semibold transition-colors hover:border-paper"
          >
            GitHub ↗
          </a>
          <span className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Projeto anterior"
              className="size-9 cursor-pointer border border-paper/40 transition-colors hover:border-paper"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Próximo projeto"
              className="size-9 cursor-pointer border border-paper/40 transition-colors hover:border-paper"
            >
              →
            </button>
          </span>
        </p>
      </div>
    </section>
  )
}
