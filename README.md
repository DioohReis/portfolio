# Portfólio — Diogo A Reis

Portfólio interativo: tela de entrada de TV antiga, chiado que vira partículas formando
"Start Hello World" e seções Home, Sobre, Projetos, Certificados e Contato.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · Three.js · Lenis

## Como rodar no VS Code

1. Instale o [Node.js](https://nodejs.org) (versão 20 ou mais nova).
2. Descompacte a pasta e abra no VS Code (**Arquivo → Abrir pasta…**).
3. Aceite as extensões recomendadas que o VS Code sugerir (Tailwind CSS IntelliSense, Oxc e Prettier).
4. No terminal do VS Code (**Ctrl + '**):

```bash
npm install
npm run dev
```

5. Abra o endereço que aparecer (normalmente http://localhost:5173).

> A TV aparece só uma vez por sessão. Para ver de novo, feche a aba e abra outra,
> ou rode `sessionStorage.clear()` no console do navegador e recarregue.

## Comandos

| Comando           | O que faz                                   |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento com recarga     |
| `npm run build`   | Checa os tipos e gera a versão final em `dist/` |
| `npm run preview` | Abre a versão final localmente              |
| `npm run lint`    | Procura problemas no código (oxlint)        |
| `npm run format`  | Formata o código (Prettier)                 |

## Onde mexer

```
src/
├── data/                  ← SEU CONTEÚDO (edite aqui, sem mexer no layout)
│   ├── navigation.ts      seções do menu, texto das partículas, seu nome
│   ├── projects.ts        projetos
│   ├── certificates.ts    certificados
│   └── timeline.ts        trajetória (seção Sobre)
├── sections/              uma seção por arquivo (Home, About, Projects…)
├── components/
│   ├── intro/             tela da TV antiga (CrtIntro + useCrtScreen)
│   ├── layout/            cabeçalho com menu do celular
│   ├── three/             componente React das partículas
│   └── ui/                peças reutilizáveis (cards, faixa de tecnologias…)
├── lib/
│   ├── particles/         motor das partículas em Three.js
│   ├── hiss.ts            som do chiado (gerado, sem arquivo)
│   └── storage.ts         sessionStorage com proteção
├── hooks/                 scroll suave, seção ativa, movimento reduzido
└── index.css              Tailwind, fontes e cores do tema
```

**Cores e fontes** ficam no bloco `@theme` de `src/index.css` e viram classes do Tailwind
(`bg-ink`, `text-paper`, `font-gothic`, `font-mono`…).

**Imagens** de projetos vão em `public/images/` e são referenciadas como `/images/nome.webp`
no campo `cover` de `projects.ts`.

## Fonte Sanguine Frost

A fonte do logo e das partículas (`public/fonts/SanguineFrost.ttf`) é **apenas para uso pessoal**
(veja `public/fonts/SanguineFrost-LICENSE.txt`). Se o portfólio for usado comercialmente —
por exemplo, para vender serviços — é preciso comprar a licença em https://masyafistudio.com/.

## Publicar

`npm run build` gera a pasta `dist/`, que pode ser publicada de graça na Vercel, Netlify
ou GitHub Pages.
