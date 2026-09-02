# PHASE 21 — ROUTE ACCESS MATRIX

**Platform:** HemaCare Production Frontend & Coordination System  
**Audit Date:** 2026-09-02  
**Unified Authentication Model:** Single canonical `/login` endpoint with role-based destination dispatch.

---

## 1. Complete Route Access & Redirection Specification

| Route Path | Public? | Auth Required? | Allowed Roles | Unauthenticated Behavior | Authenticated Role Redirect / Guard |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `/` | **Yes** | No | Any / Anonymous | Renders Public Landing Page | Stays on `/` (Navbar displays shortcut to role dashboard) |
| `/login` | **Yes** | No | Any / Anonymous | Renders Unified Portal Sign In | `ADMIN` $\rightarrow$ `/admin`<br>`DONOR` $\rightarrow$ `/dashboard` |
| `/register` | **Yes** | No | Any / Anonymous | Renders Voluntary Donor Registration | Stays on `/register` or redirects to `/dashboard` |
| `/forgot-password` | **Yes** | No | Any / Anonymous | Renders Password Recovery | Stays on `/forgot-password` |
| `/reset-password` | **Yes** | No | Any / Anonymous | Renders Token Password Reset | Stays on `/reset-password` |
| `/admin/login` | *Legacy* | No | N/A | **301/302 Redirect** $\rightarrow$ `/login` | Redirects to `/login` $\rightarrow$ role home |
| `/dashboard` | No | **Yes** | `DONOR`, `ADMIN` | Redirects to `/login?returnTo=/dashboard` | Accessible to Donor & Admin |
| `/dashboard/opportunities` | No | **Yes** | `DONOR`, `ADMIN` | Redirects to `/login?returnTo=/dashboard/opportunities` | Accessible to Donor & Admin |
| `/dashboard/opportunities/:id` | No | **Yes** | `DONOR`, `ADMIN` | Redirects to `/login?returnTo=/dashboard/opportunities/:id` | Accessible to Donor & Admin |
| `/profile` | No | **Yes** | `DONOR`, `ADMIN` | Redirects to `/login?returnTo=/profile` | Accessible to Donor & Admin |
| `/history` | No | **Yes** | `DONOR`, `ADMIN` | Redirects to `/login?returnTo=/history` | Accessible to Donor & Admin |
| `/admin` | No | **Yes** | `ADMIN` only | Redirects to `/login?returnTo=/admin` | `DONOR` $\rightarrow$ Blocked & redirected to `/dashboard` |
| `/admin/donors` | No | **Yes** | `ADMIN` only | Redirects to `/login?returnTo=/admin/donors` | `DONOR` $\rightarrow$ Blocked & redirected to `/dashboard` |
| `/admin/donors/:id` | No | **Yes** | `ADMIN` only | Redirects to `/login?returnTo=/admin/donors/:id` | `DONOR` $\rightarrow$ Blocked & redirected to `/dashboard` |
| `/admin/requests` | No | **Yes** | `ADMIN` only | Redirects to `/login?returnTo=/admin/requests` | `DONOR` $\rightarrow$ Blocked & redirected to `/dashboard` |
| `/admin/requests/create` | No | **Yes** | `ADMIN` only | Redirects to `/login?returnTo=/admin/requests/create` | `DONOR` $\rightarrow$ Blocked & redirected to `/dashboard` |
| `/admin/requests/:id` | No | **Yes** | `ADMIN` only | Redirects to `/login?returnTo=/admin/requests/:id` | `DONOR` $\rightarrow$ Blocked & redirected to `/dashboard` |
| `/admin/operations` | No | **Yes** | `ADMIN` only | Redirects to `/login?returnTo=/admin/operations` | `DONOR` $\rightarrow$ Blocked & redirected to `/dashboard` |
| `/admin/audit-logs` | No | **Yes** | `ADMIN` only | Redirects to `/login?returnTo=/admin/audit-logs` | `DONOR` $\rightarrow$ Blocked & redirected to `/dashboard` |
| `*` (Catch-all) | N/A | N/A | Any | Fallback: Redirects to `/` | Fallback: Redirects to `/` |

---

## 2. Open-Redirect Prevention Specification

All `returnTo` parameters are strictly sanitized before navigation:
1. **Relative Path Enforcement:** Destination must begin with a single `/`.
2. **Protocol-Relative Rejection:** Destinations starting with `//` or `/\` are rejected.
3. **Scheme Rejection:** Any URL containing `:` (e.g., `https:`, `javascript:`, `data:`) is rejected.
4. **RBAC Boundary Enforcement:** If a `DONOR` account logs in with `returnTo=/admin/*`, the system refuses the redirect and defaults safely to `/dashboard`.
