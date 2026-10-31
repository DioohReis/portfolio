import type { Project } from '../../data/projects'
import { Marquee } from './Marquee'

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { title, summary, stack, category, year, cover, repoUrl, liveUrl } = project
  return (
    <article className="group relative overflow-hidden border border-line bg-white/[0.02]">
      <div className="relative aspect-16/10 overflow-hidden bg-white/[0.03]">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover grayscale transition duration-700 ease-out-soft group-hover:scale-[1.03] group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center text-[clamp(36px,5vw,64px)] leading-[1.05] opacity-15">
            {title}
          </div>
        )}
        <Marquee
          items={stack}
          className="absolute inset-x-0 bottom-0 border-t border-line bg-night py-2 text-[13px] tracking-wide"
        />
      </div>

      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between text-xs uppercase opacity-45">
          <span>{String(index + 1).padStart(3, '0')}</span>
          <span>
            {category} · {year}
          </span>
        </div>
        <h3 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h3>
        <p className="leading-relaxed opacity-60">{summary}</p>
        {(repoUrl || liveUrl) && (
          <div className="mt-2 flex gap-5 text-sm font-medium">
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                Ver online ↗
              </a>
            )}
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                Código ↗
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
