import { AboutPanel } from '../components/ui/AboutPanel'
import { SectionHeading } from '../components/ui/SectionHeading'

export function About() {
  return (
    <section id="sobre" className="relative z-20 -mt-[40svh] bg-ink">
      {/* A borda de cima se desfaz em preto: o fogo da seção anterior some atrás dela. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full h-[30svh] bg-linear-to-t from-ink to-transparent" />
      <div className="mx-auto min-h-svh max-w-360 px-6 pt-30 pb-16 lg:px-20 lg:pt-40 lg:pb-20">
        <SectionHeading index={2} label="Sobre" title="Sobre" />
        <AboutPanel />
      </div>
    </section>
  )
}
