# Admin Simplification Plan — CRM V2

> Redesign to 5-role model with simplified menus, workbenches, and event-driven KPIs.

## 1. Role Redesign

### 1.1 New Role Mapping

| V2 Role | V1 Equivalent | Description | Scope |
|---|---|---|---|
| `ADMIN` | `admin` | Full system access | Global |
| `BRANCH_MANAGER` | `manager` | Manages one or more branches | Branch-scoped |
| `PAGE_STAFF` | `direct_page` | Central page operator — qualifies leads | Central (all new leads) |
| `BRANCH_STAFF` | `telesales` | Branch operator — calls, closes, manages | Branch-scoped |
| `STUDENT` | Student portal | Self-service portal | Own data only |

### 1.2 Implementation Strategy
- Keep existing `Role` enum values (`admin`, `manager`, `direct_page`, `telesales`, `viewer`)
- Map conceptually: `admin` → ADMIN, `manager` → BRANCH_MANAGER, `direct_page` → PAGE_STAFF, `telesales` → BRANCH_STAFF
- Add **branch scoping middleware**: if `user.branchId` is set, filter queries by branch
- `viewer` becomes read-only BRANCH_STAFF scoped to their branch

---

## 2. Simplified Admin Menu (≤6 top-level items)

### 2.1 ADMIN / BRANCH_MANAGER Menu
| # | Label | Path | Contains |
|---|---|---|---|
| 1 | 🏠 Tổng quan | `/dashboard` | Command center dashboard |
| 2 | 📊 KPI & Báo cáo | `/kpi/daily` | KPI daily, targets, goals, analytics |
| 3 | 👤 Khách hàng | `/leads` | Full lead list + board + assign |
| 4 | 🧑‍🎓 Học viên | `/students` | Students, courses, schedule, instructors |
| 5 | 💰 Tài chính | `/receipts` | Receipts, expenses, payroll |
| 6 | ⚙️ Quản trị | `/admin/settings` | Users, branches, permissions, automation |

### 2.2 PAGE_STAFF Menu (Inbox Workbench)
| # | Label | Path | Contains |
|---|---|---|---|
| 1 | 📥 Inbox | `/workbench/page` | New messages → qualify → HAS_PHONE → assign |
| 2 | 📊 KPI | `/kpi/daily` | Page KPI only |
| 3 | 🔔 Thông báo | `/notifications` | Tasks/reminders |

### 2.3 BRANCH_STAFF Menu (Branch Workbench)
| # | Label | Path | Contains |
|---|---|---|---|
| 1 | 📞 Công việc | `/workbench/branch` | Assigned leads → call → appoint → sign → create student |
| 2 | 📊 KPI | `/kpi/daily` | Branch KPI only |
| 3 | 🧑‍🎓 Học viên | `/students` | Branch students only |
| 4 | 🔔 Thông báo | `/notifications` | Tasks/reminders |

### 2.4 STUDENT Menu (Existing portal — keep as-is)

---

## 3. KPI Standardization (Event-Driven)

### 3.1 Page KPI (counted from LeadEvent per day)
| Metric | Event Source | Description |
|---|---|---|
| `messagesToday` | `LeadEvent.type = NEW` | New leads received |
| `qualifiedToday` | `LeadEvent.type = HAS_PHONE` where phone valid | Successfully qualified |
| `hasPhoneToday` | `LeadEvent.type = HAS_PHONE` | Got phone number |
| `assignedToday` | `LeadEvent.type = ASSIGNED_OWNER` | Distributed to branch |
| `invalidToday` | `LeadEvent.payload.invalid = true` | Spam/invalid leads |
| `slaAvgMinutes` | `avg(ASSIGNED_OWNER.createdAt - NEW.createdAt)` | SLA response time |

### 3.2 Branch KPI (counted from LeadEvent per day per branch)
| Metric | Event Source | Description |
|---|---|---|
| `calledToday` | `LeadEvent.type = CALLED` | Calls made |
| `appointedToday` | `LeadEvent.type = APPOINTED` | Appointments set |
| `arrivedToday` | `LeadEvent.type = ARRIVED` | Walk-ins |
| `signedToday` | `LeadEvent.type = SIGNED` | Contracts signed |
| `lostToday` | `LeadEvent.type = LOST` | Lost leads |
| `revenue` | `SUM(Receipt.amount)` filtered by branch+day | Revenue |
| `cpa` | `adSpend / signedToday` | Cost per acquisition |

### 3.3 API: `GET /api/kpi/daily`
- Query params: `date`, `branchId`, `ownerId`, `role`
- Response: event counts from `LeadEvent`, revenue from `Receipt`
- Branch-scoped: auto-filter by `user.branchId` if not admin

---

## 4. PAGE_STAFF Workflow

```
[New Lead] → PAGE_STAFF qualifies → [HAS_PHONE] → assign to branch → [ASSIGNED_OWNER]
```

### API Endpoints
1. `GET /api/leads?status=NEW&ownerId=null` — Inbox unqualified leads
2. `PATCH /api/leads/:id` — Update phone, qualify → creates `HAS_PHONE` event
3. `POST /api/leads/assign` — Assign to branch_staff → creates `ASSIGNED_OWNER` event

### Branch Scoping
- `ASSIGNED_OWNER` event sets `lead.branchId` + `lead.ownerId`
- After assignment, BRANCH_STAFF sees only their `ownerId` leads

---

## 5. Internal Automation Engine (Replace n8n)

### 5.1 Architecture
```
Scheduler (cron) → Queue (DB-backed) → Worker (in-process) → Logs (idempotent)
```

### 5.2 Components
1. **AutomationJob** model — stores job definition + schedule
2. **AutomationExecution** — tracks each run with idempotency key
3. **Worker** — processes jobs from queue via `setInterval` or Next.js API cron
4. **Built-in tasks**: follow-up reminders, daily KPI digest, schedule notifications

> **Milestone #1 scope**: Roles + branch scoping + PAGE_STAFF workflow + KPI daily. Automation engine deferred to milestone #2.

---

## 6. Milestone #1 Scope

### Changes Required

#### Schema
- No enum changes (reuse existing roles conceptually)
- Add branch-scoping middleware

#### API Changes
1. **Branch scoping middleware** — auto-filter by `user.branchId` in leads, students, receipts, kpi APIs
2. **KPI daily refactor** — rewrite to use LeadEvent aggregates instead of ad-hoc queries
3. **Lead assign flow** — ensure `ASSIGNED_OWNER` event creates proper branchId mapping

#### Frontend Changes
1. **Role-based menu filtering** — show different items based on role
2. **KPI daily page** — show events-based metrics per role (Page KPI vs Branch KPI)

#### Tests
- Existing: `npm run verify` (lint + build + permissions audit + schema gate)
- No additional unit tests in milestone #1 (focus on passing verify gate)
