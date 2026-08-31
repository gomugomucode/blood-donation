# 🩸 HemaCare — Blood Donation Management System

A production-oriented, scalable, and secure **Blood Donation Management & Emergency Blood Request Coordination Web Application** designed with clean architectural boundaries, strict RBAC authorization, automated eligibility calculations, deterministic donor-candidate matching, and comprehensive test coverage.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture & Design Decisions](#-architecture--design-decisions)
3. [Blood Requests & Donor Matching Engine](#-blood-requests--donor-matching-engine)
4. [Technology Stack](#-technology-stack)
5. [Monorepo Structure](#-monorepo-structure)
6. [Database Schema & Models](#-database-schema--models)
7. [Eligibility & Compatibility Engines](#-eligibility--compatibility-engines)
8. [API Specification](#-api-specification)
9. [Security & Authorization Model](#-security--authorization-model)
10. [Prerequisites & Environment Setup](#-prerequisites--environment-setup)
11. [Local Development Commands](#-local-development-commands)
12. [Testing & Quality Assurance (86 Passing Tests)](#-testing--quality-assurance-86-passing-tests)
13. [Production Build & Deployment](#-production-build--deployment)

---

## 🏥 Project Overview

HemaCare bridges voluntary blood donors, clinical collection teams, and hospital coordinators through a secure registry and coordination platform:

- **For Donors:**
  - Fast, accessible donor registration with blood group specification.
  - Personalized Donor Dashboard with lifetime donation counts and next-donation countdown.
  - Pure automated **Eligibility Engine** calculating age thresholds (18–65) and interval cooldowns (56 days).
  - Profile management for personal contact details and residential address.
  - Complete chronological history of verified clinical donation sessions.

- **For Clinical Administrators & Staff:**
  - Secure staff portal with real-time KPI overview (Active Donors, Eligible Donors, Recent Collections, Open Blood Requests).
  - Active donors by blood group distribution visualization (`O-`, `O+`, `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`).
  - Server-side searchable, filterable, and paginated donor directory.
  - Detailed donor clinical modal with historical records.
  - Procedure logging modal to record whole blood donations with atomic `lastDonationAt` updating.
  - Non-destructive soft-deactivation mechanism (`deletedAt`) to preserve historical auditability.
  - **Clinical Blood Requests & Emergency Coordination:**
    - Create and manage hospital blood requests with urgency levels (`CRITICAL`, `HIGH`, `NORMAL`, `LOW`).
    - Deterministic multi-factor candidate matching and ranking engine (0–100 score).
    - Ranked donor candidate list with transparent scoring breakdown and contact dispatch logging.
    - Atomic donation-to-request fulfillment linking transactions.
    - Automatic request status transitions (`OPEN` -> `PARTIALLY_FULFILLED` -> `FULFILLED`).

---

## 🏛 Architecture & Design Decisions

```mermaid
graph TD
    Client[React 19 + TypeScript Client] -->|REST API Requests with HttpOnly JWT| Server[Express + TypeScript API Server]
    Server --> AuthMW[Authentication & RBAC Middleware]
    AuthMW --> Controllers[Controllers Layer]
    Controllers --> Services[Domain Services Layer]
    Services --> Compatibility[Pure Red-Cell ABO/Rh Compatibility Engine]
    Services --> Matching[Deterministic 100-pt Matching & Ranking Engine]
    Services --> Eligibility[Pure Eligibility Engine]
    Services --> Notification[Notification Service Abstraction]
    Services --> Prisma[Prisma ORM Client]
    Prisma --> Postgres[(PostgreSQL Database)]
```

### Key Architectural Boundaries:
1. **Strict Frontend/Backend Isolation:** The frontend never directly imports Prisma models, database drivers, or server secrets. All interactions flow through typed API service modules (`auth.service.ts`, `donor.service.ts`, `admin.service.ts`, `blood-request.service.ts`).
2. **Server-Decided Roles (Anti-Escalation):** Public registration strictly enforces `role: DONOR` on the server. Client-supplied role injections are ignored and validated against Zod schemas.
3. **Pure Domain Logic Separation:** Eligibility calculation (`eligibility.service.ts`), ABO/Rh compatibility (`blood-compatibility.service.ts`), and matching ranking (`matching.service.ts`) are pure, testable functions decoupled from database/HTTP concerns.
4. **Atomic Transactions:** Critical operations—such as registering a donor profile or recording a donation linked to a blood request—execute inside `prisma.$transaction` blocks to guarantee ACID invariants.

---

## 🩸 Blood Requests & Donor Matching Engine

### Red-Cell ABO/Rh Compatibility Matrix
The system implements pure clinical red-cell compatibility rules:
- **O- Recipient:** Can only receive from `O-` (Universal donor to others).
- **O+ Recipient:** Receives from `O-`, `O+`.
- **A- Recipient:** Receives from `O-`, `A-`.
- **A+ Recipient:** Receives from `O-`, `O+`, `A-`, `A+`.
- **B- Recipient:** Receives from `O-`, `B-`.
- **B+ Recipient:** Receives from `O-`, `O+`, `B-`, `B+`.
- **AB- Recipient:** Receives from `O-`, `A-`, `B-`, `AB-`.
- **AB+ Recipient:** Receives from all 8 blood groups (Universal recipient).

### 100-Point Deterministic Candidate Ranking Algorithm
Candidate donors are evaluated and ranked deterministically using a multi-factor 100-point scoring algorithm:
1. **Blood Group Compatibility (Max 40 points):**
   - Exact ABO/Rh match: `40 points`
   - Compatible alternative donor group: `30 points`
2. **Eligibility & Interval Readiness (Max 25 points):**
   - Immediate clinical eligibility (age 18–65, >=56 days since last donation): `25 points`
   - Ineligible or active cooldown (<56 days): `Excluded from candidate pool`
3. **Location Proximity (Max 20 points):**
   - Donor city matches request hospital/regional location: `20 points`
   - Different regional location: `5 points`
4. **Donation History Cadence (Max 10 points):**
   - Well-rested donor (>90 days since last donation): `10 points`
   - First-time donor (no prior donation history): `8 points`
   - Eligible interval (56–90 days): `6 points`
5. **Profile Contact Recency (Max 5 points):**
   - Valid contact phone & recent profile update: `5 points`

### Medical Disclaimer Notice
> [!IMPORTANT]
> The HemaCare matching engine provides application-level screening and coordination recommendations only. All final donor eligibility, health evaluation, and blood safety verification must be clinically established through accredited collection and laboratory crossmatching procedures.

---

## 🛠 Technology Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite** build tooling
- **Tailwind CSS** for responsive styling
- **TanStack Query (React Query v5)** for server-state caching and invalidation
- **React Hook Form** + **Zod** for schema-driven form validation
- **Lucide React** for UI icons

### Backend
- **Node.js** with **Express** & **TypeScript**
- **PostgreSQL** relational database
- **Prisma ORM** for type-safe database queries, relations, and migrations
- **bcryptjs** for salted password hashing (12 rounds)
- **jsonwebtoken** for HttpOnly session tokens
- **Helmet**, **cors**, **express-rate-limit** for API security and rate limiting

---

## 📂 Monorepo Structure

```
blood-donation/
├── client/                     # Frontend React SPA
│   ├── src/
│   │   ├── components/         # Reusable UI components (Modals, Badges, Cards, Inputs)
│   │   ├── hooks/              # Custom hooks (useAuth, useBloodRequests)
│   │   ├── layouts/            # Public, Donor, and Admin layouts
│   │   ├── pages/              # Donor & Admin management & request pages
│   │   ├── services/           # Axios API client modules
│   │   └── types/              # Frontend TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Backend Express REST API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema definition
│   │   └── migrations/         # Versioned SQL migrations
│   ├── src/
│   │   ├── controllers/        # Request handling controllers
│   │   ├── middlewares/        # Auth, role check, error handler, rate limiters
│   │   ├── routes/             # Versioned API routes (/api/v1/...)
│   │   ├── services/           # Domain logic (matching, compatibility, eligibility, requests)
│   │   ├── validators/         # Zod input validation schemas
│   │   └── types/              # Server TypeScript definitions
│   ├── tests/                  # Vitest backend test suites (86 tests)
│   └── package.json
├── package.json                # Monorepo root with workspace scripts
└── README.md                   # Full system documentation
```

---

## 🗄 Database Schema & Models

```prisma
enum Role {
  DONOR
  ADMIN
}

enum BloodGroup {
  A_POSITIVE
  A_NEGATIVE
  B_POSITIVE
  B_NEGATIVE
  AB_POSITIVE
  AB_NEGATIVE
  O_POSITIVE
  O_NEGATIVE
}

enum RequestStatus {
  OPEN
  PARTIALLY_FULFILLED
  FULFILLED
  CANCELLED
  EXPIRED
}

enum RequestUrgency {
  LOW
  NORMAL
  HIGH
  CRITICAL
}

model User {
  id             String         @id @default(uuid())
  email          String         @unique
  passwordHash   String
  role           Role           @default(DONOR)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  donorProfile   DonorProfile?
  createdRequests BloodRequest[]

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

model BloodRequest {
  id               String         @id @default(uuid())
  bloodGroup       BloodGroup
  unitsRequired    Int
  unitsFulfilled   Int            @default(0)
  urgency          RequestUrgency @default(NORMAL)
  hospitalName     String
  location         String
  requiredBy       DateTime
  contactName      String
  contactNumber    String
  patientReference String?
  notes            String?
  status           RequestStatus  @default(OPEN)
  createdById      String?
  createdBy        User?          @relation(fields: [createdById], references: [id], onDelete: SetNull)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  closedAt         DateTime?
  donations        Donation[]

  @@index([bloodGroup])
  @@index([status])
  @@index([urgency])
  @@index([requiredBy])
  @@index([location])
}

model Donation {
  id             String        @id @default(uuid())
  donorId        String
  donor          DonorProfile  @relation(fields: [donorId], references: [id], onDelete: Cascade)
  bloodRequestId String?
  bloodRequest   BloodRequest? @relation(fields: [bloodRequestId], references: [id], onDelete: SetNull)
  donatedAt      DateTime      @default(now())
  location       String
  notes          String?
  createdAt      DateTime      @default(now())

  @@index([donorId])
  @@index([bloodRequestId])
  @@index([donatedAt])
}
```

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
- `GET    /api/v1/admin/dashboard` — Aggregated metrics (active donors, eligible count, recent collections, blood requests pipeline).
- `GET    /api/v1/admin/donors` — Filterable (`bloodGroup`), searchable (`search`), and paginated (`page`, `limit`) donor list.
- `GET    /api/v1/admin/donors/:id` — Full donor record with clinical donation history.
- `PATCH  /api/v1/admin/donors/:id` — Update donor information.
- `DELETE /api/v1/admin/donors/:id` — Soft-deactivates donor (`deletedAt = now()`).
- `GET    /api/v1/admin/donors/:id/donations` — Get donation procedures for a donor.
- `POST   /api/v1/admin/donors/:id/donations` — Log a new blood donation (atomically syncs `lastDonationAt` and updates linked `BloodRequest` if provided).

### Blood Requests & Coordination (`/admin/blood-requests`)
- `POST /api/v1/admin/blood-requests` — Create clinical blood request with urgency and deadline.
- `GET  /api/v1/admin/blood-requests` — List blood requests with search, status, urgency, and blood group filters.
- `GET  /api/v1/admin/blood-requests/:id` — Get request details and linked donations.
- `PATCH /api/v1/admin/blood-requests/:id` — Update request specifications.
- `POST /api/v1/admin/blood-requests/:id/cancel` — Cancel active blood request.
- `GET  /api/v1/admin/blood-requests/:id/matches` — Evaluate and rank eligible candidate donors (0–100 score).
- `POST /api/v1/admin/blood-requests/:id/notify` — Dispatch coordination notification alert to candidate donor.

---

## 🔐 Security & Authorization Model

1. **Password Protection:** Passwords hashed with `bcryptjs` (salt rounds: 12). Plaintext passwords and hashes are never exposed or logged.
2. **HttpOnly Cookie Authentication:** JWT tokens transmitted via `HttpOnly`, `SameSite: Lax`, and `Secure` (production) cookies, preventing XSS token theft.
3. **Role-Based Access Control (RBAC):** Backend middleware (`authenticate` & `requireRole`) strictly verifies identity against the database.
4. **IDOR & Isolation:** Donors can only query `/donors/me/*`. Cross-donor ID access is prevented.
5. **Rate Limiting & Headers:** Express Rate Limiting (100 req/15min on auth endpoints) and Helmet HTTP security headers.
6. **Strict CORS:** Enforces explicit allowed origins (`CLIENT_URL`); wildcard `*` is prohibited.

---

## 🚀 Prerequisites & Environment Setup

### 1. Prerequisites
- Node.js `v18+` (v20+ or v24 recommended)
- PostgreSQL `v14+` running locally on port `5432`

### 2. Environment Variables Configuration
Ensure `.env` in the root directory contains:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blood_donation_db?schema=public"
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blood_donation_test_db?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=super-secret-production-grade-jwt-signing-key-32-chars-min
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

## 💻 Local Development Commands

```bash
# Install all dependencies across workspaces
npm install

# Run database migrations
npm run prisma:migrate

# Seed administrative and sample records
npm run prisma:seed

# Start full-stack development servers concurrently
npm run dev

# Run TypeScript compilation checks across all workspaces
npm run typecheck --workspaces

# Build production bundles
npm run build --workspaces
```

---

## 🧪 Testing & Quality Assurance (86 Passing Tests)

The backend test suite runs with Vitest against an isolated test database (`blood_donation_test_db`):

```bash
npm test --workspace=server
```

### Verified Test Suites:
- `auth.test.ts` (9 tests) — Registration, duplicate prevention, password hashing, session tokens, logout.
- `authorization-security.test.ts` (9 tests) — Role escalation defense, RBAC access boundaries, cookie tamper protection.
- `admin.test.ts` (9 tests) — Metrics aggregation, donor pagination, soft deactivation, donation logging.
- `donor.test.ts` (4 tests) — Personal profile retrieval, contact updates, history access.
- `blood-compatibility.test.ts` (11 tests) — Pure ABO/Rh red-cell compatibility across all 8 combinations.
- `matching.test.ts` (3 tests) — 100-point deterministic candidate ranking and Section 32 verification.
- `blood-request.test.ts` (13 tests) — Request lifecycle, auto-expiration, cancellation, metrics, atomic donation linking.
- `eligibility.test.ts` (10 tests) — Pure age and interval cooldown calculations.
- `hardening-security.test.ts` (18 tests) — Header hardening, rate limiting, and CORS constraints.

**Total: 86 passing tests across 9 test files.**

---

## 📦 Production Build & Deployment

To build both client and server packages for production:

```bash
npm run build --workspaces
```

Artifacts will be generated in `client/dist` (Vite SPA) and `server/dist` (Compiled Node.js application).
