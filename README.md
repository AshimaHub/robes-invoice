# Robes Invoice

**Robes Invoice** (business: **Robes**) — company invoicing plus optional NRS-compliant e-invoice tools.

This build uses **MockNrsAdapter** for NRS only. It does **not** submit to live NRS / MBS.

## Path

`H:\robes-einvoice`

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + **SQLite**
- Cookie session auth (demo-grade)
- `MockNrsAdapter` behind an NRS adapter interface

## Demo login (Robes Invoice demo)

| Role | Email | Password |
| --- | --- | --- |
| Tenant Admin | `admin@acmefoods.demo` | `demo1234` |
| Issuer | `issuer@acmefoods.demo` | `demo1234` |

## Start

```powershell
cd H:\robes-einvoice
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Key URLs

- `/` → login or dashboard
- `/dashboard` — cards + charts
- `/company/invoices` — Generate Company invoice
- `/nrs/gate` — NRS readiness questionnaire
- `/nrs` — NRS hub (blocked until gate passed)

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production build
- `npm run db:seed` — reseed demo tenant
- `npx prisma studio` — inspect SQLite DB
