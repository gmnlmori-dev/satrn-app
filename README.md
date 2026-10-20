This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Variabili d’ambiente

Oltre a `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, la gestione utenti admin (creazione account e password) richiede sul **server**:

- `SUPABASE_SERVICE_ROLE_KEY` — chiave `service_role` da Supabase → Project Settings → API (non esporla al client).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

Produzione su server proprio `zeroradiation` (Nginx + systemd, stesso modello di Stellr), dominio `satrn.zeroradiation.eu`, database su Supabase Cloud. Installazione, rilascio (`sudo satrn-release`) e monitoraggio sono documentati in [`deploy/README.md`](deploy/README.md).
