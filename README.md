# 🩸 HemaCare — Blood Donation Management System

A production-oriented, scalable, and secure **Blood Donation Management Web Application** designed with clean architectural boundaries, strict RBAC authorization, automated eligibility calculations, and comprehensive test coverage.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture & Design Decisions](#-architecture--design-decisions)
3. [Technology Stack](#-technology-stack)
4. [Monorepo Structure](#-monorepo-structure)
5. [Database Schema & Models](#-database-schema--models)
6. [Eligibility Engine](#-eligibility-engine)
7. [API Specification](#-api-specification)
8. [Security & Authorization Model](#-security--authorization-model)
9. [Prerequisites & Environment Setup](#-prerequisites--environment-setup)
10. [Local Development Commands](#-local-development-commands)
11. [Testing & Quality Assurance](#-testing--quality-assurance)
12. [Production Build & Deployment](#-production-build--deployment)

---

## 🏥 Project Overview

HemaCare bridges voluntary blood donors and healthcare centers through a secure, structured registry:

- **For Donors:**
  - Fast, accessible donor registration with blood group specification.
  - Personalized Donor Dashboard with lifetime donation counts and next-donation countdown.
  - Pure automated **Eligibility Engine** calculating age thresholds and donation intervals (56 days).
  - Profile management for personal contact details and residential address.
  - Complete chronological history of verified clinical donation sessions.

- **For Clinical Administrators:**
  - Secure staff portal with dashboard metrics (Active Donors, Eligible Donors, Recent Collections, Lifetime Donations).
  - Active donors by blood group distribution visualization (`O-`, `O+`, `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`).
  - Server-side searchable, filterable, and paginated donor directory.
  - Detailed donor clinical modal with historical records.
  - Procedure logging modal to record whole blood donations with atomic `lastDonationAt` updating.
  - Non-destructive soft-deactivation mechanism (`deletedAt`) to preserve historical auditability.

---

## 🏛 Architecture & Design Decisions

```mermaid
graph TD
    Client[React 19 + TypeScript Client] -->|REST API Requests with HttpOnly JWT| Server[Express + TypeScript API Server]
    Server --> AuthMW[Authentication & RBAC Middleware]
    AuthMW --> Controllers[Controllers Layer]
    Controllers --> Services[Domain Services Layer]
    Services --> Eligibility[Pure Eligibility Engine]
    Services --> Prisma[Prisma ORM Client]
    Prisma --> Postgres[(PostgreSQL Database)]
```

### Key Architectural Boundaries:
1. **Strict Frontend/Backend Isolation:** The frontend never directly imports Prisma models, database drivers, or server secrets. All interactions flow through typed API service modules (`auth.service.ts`, `donor.service.ts`, `admin.service.ts`).
2. **Server-Decided Roles (Anti-Escalation):** Public registration strictly enforces `role: DONOR` on the server. Client-supplied role injections are ignored and validated against Zod schemas.
3. **Soft-Delete Strategy:** Deactivating donors marks `deletedAt: now()` rather than destroying records, maintaining relational integrity with past donations.
4. **Transactional Consistency:** Critical multi-table operations (e.g. User + DonorProfile creation, Donation logging + `lastDonationAt` sync) execute inside `prisma.$transaction`.
5. **No Age Storing:** Stores immutable `dateOfBirth` as ISO DateTime and derives age dynamically to prevent temporal drift.

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, React Router v7, TanStack Query v5, React Hook Form, Zod, Tailwind CSS, Lucide React |
| **Backend** | Node.js, Express, TypeScript, REST API, Zod validation, Helmet, CORS, Express-Rate-Limit, Morgan |
| **Database** | PostgreSQL 18, Prisma ORM 6 (User, DonorProfile, Donation, AuditLog models) |
| **Authentication** | bcryptjs (12 salt rounds), JSON Web Tokens (HS256 with minimal standard claims), HttpOnly SameSite secure cookies |
| **Testing** | Vitest, Supertest (59 automated tests covering Auth, RBAC, IDOR, Donors, Admin, Donations, Eligibility, Health, Param Validation) |

---

## 📂 Monorepo Structure

```text
blood-donation-app/
│
├── client/                     # Frontend SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Button, Input, Select, Badge, Card, Modal, Pagination, StatCard, etc.
│   │   │   ├── auth/           # LoginForm, RegistrationForm, ProtectedRoute
│   │   │   ├── donor/          # DonorCard, ProfileForm, DonationHistory, EligibilityCard
│   │   │   └── admin/          # AdminHeader, AdminSidebar, DonorTable, DonorFilters, Modals
│   │   ├── contexts/           # AuthContext & Session management
│   │   ├── hooks/              # useAuth
│   │   ├── layouts/            # PublicLayout, DonorLayout, AdminLayout
│   │   ├── lib/                # api (Axios), utils (formatting, badge colors, cn)
│   │   ├── pages/              # Home, Login, Register, AdminLogin, Donor & Admin views
│   │   ├── routes/             # AppRoutes with role guards
│   │   ├── schemas/            # Zod form schemas
│   │   ├── services/           # Typed API service clients
│   │   ├── types/              # Frontend TypeScript interfaces
│   │   ├── App.tsx             # Root Provider setup
│   │   └── main.tsx            # DOM entrypoint
│   ├── public/                 # Static assets & favicon
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                     # Backend REST API
│   ├── src/
│   │   ├── config/             # env validation (Zod fail-fast), db (Prisma singleton)
│   │   ├── controllers/        # auth, donor, admin controllers
│   │   ├── middleware/         # authenticate, requireRole, validateBody, errorHandler
│   │   ├── routes/             # auth, donor, admin, root routes
│   │   ├── services/           # auth, donor, admin, eligibility services
│   │   ├── validators/         # Zod API request schemas
│   │   ├── utils/              # custom error classes, standardized response envelopes
│   │   ├── types/              # Server TypeScript types & RBAC interfaces
│   │   ├── app.ts              # Express application configuration
│   │   └── server.ts           # Server bootstrap & graceful shutdown
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema, enums, models, indexes
│   │   └── seed.ts             # Realistic database seed engine
│   ├── tests/                  # Vitest + Supertest automated suites
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
├── .env.example
├── README.md
└── package.json
```

---

## 🗄 Database Schema & Models

### Enums
- `Role`: `DONOR`, `ADMIN`
- `BloodGroup`: `A_POSITIVE`, `A_NEGATIVE`, `B_POSITIVE`, `B_NEGATIVE`, `AB_POSITIVE`, `AB_NEGATIVE`, `O_POSITIVE`, `O_NEGATIVE`

### Core Models & Indexes
```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String
  role         Role          @default(DONOR)
  donorProfile DonorProfile?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([email])
}

model DonorProfile {
  id             String      @id @default(uuid())
  userId         String      @unique
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName       String
  dateOfBirth    DateTime
  address        String
  contactNumber  String
  bloodGroup     BloodGroup
  lastDonationAt DateTime?
  preferences    Json?       @default("{}")
  deletedAt      DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  donations      Donation[]

  @@index([bloodGroup])
  @@index([contactNumber])
  @@index([deletedAt])
}

model Donation {
  id             String       @id @default(uuid())
  donorId        String
  donor          DonorProfile @relation(fields: [donorId], references: [id], onDelete: Cascade)
  donatedAt      DateTime     @default(now())
  location       String
  notes          String?
  createdAt      DateTime     @default(now())

  @@index([donorId])
  @@index([donatedAt])
}
```

---

## 🧪 Eligibility Engine

Located at [`server/src/services/eligibility.service.ts`](file:///c:/Users/Anupam%20Baral/Desktop/blood-donation/server/src/services/eligibility.service.ts), this pure, decoupled service calculates:
1. **Age Requirement:** Must be between 18 and 65 years old.
2. **Interval Rule:** Minimum 56 days (8 weeks) between whole blood donations.
3. **Account Status:** Must not be soft-deleted (`deletedAt == null`).
4. **Countdown Indicator:** Computes exact `daysUntilEligible` and ISO formatted `nextEligibleDate`.

> [!NOTE]
> The UI displays a mandatory clear disclaimer: *"Basic eligibility indicator only. Formal medical and hemoglobin screening is performed at the donation center prior to collection."*

---

## 📡 API Specification

Base URL: `/api/v1`

### Authentication (`/auth`)
- `POST /api/v1/auth/register` — Registers new Donor (creates User + DonorProfile in transaction, assigns `DONOR` role, issues HttpOnly cookie).
- `POST /api/v1/auth/login` — Authenticates credentials, sets HttpOnly JWT cookie.
- `POST /api/v1/auth/logout` — Clears authentication cookie.
- `GET  /api/v1/auth/me` — Fetches current session user and calculated eligibility.

### Donor Portal (`/donors`)
- `GET   /api/v1/donors/me` — Retrieve own donor profile.
- `PATCH /api/v1/donors/me` — Update personal contact details (`fullName`, `address`, `contactNumber`).
- `GET   /api/v1/donors/me/donations` — Retrieve personal chronological donation history.
- `GET   /api/v1/donors/me/eligibility` — Retrieve calculated eligibility status and criteria breakdown.

### Admin Management (`/admin`)
- `GET    /api/v1/admin/dashboard` — Aggregated metrics (active donors, eligible count, recent collections, blood group distribution).
- `GET    /api/v1/admin/donors` — Filterable (`bloodGroup`), searchable (`search`), and paginated (`page`, `limit`) donor list.
- `GET    /api/v1/admin/donors/:id` — Full donor record with clinical donation history.
- `PATCH  /api/v1/admin/donors/:id` — Update donor information.
- `DELETE /api/v1/admin/donors/:id` — Soft-deactivates donor (`deletedAt = now()`).
- `GET    /api/v1/admin/donors/:id/donations` — Get donation procedures for a donor.
- `POST   /api/v1/admin/donors/:id/donations` — Log a new blood donation (atomically syncs `lastDonationAt`).

---

## 🔐 Security & Authorization Model

1. **Password Protection:** Passwords hashed with `bcryptjs` (salt rounds: 12). Plaintext passwords and hashes are never exposed or logged.
2. **HttpOnly Cookie Authentication:** JWT tokens transmitted via `HttpOnly`, `SameSite: Lax`, and `Secure` (production) cookies, preventing XSS token theft.
3. **Role-Based Access Control (RBAC):** Backend middleware (`authenticate` & `requireRole`) strictly verifies identity against the database.
4. **IDOR & Isolation:** Donors can only query `/donors/me/*`. Cross-donor ID access is impossible.
5. **Rate Limiting & Headers:** Express Rate Limiting (100 req/15min on auth endpoints) and Helmet HTTP security headers.
6. **Strict CORS:** Enforces explicit allowed origins (`CLIENT_URL`); wildcard `*` is prohibited.

---

## 🚀 Prerequisites & Environment Setup

### 1. Prerequisites
- Node.js `v18+` (v20+ or v24 recommended)
- PostgreSQL `v14+` running locally on port `5432`

### 2. Environment Variables Configuration
Copy `.env.example` to `.env` in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blood_donation_db?schema=public"

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Authentication Security
JWT_SECRET=super-secret-jwt-key-must-be-at-least-32-chars-long
JWT_EXPIRES_IN=7d

# Initial Admin Credentials for Seeding
ADMIN_EMAIL=admin@blooddonation.org
ADMIN_PASSWORD=AdminSecurePass123!
```

---

## 💻 Local Development Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations
```bash
npm run prisma:migrate
```

### 3. Seed Realistic Test Data
Populates the admin account (`admin@blooddonation.org` / `AdminSecurePass123!`) and 15+ donors with various blood groups and donation histories:
```bash
npm run prisma:seed
```

### 4. Run Both Frontend and Backend (Concurrent)
```bash
npm run dev
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)

### Dedicated Individual Scripts:
```bash
npm run dev:server     # Run backend with tsx watch
npm run dev:client     # Run Vite dev server
```

---

## 🧪 Testing & Quality Assurance

Run the automated backend test suite (41 tests):
```bash
npm run test
```

### Test Suites Included:
- `tests/eligibility.test.ts` — Boundary tests for age (<18, 18, 65, >65) and donation intervals (0 days, 55 days, 56 days, 90 days, deactivated).
- `tests/auth.test.ts` — Registration, validation, weak passwords, duplicate emails, login, session cookies, logout.
- `tests/authorization-security.test.ts` — 401 unauthenticated guards, 403 donor-to-admin blocks, role escalation defenses, IDOR checks.
- `tests/donor.test.ts` — Profile reads, updates, history queries, eligibility calculation.
- `tests/admin.test.ts` — Metrics aggregation, search, filtering, pagination, donor editing, donation recording, soft-deletion.

### Typecheck & Linting:
```bash
npm run typecheck --workspaces
npm run build --workspaces
```

---

## 📦 Production Build & Deployment

1. Build both workspaces for production:
   ```bash
   npm run build
   ```
2. Apply migrations to production database:
   ```bash
   npx prisma migrate deploy --schema=server/prisma/schema.prisma
   ```
3. Start the production backend server:
   ```bash
   npm run start --workspace=server
   ```
4. Serve the static frontend assets from `client/dist/` using Nginx, Cloudflare Pages, AWS S3/CloudFront, or your preferred static host.

---

## 📄 License & Compliance

Developed as a modern, production-grade civic healthcare system. Open-source under the MIT License.
