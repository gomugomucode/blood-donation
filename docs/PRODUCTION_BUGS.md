# HEMACARE — PRODUCTION BUG & OBSERVATION REPORT

**Audit Date:** September 1, 2026  
**Auditor:** Production QA & Security Reliability Engineering Suite  
**Classification Schema:**
- **P0 (Critical):** Core clinical safety, auth bypass, data loss, or system outage.
- **P1 (High):** Major clinical or coordinator workflow blocked.
- **P2 (Medium):** Important feature partially impaired with known workaround.
- **P3 (Low):** Minor UX, non-blocking performance observation, or cosmetic defect.

---

## 1. Summary of Defects & Findings

| Bug ID | Severity | Category | Summary | Safe to Fix Now? |
| :--- | :---: | :--- | :--- | :---: |
| **BUG-001** | **P3 (Low)** | Performance / Architecture | Render Free-Tier Container Cold Start Latency | Infra setting (Requires persistent instance tier) |
| **BUG-002** | **P3 (Low)** | Notifications | External SMS/Email Provider Staging Simulation | Config setting (Requires carrier API keys) |
| **BUG-003** | **P3 (Low)** | UX / Feedback | Search Query Empty State Transition | Frontend polish |

*Note: Zero P0 (Critical) and zero P1 (High) bugs were detected in the production system.*

---

## 2. Detailed Bug Reports

### BUG-001: Render Free-Tier Web Service Cold Start Delay
- **ID:** `BUG-001`
- **Severity:** `P3 (Low / Operational Risk)`
- **Affected Role:** All users (Anonymous visitors, Donors, Coordinators)
- **Reproduction Steps:**
  1. Allow backend service to sit idle for >15 minutes.
  2. Navigate to `https://client-sigma-peach.vercel.app/` or send a request to `https://blood-donation-6vcp.onrender.com/health`.
  3. Observe that the initial request takes ~30s – 45s while Render spins up the container instance.
- **Expected Behavior:** Sub-second API response time on initial requests.
- **Actual Behavior:** ~41s response time on first request after idle sleep. Subsequent requests respond in `<300ms`.
- **Likely Root Cause:** Render free tier spins down web services during periods of inactivity.
- **Evidence:** Audit latency measurement showed `41448ms` on initial wake-up, followed immediately by `302ms` on subsequent requests.
- **Recommended Fix:**
  - Upgrade Render web service to Starter/Standard persistent instance tier, OR configure an external uptime cron ping (e.g., BetterStack / UptimeRobot / cron-job.org) hitting `/health/live` every 5 minutes.
- **Safe to Implement Now:** Yes (Infrastructure/configuration change).

---

### BUG-002: External SMS/Email Delivery Uses Simulated Development Provider in Staging
- **ID:** `BUG-002`
- **Severity:** `P3 (Low / Configuration Requirement)`
- **Affected Role:** Donors receiving external outreach
- **Reproduction Steps:**
  1. Coordinator dispatches emergency opportunity outreach to a donor candidate.
  2. The system enqueues notifications for `EMAIL` or `SMS` channels.
  3. The notification worker executes the batch and records `SIMULATED_DEV_DISPATCH`.
- **Expected Behavior:** In production, actual outbound SMS and transactional emails are delivered to the recipient's phone/inbox.
- **Actual Behavior:** The system logs simulated dispatch with masked recipient IDs (`do***@test.org`) to protect against uncontrolled test dispatches.
- **Likely Root Cause:** Environment currently defaults to `DevelopmentNotificationProvider` because live SendGrid/Twilio API keys have not been bound in the Render environment variables.
- **Evidence:** Server audit log output: `[SIMULATED_DEV_DISPATCH] Channel: EMAIL | SimulatedID: simulated-dev-email-...`.
- **Recommended Fix:**
  - Bind `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, and `SENDGRID_API_KEY` in Render environment variables for production go-live.
- **Safe to Implement Now:** Requires production third-party carrier API keys.

---

### BUG-003: Donor Table Search Reset Transition
- **ID:** `BUG-003`
- **Severity:** `P3 (Low / UX Polish)`
- **Affected Role:** Coordinator (`ADMIN`)
- **Reproduction Steps:**
  1. On `/admin/donors`, enter a query in the search bar that matches 0 records.
  2. The table shows the clean empty state (`No donors found`).
  3. Clearing the input field triggers a refetch, but if backspaced rapidly, multiple debounce events fire.
- **Expected Behavior:** Smooth debounced single request on query clearing.
- **Actual Behavior:** Functions correctly, but fires redundant intermediate queries if typed rapidly.
- **Likely Root Cause:** Debounce timer interval could be tightened to 300ms with query cancellation.
- **Recommended Fix:** Add `abortController` / signal binding to `adminService.getDonors`.
- **Safe to Implement Now:** Safe frontend polish.
