@AGENTS.md

# Chilimba Client Application

Digital village banking & savings groups platform built with Next.js 16 + React 19 + Tailwind CSS v4.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router) |
| Runtime | React 19.2.4 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss` |
| Icons | lucide-react |
| Font | Geist Sans (Google Fonts) |
| Backend | REST API at `https://chilimba-application-api.vercel.app/api` |

No external UI component libraries. All components are hand-rolled in `components/`.

---

## Commands

```bash
npm run dev      # dev server on http://localhost:3000
npm run build    # production build
npm run start    # run production build
npm run lint     # ESLint
```

---

## Environment

`.env.local` (gitignored):
```
NEXT_PUBLIC_API_URL=https://chilimba-application-api.vercel.app/api
```

If missing, `lib/api.ts` falls back to the same Vercel URL hardcoded as default.

---

## Project Structure

```
app/
  layout.tsx                  Root layout — mounts AuthProvider, loads Geist font
  page.tsx                    Redirects / → /dashboard
  globals.css                 Tailwind import + CSS custom properties (brand colours)

  (app)/                      Protected route group — requires authentication
    layout.tsx                Redirects unauthenticated users to /auth/login
    dashboard/page.tsx        Financial overview: balances, upcoming dues, group cards
    wallet/page.tsx           Personal & group wallet balances
    groups/page.tsx           List groups, create/join modals
    groups/[groupId]/
      page.tsx                Group detail, members list, invite code management
      contributions/page.tsx  Contribution table with Pay action
      withdrawals/page.tsx    Withdrawal requests + approve/reject voting
      committees/page.tsx     Crowdfunding pools (create, contribute, close)
      messages/page.tsx       Real-time-style group chat board
    transactions/page.tsx     Filterable transaction history
    approvals/page.tsx        Pending contributions and withdrawal votes
    notifications/page.tsx    Notification list with mark-read
    profile/page.tsx          Profile edit + change password

  admin/                      Requires role: admin | super_admin
    layout.tsx
    page.tsx                  Admin dashboard + pending payouts
    users/page.tsx            User list, KYC verify, suspend/ban
    groups/page.tsx           Group list + status management
    payouts/page.tsx          Disburse pending payouts
    withdrawals/page.tsx      All platform withdrawals (read-only view)
    fees/page.tsx             Fee config cards with inline edit

  superadmin/                 Requires role: super_admin only
    layout.tsx                Adds purple "Super Admin Mode" banner
    page.tsx                  Platform overview + health alerts + quick links
    analytics/page.tsx        User growth, top groups, revenue, compliance charts
    settings/page.tsx         Platform settings key/value editor
    admins/page.tsx           Admin user cards + role promotion/demotion
    audit/page.tsx            Filterable audit log table

  auth/
    login/page.tsx
    register/page.tsx

components/
  layout/
    Navbar.tsx                Sticky top bar: logo, nav links, user dropdown
    Sidebar.tsx               Left nav: member links + conditional admin/superadmin sections
  ui/
    Button.tsx                variants: primary | secondary | danger | ghost | outline
    Card.tsx                  Card wrapper + StatCard (icon + label + value)
    Badge.tsx                 Status colour badges + statusVariant() helper
    Input.tsx                 Input, Select, Textarea — all with label + error props
    Modal.tsx                 Overlay modal, sizes: sm | md | lg
    Spinner.tsx               Spinner + PageSpinner (full-height centred)
    Pagination.tsx            Page number buttons + prev/next

contexts/
  AuthContext.tsx             useAuth() hook — user, loading, login, logout, refresh

lib/
  api.ts                      All API calls + TypeScript types for every entity
```

---

## Authentication

Flow:
1. `POST /auth/login` → returns `accessToken` + `refreshToken`
2. Both stored in `localStorage`
3. Every API request sends `Authorization: Bearer <accessToken>`
4. On `401`, `lib/api.ts` calls `POST /auth/refresh` automatically
5. If refresh fails → clears tokens → redirects to `/auth/login`

`useAuth()` exposes: `user`, `loading`, `login()`, `logout()`, `refresh()`

**Important:** The API returns snake_case fields (`first_name`, `last_name`, `profile_photo_url`). `AuthContext.tsx` normalises these to camelCase via `normalizeUser()` before setting state. Always use camelCase (`user.firstName`, `user.lastName`) throughout the app.

Layout redirect pattern — always use `useEffect`, never call `router.replace()` during render:
```tsx
useEffect(() => {
  if (!loading && !user) router.replace('/auth/login');
}, [loading, user, router]);

if (loading || !user) return <PageSpinner />;
```

---

## Role-Based Access

| Role | Access |
|------|--------|
| `member` | `(app)/*` routes only |
| `admin` | `(app)/*` + `admin/*` |
| `super_admin` | `(app)/*` + `admin/*` + `superadmin/*` |

Each layout enforces its own role check. The Sidebar conditionally renders admin/superadmin sections based on `user.role`.

---

## API Client (`lib/api.ts`)

Single `request<T>()` function handles all HTTP calls. Exported namespaces:

```
auth.*           login, register, logout, me, updateMe, changePassword
groups.*         create, join, list, get, update, rotateInvite, payoutSchedule, removeMember
contributions.*  my, upcoming, pay, group
withdrawals.*    request, list, vote
committees.*     create, list, contribute, contributors, close
messages.*       post, list, delete
wallet.*         list, transactions
notifications.*  list, markAllRead, markRead
admin.users.*    list, get, updateStatus, verify
admin.groups.*   list, updateStatus
admin.payouts.*  pending, disburse
admin.withdrawals.* list
admin.fees.*     list, update
admin.notifications.* broadcast
superAdmin.analytics.* overview, daily, groups, compliance, revenue, topGroups, userGrowth
superAdmin.settings.*  list, update
superAdmin.admins.*    list, updateRole
superAdmin.auditLogs()
superAdmin.health()
```

All paginated endpoints accept `{ page, limit, ...filters }` as `Record<string, string>`.
All paginated responses return `PaginatedResponse<T>` with a `pagination` object.

---

## Styling Conventions

Brand colours (defined in `globals.css` as CSS custom properties):

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#0d9488` | Buttons, links, active sidebar items |
| `--primary-dark` | `#0f766e` | Hover states |
| `--background` | `#f5f4f0` | Page background |
| `--card` | `#ffffff` | Card backgrounds |
| `--border` | `#e5e7eb` | Borders |

Use Tailwind utility classes directly. The brand teal maps to `teal-600` / `teal-700` in Tailwind v4.

Status badge colours via `statusVariant(status)`:
- `active / paid / approved / completed` → `success` (emerald)
- `pending / pending_approval / pending_verification` → `warning` (amber)
- `late / rejected / suspended / banned` → `danger` (red)
- `processing / scheduled` → `info` (blue)
- `paused / waived / closed` → `neutral` (gray)

---

## Key Patterns

**Data fetching in pages:**
```tsx
useEffect(() => {
  Promise.allSettled([
    api.one().then(r => setOne(r.data)),
    api.two().then(r => setTwo(r.data)),
  ]).finally(() => setLoading(false));
}, []);
```

**Forms with FormData (multipart, e.g. file uploads):**
```tsx
const fd = new FormData(e.currentTarget);
await groups.create(fd);  // lib/api.ts skips Content-Type so browser sets multipart boundary
```

**Forms with JSON:**
```tsx
await withdrawals.request(groupId, Number(amount), reason);
```

**Modal open/close pattern:**
```tsx
const [open, setOpen] = useState(false);
<Button onClick={() => setOpen(true)}>Open</Button>
<Modal open={open} onClose={() => setOpen(false)} title="...">...</Modal>
```

**Dynamic route params** — params is a Promise in Next.js 16:
```tsx
const { groupId } = useParams<{ groupId: string }>();
```

---

## Notable Constraints

- `node_modules/next/dist/docs/` contains the actual Next.js 16 documentation — read it before using unfamiliar APIs; breaking changes exist from prior versions.
- `params` in server components is `Promise<{ slug: string }>` and must be `await`ed.
- `searchParams` is also a Promise in server component pages.
- Never call `router.push/replace()` during render — only inside `useEffect` or event handlers.
- Tailwind v4 uses `@import "tailwindcss"` (not `@tailwind base/components/utilities` directives).
- Custom theme tokens go in the `@theme inline {}` block in `globals.css`.
