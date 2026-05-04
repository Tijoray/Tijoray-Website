# Tijoray Website

The marketing and e-commerce website for [Tijoray](https://tijoray.com) — luxury jewelry with encrypted NFC vaults for preserving private memories.

## Stack

- **Framework**: React 18 + TypeScript, Vite
- **Routing**: React Router v7
- **3D**: Three.js (pendant configurator)
- **Auth & DB**: Supabase
- **Payments**: Stripe
- **Storage**: AWS S3 (memory uploads)
- **Email**: Resend
- **Deployment**: Vercel

## Pages

| Route | Description |
|---|---|
| `/` | Homepage |
| `/collection` | Product collection |
| `/products/birthstone-pendant` | 3D pendant configurator |
| `/cart` | Cart |
| `/checkout` | Stripe checkout |
| `/technology` | NFC technology explainer |
| `/craftsmanship` | Atelier & materials |
| `/about` | Brand story |
| `/contact` | Contact / consultation |
| `/faq` | FAQ |
| `/portal` | Customer memory portal (auth required) |
| `/portal/piece/:id` | Individual piece vault (auth required) |

## Getting Started

```bash
npm install
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
RESEND_API_KEY=
```

## Build & Deploy

```bash
npm run build   # production build
vercel          # deploy preview
vercel --prod   # deploy to production
```
