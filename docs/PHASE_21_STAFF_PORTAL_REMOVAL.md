# PHASE 21 — STAFF PORTAL REMOVAL & TERMINOLOGY NORMALIZATION

**Objective:** Complete decommissioning of the fragmented "Staff Portal" in favor of a single unified portal architecture.  
**Decommission Date:** 2026-09-02  
**Result:** 100% REMOVED — Canonical entry point is `/login`.  

---

## 1. Inventory of Removed Surfaces & Artifacts

| Component / Artifact | Previous Location | Action Taken | Current Replacement |
| :--- | :--- | :---: | :--- |
| `AdminLoginPage.tsx` | `client/src/pages/AdminLoginPage.tsx` | **DELETED** | Obsolete page removed. Unified [LoginPage.tsx](file:///c:/Users/Anupam%20Baral/Desktop/blood-donation/client/src/pages/LoginPage.tsx) serves all users. |
| `/admin/login` Route | `client/src/routes/index.tsx` | **REPLACED** | Legacy route converted to `<Navigate to="/login" replace />` to prevent 404s. |
| Staff Portal Header Link | `client/src/layouts/PublicLayout.tsx` | **REMOVED** | Removed staff-only link. Public navbar now shows single "Sign In" button. |
| Staff Portal Footer Link | `client/src/layouts/PublicLayout.tsx` | **REMOVED** | Replaced with neutral "Portal Sign In" (`/login`). |
| Mobile Staff Login Link | `client/src/layouts/PublicLayout.tsx` | **REMOVED** | Removed obsolete dropdown link. |
| "Staff Center" Badge | `client/src/components/admin/AdminHeader.tsx` | **RENAMED** | Updated to "Command Center" / "ADMIN". |
| `isAdmin` Prop in `LoginForm` | `client/src/components/auth/LoginForm.tsx` | **REFACTORED** | Removed artificial frontend role distinction. Form accepts credentials and routes dynamically based on verified backend token claims. |

---

## 2. Terminology Normalization Standard

To eliminate role confusion while preserving clinical clarity:

1. **User-Facing Product Surface:**
   - Terminology: **"Admin"** or **"Coordinator Command Center"** (formerly "Staff Portal" / "Staff Center").
2. **Backend Database & API Role:**
   - Terminology: **`ADMIN`** (Strictly preserved in PostgreSQL enum, Prisma schema, and JWT payloads).
3. **Clinical Operational Context:**
   - Phrases such as "clinical staff" or "authorized transfusion staff" are preserved only where describing real-world physical hospital personnel performing on-site vein collection.

---

## 3. Backward Compatibility & Bookmark Safety

Any hospital coordinator or bookmark navigating to `/admin/login` is automatically redirected with an HTTP 301/302 client-side replace to `/login`. Upon authenticating with coordinator credentials (`ADMIN` role), they are immediately redirected to the `/admin` Command Center.
