# English Center Management System — Roadmap

> Nguồn roadmap chính thức (cùng `PROJECT_CONTEXT.md`).
> `docs/handoff/project-progress.md` là tài liệu **lịch sử** (dừng ở Step 18.3) — chỉ tham khảo, không phải source of truth.
> Không commit/push khi chưa được lệnh.

## PHASE 1 — Analysis & Database ✅

- Phân tích yêu cầu, use cases (UC-01→UC-38), database design, domain model.

## PHASE 2 — Backend Core ✅

- JWT auth + 7 business APIs: Users, StudentProfiles, Courses, Classes, Registrations,
  Transactions, Attendance.

## PHASE 3 — Backend Modules ✅

- Step 14: Score API (UC-17/UC-19).
- Step 15: Schedule API / UC-18 (read-only `classes`).
- Step 16.1 → 16.5: Notification module (UC-34/37/38) + regression tests.

## PHASE 4 — Seed ✅

- 17.1 framework → 17.2 users/profiles → 17.3 courses/classes → 17.4 registrations/transactions →
  17.5 attendance/scores → **17.6 Seed Notifications** ✅ → **17.7 Verify Seed** ✅
  (idempotent, notifications 6/6, backend 315/0/0).

## PHASE 5 — Frontend Foundation ✅

- 18.1 foundation (design system, AppShell, routes) → 18.2 auth/login →
  18.3 role-based dashboard (client-side aggregation) → 18.4 notification unread badge.

## PHASE 6 — Frontend Business ✅

| Slice | Route | Nội dung chính | Tests |
|---|---|---|---|
| S01 Student Schedule | `/student/schedule` | Lịch học tuần (Mon–Sun) | ✅ |
| S02 Student Courses | `/student/courses` | Lớp APPROVED/PAID của mình | ✅ |
| S03 Admin Scores | `/admin/scores` | Quản lý điểm | ✅ |
| S04 Admin Students | `/admin/students` | CRUD (create descoped — password backlog) | 15/15 |
| S05 Admin Teachers | `/admin/teachers` | CRUD (create descoped — password backlog) | 17/17 |
| S06 Admin Classes | `/admin/classes` | Full CRUD (delete = soft-cancel) | 21/21 |
| S07 Admin Attendance | `/admin/attendance` | Read-only sheets + records | 17/17 |
| S08 Admin Registrations | `/admin/registrations` | Duyệt/từ chối/hủy/mark-paid + detail | 28/28 |
| S09 Admin Transactions | `/admin/transactions` | Confirm/reject + detail (no reason field) | 24/24 |
| S10 Teacher Attendance | `/teacher/attendance` | Tạo/sửa sheet lớp STUDYING mình dạy | 22/22 |
| S11 Student Registrations | `/student/registrations` | Đăng ký/hủy/tạo GD/báo đã trả + multi-tx grouping | 25/25 |

## CURRENT CHECKPOINT: CORE BUSINESS COMPLETE ✅

- Backend: **315/315 PASS** (`clean test`).
- Frontend: **366/367 PASS** — fail duy nhất `dashboardCharts.test.tsx`
  (`renders the three charts…`, hard-coded `08/2026` / `3.300.000 ₫`, maintenance backlog, không sửa).
- Lint PASS, build PASS, `git diff --check` PASS, backend/database diff rỗng.
- Working tree giữ uncommitted theo quy ước (không commit/push khi chưa lệnh).

## NEXT PHASE: RELEASE READINESS

1. Fix `dashboardCharts` test (data/time hard-coded).
2. Full regression (BE `clean test` + FE suite + lint + build).
3. Manual UAT ADMIN (dashboard → users → classes → registrations → transactions → attendance → scores).
4. Manual UAT TEACHER (classes → schedule → attendance → scores).
5. Manual UAT STUDENT (courses → schedule → scores → registrations + payment flow).
6. Verify production config (profile, `ddl-auto`, JWT secret, CORS, seed tách riêng).
7. README update (mô tả thật, quick start, tài khoản demo `password123`).
8. ERD / screenshots / demo documentation.
9. Deployment (quyết định target theo người dùng).
10. Intern Project Ready.

## BACKLOG (non-blocking, đã xác định)

- Admin create Student/Teacher: `POST /api/users` lưu raw password (thiếu BCrypt) — descoped.
- Registration: duplicate guard chưa có; capacity-at-create chưa check; GET mở không enforce owner.
- Docs/code discrepancies đã ghi mã: D1–D7 (registrations), T1–T7 (transactions), D1–D6 (S10 attendance), S11-D1 (UPCOMING vs STUDYING).
- `CourseClassService.update` thiếu validation/status guards (FE tự guard).
- `dashboardCharts.test.tsx` fail 1 assertion.

## OPTIONAL P2 (ngoài core, chờ quyết định)

- AI Chat / FAQ (`chat_*`, `faqs` chưa entity).
- Audit Logs (`audit_logs` chưa entity).
- Settings (`system_settings` chưa entity).
