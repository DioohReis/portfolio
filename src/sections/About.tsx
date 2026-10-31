import { Avatar3D } from '../components/three/Avatar3D'
import { SectionHeading } from '../components/ui/SectionHeading'
import { TIMELINE } from '../data/timeline'

interface AboutProps {
  reducedMotion: boolean
}

export function About({ reducedMotion }: AboutProps) {
  return (
    <section id="sobre" className="border-t border-line">
      <div className="relative h-svh min-h-140 overflow-hidden">
        <p
          className="absolute inset-x-0 top-[16svh] text-center font-gothic text-[23vw] leading-none select-none md:top-[8svh]"
          aria-hidden="true"
        >
          SOBRE
        </p>

        <Avatar3D url="/models/diogo.glb" reducedMotion={reducedMotion} className="cursor-pointer">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-t from-ink to-transparent" />
          <p className="absolute bottom-6 left-6 font-gothic text-2xl sm:text-3xl lg:bottom-10 lg:left-20 lg:text-5xl">
            Diogo A Reis
          </p>
          <button
            type="button"
            className="absolute right-6 bottom-7 cursor-pointer font-mono text-xs opacity-60 transition-opacity hover:opacity-100 lg:right-20 lg:bottom-11"
          >
            {'{ clique para girar }'}
          </button>
        </Avatar3D>
      </div>

      <div className="mx-auto max-w-360 px-6 pt-24 pb-16 lg:px-20 lg:pt-32 lg:pb-20">
        <SectionHeading index={2} label="Sobre" title="Sobre mim">
          <p>Em construção: apresentação, trajetória, tecnologias e interesses.</p>
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
      </div>
    </section>
  )
}
