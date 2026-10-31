import { AboutPanel } from '../components/ui/AboutPanel'
import { SectionHeading } from '../components/ui/SectionHeading'

export function About() {
  return (
    <section
      id="sobre"
      className="mx-auto min-h-svh max-w-360 border-t border-line px-6 pt-30 pb-16 lg:px-20 lg:pt-40 lg:pb-20"
    >
      <SectionHeading index={2} label="Sobre" title="Sobre" />
      <AboutPanel />
    </section>
  )
}
