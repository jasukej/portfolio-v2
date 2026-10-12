# Portfolio
V2 updated as of May 2026. Inspired by analog themes and the 1999 Macintosh design.

This portfolio is largely vibe-coded, although it is based on a (Figma) design and heavily takes from the 1998 Macintosh OS 8.1 interface. As such, the actual code leaves much to be desired.

## Getting Started

Running dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Quality checks
Models same kinds of failures Vercel surfaces during `next build`:

```bash
npm run check      # TypeScript + ESLint (full project)
npm run typecheck  # TypeScript only (tsc --noEmit)
npm run lint       # ESLint only
npm run lint:fix   # ESLint with auto-fix
```

## Acknowledgements
* Awesome design kit by [Brett Anderson](https://www.figma.com/@brettanderson): https://www.figma.com/community/file/907684770824957775
* Pixel icons from: https://www.streamlinehq.com/icons/pixel