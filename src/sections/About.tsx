import { SectionHeading } from '../components/ui/SectionHeading'
import { TIMELINE } from '../data/timeline'

export function About() {
  return (
    <section
      id="sobre"
      className="mx-auto min-h-svh max-w-360 border-t border-line px-6 pt-30 pb-16 lg:px-20 lg:pt-40 lg:pb-20"
    >
      <SectionHeading index={2} label="Sobre" title="Sobre mim">
        <p>Em construção: apresentação, foto, trajetória, tecnologias e interesses.</p>
      </SectionHeading>

      {TIMELINE.length > 0 && (
        <ol className="mt-20 max-w-3xl border-l border-line">
          {TIMELINE.map((item) => (
            <li key={item.title} className="relative pb-10 pl-8">
              <span className="absolute top-2 -left-[3px] size-1.5 rounded-full bg-paper" />
              <p className="font-mono text-xs uppercase opacity-45">{item.period}</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{item.title}</h3>
              <p className="mt-2 leading-relaxed opacity-60">{item.description}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
