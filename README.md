# She Learn — Online Course Platform by She Software Solutions

A professional online video-learning platform (in the spirit of Great Learning / Udemy) for **[She Software Solutions](https://www.shesoftwaresolutions.com)** — a women-led technology company from Tamil Nadu. It is built entirely with **Next.js 16** (frontend + backend), **PostgreSQL + Prisma**, **Auth.js** and **Razorpay**.

The brand styling (signature pink `#ff69b4`, deep plum neutrals, Cinzel + Geist typography, official logos) and the contact details come from the company website.

---

## Features

### Roles and access

| Role | Can access | Can do |
| --- | --- | --- |
| **Learner** | `/dashboard`, `/learn/*` | Enroll (free or paid), watch lessons, track progress, take quizzes, submit assignments, ask questions, review courses, earn certificates, apply for internships, register for events |
| **Tutor** | Learner areas + `/tutor/*` | Create and edit courses (sections, video lessons, quizzes, assignments), submit courses for review, grade submissions, answer Q&A, see students and revenue |
| **Admin** | Everything + `/admin/*` | Approve or reject courses, feature or unpublish them, manage users and roles, categories, payments, internships and applications, events and registrations, and contact messages |

Access is enforced in three layers:

1. The Next.js 16 `proxy` (formerly middleware) checks the role for each area.
2. Every page checks again with `requireUser`.
3. Every server action and API route checks again, including course ownership.

Deactivated users are signed out within a minute.

### Learner experience
- Course catalog with search, category, level, price filters and sorting
- Course pages with curriculum, preview video, instructor bio, ratings and reviews, and discount pricing
- A distraction-free **course player**: YouTube/Vimeo embeds, a curriculum sidebar with progress, mark-complete-and-continue, prev/next, and per-lesson **Q&A**
- **Quizzes** with auto-grading, pass marks, explanations and retakes
- **Assignments** submitted as a link or text, with mentor feedback and resubmission
- **Certificates** issued automatically once every lesson is done and every quiz is passed. Each has a printable/PDF layout, a public verification page (`/verify`) and an "Add to LinkedIn" button
- Dashboard with continue-learning cards, stats, purchases, internship applications and events

### Payments (Razorpay)
- Checkout with UPI, cards and netbanking (`/api/payments/order` → Razorpay Checkout → `/api/payments/verify` with HMAC signature verification)
- A webhook at `/api/webhooks/razorpay` enrolls the learner even if the browser closes mid-payment
- **Dev mode:** without Razorpay keys in a non-production build, checkout is simulated so the whole flow can be tested. In production, missing keys disable paid checkout.

---

## Getting started

### Prerequisites
- Node.js 20.9+ (tested with Node 22)
- PostgreSQL 14+ (local via Docker, or hosted on [Neon](https://neon.tech) or [Supabase](https://supabase.com))

### Setup

```bash
npm install
cp .env.example .env                 # then fill in the values
docker compose up -d                 # optional: local Postgres on :5432
npx prisma migrate deploy            # create tables
npm run db:seed                      # admin, categories and demo content
npm run dev                          # http://localhost:3000
```

### Demo accounts (from the seed)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@shesoftwaresolutions.com` | `Admin@12345` |
| Tutor | `priya.tutor@example.com` (also `kavya.tutor@`, `anitha.tutor@`) | `Tutor@12345` |
| Learner | `learner@example.com` | `Learner@12345` |

> **Before going live, change the admin password** under Profile & settings. For a production database, seed only the admin and categories with `SEED_DEMO=false npm run db:seed`.

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Generate with `openssl rand -base64 32` |
| `AUTH_URL`, `NEXT_PUBLIC_APP_URL` | ✅ | The public URL of the site; used in certificate verification links |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | optional | Enables "Continue with Google". Callback URL: `<APP_URL>/api/auth/callback/google` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | for paid courses | From Razorpay Dashboard → API Keys (start with `rzp_test_` keys) |
| `RAZORPAY_WEBHOOK_SECRET` | recommended | Dashboard → Webhooks → URL `<APP_URL>/api/webhooks/razorpay`, events `payment.captured`, `order.paid`, `payment.failed` |

---

## Deployment (recommended: Vercel + Neon)

1. Create a Postgres database on Neon or Supabase and copy its connection string.
2. Import this repository into Vercel and add the environment variables above.
3. The build command `npm run build` runs `prisma generate`. Run `npx prisma migrate deploy` against the production database once, then after each schema change. You can also add it as a release step.
4. Seed the admin: `SEED_DEMO=false npm run db:seed`.
5. Configure the Razorpay webhook and the Google OAuth redirect URI with your domain.

Any Node host works too (`npm run build && npm start`): Render, Railway, AWS, or a VPS.

---

## Project structure

```
prisma/
  schema.prisma        data model (users/roles, courses, sections, lessons, quizzes,
                       assignments, enrollments, progress, payments, reviews, Q&A,
                       certificates, internships, events, contact messages)
  seed.ts              admin, categories, demo courses, internships and events
src/
  proxy.ts             role-based route protection
  app/
    (site)/            public pages: home, catalog, course, auth, internships, events, about, contact…
    dashboard/         learner area
    learn/[slug]/      course player (lessons, quizzes, assignments, Q&A)
    tutor/             tutor studio (course builder, quiz editor, submissions, Q&A inbox, students)
    admin/             admin console
    certificates/      printable and verifiable certificates
    actions/           server actions (auth, enroll, learning, tutor, admin, public, profile)
    api/               Auth.js, Razorpay order/verify, Razorpay webhook
  components/          UI primitives, layout, course, learning and dashboard components
  lib/                 db, auth, session guards, catalog/learning queries, Razorpay, utils
```

## Customisation notes
- **Brand:** colours live in `src/app/globals.css` (`--brand`, `--primary`, `--ink`). Company details are in `src/lib/site.ts`. Logos are in `public/brand/`.
- **Videos:** lessons use YouTube or Vimeo links (unlisted videos work). The demo seed uses public freeCodeCamp videos as placeholders; replace them with your own.
- **Legal pages:** `/legal/terms`, `/legal/privacy` and `/legal/refunds` are templates. In particular, the 7-day / 30% refund rule is a placeholder. Have them reviewed before launch.
- **Testimonials** on the homepage are the public Google reviews shown on shesoftwaresolutions.com.
