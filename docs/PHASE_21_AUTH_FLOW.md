# PHASE 21 — UNIFIED AUTHENTICATION FLOW & SMART REDIRECTION

**Module:** HemaCare Unified Authentication Architecture  
**Canonical Public Route:** `/login`  
**Security Standard:** Strict RBAC + Dual Cross-Domain Token Transport + Fail-Closed Return-Path Sanitization  

---

## 1. Unified Authentication State Machine

```text
                      [ Unauthenticated User / Browser ]
                                      │
                                      ▼
                             Visits /login
                     (or any protected route with ?returnTo=...)
                                      │
                 ┌────────────────────┴────────────────────┐
                 │ User Submits Credentials (Email + Pass) │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                         POST /api/v1/auth/login
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
         [ HTTP 401 Error ]                       [ HTTP 200 OK ]
                 │                                         │
        Displays Error Banner                   Receives: { user, token }
   "Invalid email or password"                             │
                                             Stores auth_token in localStorage
                                             Attaches Bearer header to Axios
                                                           │
                                                           ▼
                                                Inspects Authenticated
                                                    user.role
                                                           │
                                  ┌────────────────────────┴────────────────────────┐
                                  │                                                 │
                                  ▼                                                 ▼
                          user.role === 'ADMIN'                           user.role === 'DONOR'
                                  │                                                 │
                 ┌────────────────┴────────────────┐               ┌────────────────┴────────────────┐
                 │ Has safe returnTo parameter?    │               │ Has safe returnTo parameter?    │
                 └────────────────┬────────────────┘               └────────────────┬────────────────┘
                                  │                                                 │
                   YES ───────────┴─────────── NO                    YES ───────────┴─────────── NO
                    │                           │                     │                           │
                    ▼                           ▼                     ▼                           ▼
          returnTo is internal        Navigate to /admin     Is returnTo starts with    Navigate to /dashboard
            & starts with /admin?                              /admin (forbidden)?
                    │                                                 │
             YES ───┴─── NO                                    YES ───┴─── NO
              │           │                                     │           │
              ▼           ▼                                     ▼           ▼
          Navigate to  Navigate                              Navigate to  Navigate to
           returnTo    to /admin                             /dashboard   returnTo
```

---

## 2. Redirection Edge Case Matrix

| Current State | Action / Attempt | System Handling | Outcome |
| :--- | :--- | :--- | :--- |
| **Anonymous** | Visits `/admin` directly | Intercepted by `ProtectedRoute` | Redirected to `/login?returnTo=%2Fadmin` |
| **Anonymous** | Visits `/profile` directly | Intercepted by `ProtectedRoute` | Redirected to `/login?returnTo=%2Fprofile` |
| **Anonymous** | Visits `/admin/login` | Intercepted by legacy redirect route | Redirected to `/login` |
| **Authenticated ADMIN** | Visits `/login` | Session guard in `LoginPage` activates | Automatically redirected to `/admin` |
| **Authenticated DONOR** | Visits `/login` | Session guard in `LoginPage` activates | Automatically redirected to `/dashboard` |
| **Authenticated DONOR** | Manually types `/admin` in address bar | Intercepted by `ProtectedRoute` RBAC check | Blocked and redirected to `/dashboard` |
| **Authenticated ADMIN** | Manually types `/dashboard` in address bar | Allowed (Admin possesses clinical overview access) | Renders Dashboard |
| **Malicious User** | Visits `/login?returnTo=https://evil.com` | Sanitizer checks `startsWith('//')`, `includes(':')` | Overrides malicious target $\rightarrow$ redirects to role home (`/admin` or `/dashboard`) |
| **Session Expired** | Any API call returns 401 | Axios response interceptor clears `auth_token` | State drops to unauthenticated $\rightarrow$ redirects to `/login` |
| **User Sign Out** | Clicks "Sign Out" button | Clears `auth_token`, calls `/auth/logout`, clears context | Navigates to `/login` |

---

## 3. Defense Against Open Redirect Attacks

The function `sanitizeReturnPath(rawPath, role)` enforces strict validation:

```typescript
const sanitizeReturnPath = (rawPath: string | null | undefined, role: 'ADMIN' | 'DONOR'): string => {
  if (!rawPath) return role === 'ADMIN' ? '/admin' : '/dashboard';
  const trimmed = rawPath.trim();
  
  // Reject external, protocol-relative, or malformed URLs
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes(':') ||
    trimmed.includes('\\')
  ) {
    return role === 'ADMIN' ? '/admin' : '/dashboard';
  }
  
  // Enforce role boundaries
  if (role === 'DONOR' && trimmed.startsWith('/admin')) {
    return '/dashboard';
  }
  
  return trimmed;
};
```
