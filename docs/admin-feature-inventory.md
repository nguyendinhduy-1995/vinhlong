# Admin Feature Inventory — Screen → API → DB

> Generated 2026-03-04 from full repo read.

## 1. Roles

| Role | Enum | Scope | Current Usage |
|---|---|---|---|
| Admin | `admin` | Global | Full access |
| Manager | `manager` | Global | Branch management |
| Telesales | `telesales` | Branch-scoped | Call leads |
| Direct Page | `direct_page` | Central | Trực page |
| Viewer | `viewer` | Read-only | — |

> **Gap**: No `BRANCH_MANAGER`, `PAGE_STAFF`, `BRANCH_STAFF`, `STUDENT` roles in current enum.

---

## 2. Pages (App Shell)

### 2.1 Group: Tổng quan (7 items)
| Page | Path | API | DB Model |
|---|---|---|---|
| Trang chủ | `/dashboard` | `GET /api/dashboard/summary` | LeadEvent, Receipt, KpiTarget |
| KPI | `/kpi/daily` | `GET /api/kpi/daily` | LeadEvent (grouped) |
| Trợ lý AI | `/ai/kpi-coach` | `GET/POST /api/ai/suggestions` | AiSuggestion |
| Mục tiêu KPI | `/kpi/targets` | `GET/POST /api/kpi/targets` | KpiTarget |
| Mục tiêu ngày/tháng | `/goals` | `GET/POST /api/goals` | GoalSetting |
| Thông báo | `/notifications` | `GET/PATCH /api/notifications` | Notification |
| Phân tích truy cập | `/admin/analytics` | `GET /api/analytics/*` | SiteAnalyticsEvent |

### 2.2 Group: Khách & Tư vấn (3 items)
| Page | Path | API | DB Model |
|---|---|---|---|
| Khách hàng | `/leads` | `GET/POST/PATCH /api/leads` | Lead, LeadEvent |
| Bảng trạng thái | `/leads/board` | Same leads API | Lead |
| Gọi nhắc | `/outbound` | `GET/POST /api/outbound/*` | OutboundMessage, OutboundJob |

### 2.3 Group: Tài chính (5 items)
| Page | Path | API | DB Model |
|---|---|---|---|
| Phiếu thu | `/receipts` | `GET/POST /api/receipts` | Receipt |
| Chi phí | `/expenses/monthly` | `GET/POST /api/expenses/*` | BranchExpenseDaily |
| Lương của tôi | `/me/payroll` | `GET /api/me/payroll` | PayrollItem |
| Bảng lương | `/hr/payroll` | `GET /api/admin/payroll` | PayrollRun, PayrollItem |
| KPI nhân sự | `/hr/kpi` | `GET/POST /api/admin/employee-kpi` | EmployeeKpiSetting |

### 2.4 Group: Học viên & Lịch (5 items)
| Page | Path | API | DB Model |
|---|---|---|---|
| Học viên | `/students` | `GET/POST /api/students` | Student |
| Khóa học | `/courses` | `GET/POST /api/courses` | Course |
| Lịch học | `/schedule` | `GET/POST /api/schedule` | CourseScheduleItem |
| Nội dung HV | `/admin/student-content` | `GET/POST /api/admin/student-content` | StudentContent |
| Giáo viên TH | `/admin/instructors` | `GET/POST /api/instructors` | Instructor |

### 2.5 Group: Tự động hoá (9 items)
| Page | Path | API | DB Model |
|---|---|---|---|
| Tự động hóa | `/automation/run` | `POST /api/automation/run` | AutomationLog |
| Nhật ký | `/automation/logs` | `GET /api/automation/logs` | AutomationLog |
| Vận hành tự động | `/admin/cron` | `POST /api/admin/cron/daily` | — |
| Lập lịch | `/admin/scheduler` | `GET /api/scheduler/health` | — |
| Tiến trình gửi tin | `/admin/worker` | `POST /api/admin/worker/outbound` | OutboundMessage |
| Luồng n8n | `/admin/n8n` | `GET /api/admin/n8n/workflows` | — (external) |
| Giám sát | `/admin/automation-monitor` | `GET /api/admin/automation/*` | — |
| Báo cáo | `/admin/ops` | `GET/POST /api/admin/ops/pulse` | OpsPulse |
| Báo cáo marketing | `/marketing` | `GET /api/marketing/metrics` | MarketingReport |

### 2.6 Group: Quản trị (12 items)
| Page | Path | API | DB Model |
|---|---|---|---|
| Người dùng | `/admin/users` | `GET/POST/PATCH /api/admin/users` | User |
| Phân quyền | `/admin/phan-quyen` | `GET/POST /api/admin/permission-groups` | PermissionGroup, PermissionRule |
| Cài đặt | `/admin/settings` | `GET/POST /api/admin/settings` | FeatureSetting |
| Chi nhánh | `/admin/branches` | `GET/POST /api/admin/branches` | Branch |
| Phân KH | `/admin/assign-leads` | `POST /api/leads/assign` | Lead (ownerId) |
| Quản trị TB | `/admin/notifications` | N/A | NotificationRule |
| Gói học phí | `/admin/tuition-plans` | `GET/POST /api/tuition-plans` | TuitionPlan |
| Chấm công | `/hr/attendance` | `GET/POST /api/admin/attendance` | Attendance |
| Hồ sơ lương | `/hr/salary-profiles` | `GET/POST /api/admin/salary-profiles` | SalaryProfile |
| Mã tracking | `/admin/tracking` | `GET/POST /api/admin/tracking-codes` | TrackingCode |
| Meta CAPI | `/admin/integrations/meta` | `GET /api/admin/meta/*` | MetaCapiLog |
| Hướng dẫn (×3) | `/admin/guide`, `/admin/huong-dan-*` | Static | — |

### 2.7 Student Portal
| Page | Path | API | DB Model |
|---|---|---|---|
| Trang chủ | `/student` | `GET /api/student/me` | Student, StudentAccount |
| Lịch học | `/student/schedule` | `GET /api/student/me` | CourseScheduleItem |
| Tài chính | `/student/finance` | `GET /api/student/me` | Receipt |
| Nội dung | `/student/content` | `GET /api/student/content` | StudentContent |
| Đăng nhập | `/student/login` | `POST /api/student/auth/login` | StudentAccount |
| Đăng ký | `/student/register` | `POST /api/student/auth/register` | StudentAccount |

---

## 3. Key DB Models

| Model | Records | Purpose |
|---|---|---|
| `User` | Staff accounts | Roles, branchId, permissionGroup |
| `Lead` | Customer contacts | Funnel: NEW→SIGNED |
| `LeadEvent` | Event log | All funnel transitions |
| `Student` | Enrolled students | After SIGNED |
| `Receipt` | Payments | Financial tracking |
| `Branch` | Business locations | Scoping unit |
| `Notification` | Task queue | Follow-up items |
| `OutboundMessage` | Messages | Zalo/SMS/FB outbound |
| `AutomationLog` | Automation runs | Milestone tracking |
| `KpiTarget` | KPI goals | Per branch/role/day |

---

## 4. Current Pain Points

1. **41 menu items** — cognitive overload, most staff use <5
2. **No branch scoping** — `direct_page` and `telesales` see everything
3. **No dedicated workbench** — Page staff and Branch staff share same leads UI
4. **KPI not event-driven** — dashboard/summary does ad-hoc queries instead of using LeadEvent aggregates
5. **n8n dependency** — automation relies on external n8n, no internal engine
6. **Roles mismatch** — `telesales`/`direct_page` don't map to V2's PAGE_STAFF/BRANCH_STAFF concept
