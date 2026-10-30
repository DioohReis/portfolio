import { SectionHeading } from '../components/ui/SectionHeading'
import { SITE_OWNER } from '../data/navigation'

const YEAR = new Date().getFullYear()

/** Troque pelos seus links. Itens com href vazio não aparecem. */
const LINKS = [
  { label: 'E-mail', href: '' },
  { label: 'LinkedIn', href: '' },
  { label: 'GitHub', href: '' },
]

export function Contact() {
  const links = LINKS.filter((l) => l.href)
  return (
    <section
      id="contato"
      className="mx-auto flex min-h-svh max-w-360 flex-col border-t border-line px-6 pt-30 lg:px-20 lg:pt-40"
    >
      <SectionHeading index={5} label="Contato" title="Vamos conversar?">
        <p>Aberto a oportunidades, projetos e boas conversas sobre código.</p>
      </SectionHeading>

      {links.length > 0 && (
        <ul className="mt-12 flex flex-wrap gap-x-10 gap-y-4 text-2xl font-medium tracking-[-0.02em]">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-auto flex flex-col gap-2 border-t border-line py-8 text-sm opacity-45 sm:flex-row sm:justify-between">
        <span>
          © {YEAR} {SITE_OWNER}
        </span>
        <span>Feito com React, Three.js e muito chiado.</span>
      </footer>
    </section>
  )
}
