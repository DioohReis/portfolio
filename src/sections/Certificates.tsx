import { SectionHeading } from '../components/ui/SectionHeading'
import { CERTIFICATES } from '../data/certificates'

const fmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })

export function Certificates() {
  return (
    <section
      id="certificados"
      className="mx-auto min-h-svh max-w-360 border-t border-line px-6 pt-30 pb-16 lg:px-20 lg:pt-40 lg:pb-20"
    >
      <SectionHeading index={4} label="Certificados" title="Certificados" />

      {CERTIFICATES.length === 0 ? (
        <p className="mt-10 text-sm uppercase opacity-45">{'{ Em breve }'}</p>
      ) : (
        <ul className="mt-16 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {CERTIFICATES.map((cert) => (
            <li key={cert.title + cert.date} className="flex flex-col gap-2 bg-night p-6">
              <p className="text-xs uppercase opacity-45">
                {cert.issuer} · {fmt.format(new Date(`${cert.date}-01T12:00:00`))}
              </p>
              <h3 className="text-xl font-semibold tracking-[-0.02em]">{cert.title}</h3>
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto pt-4 text-sm font-medium opacity-70 transition-opacity hover:opacity-100"
                >
                  Ver credencial ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
