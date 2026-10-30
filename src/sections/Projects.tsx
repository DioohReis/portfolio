import { ProjectCard } from '../components/ui/ProjectCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { PROJECTS } from '../data/projects'

export function Projects() {
  return (
    <section
      id="projetos"
      className="mx-auto min-h-svh max-w-360 border-t border-line px-6 pt-30 pb-16 lg:px-20 lg:pt-40 lg:pb-20"
    >
      <SectionHeading index={3} label="Projetos" title="Projetos">
        <p>Uma seleção do que venho construindo.</p>
      </SectionHeading>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.slug} project={project} index={i} />
        ))}
      </div>
    </section>
  )
}
