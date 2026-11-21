# Robes eInvoice

White-label NRS (Nigeria Revenue Service / MBS) e-Invoice issuer — **Slice 0 mock-first MVP**.

This build uses **MockNrsAdapter** only. It does **not** submit to live NRS / MBS.

## Path

`H:\robes-einvoice` on `DESKTOP-NI06M5D`

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + **SQLite** (local pragmatism — Postgres not installed on this machine; plan recommended Postgres)
- Cookie session auth (demo-grade)
- `MockNrsAdapter` behind an NRS adapter interface

## Demo login (Acme Foods)

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

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production build
- `npm run db:seed` — reseed Acme Foods demo tenant
- `npx prisma studio` — inspect SQLite DB

## Slice 0 scope

- Multi-tenant schema (tenants, users, branding, credentials stub, parties, invoices, lines, clearance events, audit)
- Branded login + app chrome
- Invoice create → mock clearance → IRN + QR
- Invoice list/detail + status timeline
- Credit note against a cleared invoice
- Branding settings (Tenant Admin)
