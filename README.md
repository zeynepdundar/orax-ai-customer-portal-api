# Orax AI Customer Portal

Server-rendered customer portal for warehouse operations — migrated from the
original Next.js app (`OraxAICustomerPortal`) to Node.js + Express + Handlebars
while keeping the same visual design, page set, and translations.

## Tech stack

- Node.js + TypeScript
- Express 5
- express-handlebars (layouts, partials, custom helpers)
- Tailwind CSS v4 (compiled via `@tailwindcss/cli`)
- Alpine.js + persist plugin (client interactivity, loaded from CDN)
- Chart.js (only on the Reports page, loaded from CDN)
- i18next + `i18next-fs-backend` + `i18next-http-middleware`
  (mirrors the original `next-intl` setup, same `en.json` / `tr.json` files)
- `express-session` for the demo auth flow

## Layout

```
src/
├── index.ts                 # boots dotenv + createApp()
├── app.ts                   # express setup, middleware, route mounting
├── config/
│   ├── handlebars.ts        # view engine + helpers (t, eq, icon, json, …)
│   └── i18n.ts              # i18next init
├── middleware/
│   ├── auth.ts              # session-based requireAuth
│   └── locals.ts            # exposes t/locale/currentPath/user to views
├── lib/                     # menu builder + orders row helper
├── data/mockData.ts         # mock customers, inventory, KPIs, charts
├── i18n/messages/{en,tr}.json
├── routes/                  # one router per top-level URL
├── views/
│   ├── icons.ts             # inline-SVG icon map (replaces lucide-react)
│   ├── layouts/{app,auth}.hbs
│   ├── partials/
│   │   ├── head.hbs
│   │   ├── layout/{app-header,app-sidebar}.hbs
│   │   └── ui/               # button, card, badge, input, select-box,
│   │                         # search-input, metric-card, section-header,
│   │                         # summary-card-item, data-table, ask-ai-button
│   └── pages/                # one .hbs per route (dashboard, inventory, …)
└── public/                  # static assets (CSS, images, favicons, logo)
```

## Running

```bash
npm install
cp .env.example .env

# Dev: ts-node + tailwindcss --watch (concurrently)
npm run dev

# Build: tailwind --minify, then tsc, then copy views/i18n/public into dist/
npm run build
npm start
```

Default port is `4000` (override with `PORT=` in `.env`).
Use any email and password to log in — the auth flow is the same demo stub
the Next.js app shipped with.

## Mapping from the Next.js app

| Next.js                                       | This project                                  |
|-----------------------------------------------|-----------------------------------------------|
| `src/app/layout.tsx`                          | `src/views/layouts/app.hbs`                   |
| `src/app/(app)/layout.tsx`                    | `src/views/layouts/app.hbs` + middleware/auth |
| `src/app/page.tsx`                            | `src/routes/index.ts`                         |
| `src/app/(auth)/login/page.tsx`               | `src/routes/auth.ts` + `views/pages/login.hbs`|
| `src/app/(app)/<feature>/page.tsx`            | `src/routes/<feature>.ts` + `views/pages/...` |
| `src/components/layout/*`                     | `src/views/partials/layout/*`                 |
| `src/components/ui/*`                         | `src/views/partials/ui/*`                     |
| `src/data/mockData.ts`                        | `src/data/mockData.ts`                        |
| `src/app/messages/{en,tr}.json`               | `src/i18n/messages/{en,tr}.json`              |
| `lucide-react` icons                          | `src/views/icons.ts` (inline SVG)             |
| `useState`/`useRouter` for sidebar/dropdowns  | Alpine.js with `$persist`                     |
| `react-chartjs-2` on Reports                  | Chart.js (CDN) + small Alpine component       |
| `next-intl` `useTranslations`                 | `i18next` + `{{t "key"}}` helper              |

## i18n

The Tailwind/Handlebars setup speaks the same JSON message format as the
original. To switch language, set the cookie or pass `?lng=tr` on any URL —
the detector caches the choice for the rest of the session.
