# English Center Management System — Project Context

> Nguồn context chính thức cho OpenCode. Đọc file này (cùng `ROADMAP.md`) trước khi làm việc.
> Cập nhật cuối: sau S18 — DOCS/DEMO PREP (S12 AI backend ✅, S13 AI frontend ✅, S14 MySQL boot ✅,
> S15 frontend cleanup ✅, S16 full regression ✅, S17 UAT 3 roles ✅, D1 attendance-update fix ✅,
> S16B live LLM DEFERRED vì chưa có AI_API_KEY). Không commit/push khi chưa được lệnh.

## 1. Project Overview

Hệ thống quản lý trung tâm tiếng Anh full-stack: quản lý học viên, giáo viên, khóa học, lớp học,
đăng ký học, thanh toán học phí (chuyển khoản thủ công), điểm danh, điểm số, lịch học và thông báo.
Ba vai trò: ADMIN, TEACHER, STUDENT. Không có payment gateway, không realtime.

## 2. Project Objective

Hoàn thành các slice nghiệp vụ chính ở mức project intern: mỗi slice là một vertical slice
frontend-only trên backend contract đã có, code dễ đọc, test behavior đầy đủ, demo được.

## 3. Intern Scope

- Backend core + modules (auth, users, courses, classes, registrations, transactions,
  attendance, scores, schedules, notifications) + seed framework.
- Frontend: foundation, auth, dashboard 3 role, các slice S01–S11, AI Chat S13.
- Backend AI S12 (`/api/ai/*`: chat + conversations + delete, provider OpenAI-compatible,
  `AiContextBuilder` theo role, thiếu key thì lỗi thân thiện 400).
- P2 còn lại (optional): Audit Log, Settings (nav `comingSoon`).

## 4. Tech Stack

| Layer    | Technology                                                              |
|----------|-------------------------------------------------------------------------|
| Backend  | Spring Boot 3.2.5, Java 17, Gradle 8.7, MySQL 8.0 (`ddl-auto: validate`) |
| Auth     | JWT, không refresh token                                                |
| Frontend | React 18 + Vite 5 + TypeScript 5, react-router-dom 6, lucide-react      |
| Test BE  | JUnit 5 + MockMvc + H2 (`create-drop`)                                  |
| Test FE  | Vitest + Testing Library + jsdom                                        |

Lệnh: BE `.\gradlew.bat clean test` (trong `backend/`); seed
`.\gradlew.bat bootRun --args="--spring.profiles.active=seed"`.
FE (trong `frontend/`): `npm run test -- --run`, `npm run lint`, `npm run build`.

## 5. Architecture

- Monolith backend REST `/api/*` + SPA frontend. Không microservices.
- Phân quyền ở **service layer** (ném `AccessDeniedException`), không phụ thuộc URL matcher
  (SecurityConfig chỉ guard `/api/admin/**` + permit `/api/auth/**`).
- Frontend gọi API có sẵn rồi tổng hợp ở client (**client-side aggregation**); không thêm endpoint.

## 6. Backend Structure

`backend/src/main/java/com/englishcenter/`:
`controller/` (12: Auth, User, StudentProfile, Course, CourseClass, Registration, Transaction,
Attendance, Score, Schedule, Notification, Admin/test), `service/` + `service/impl/`,
`entity/` (+ `enums/`), `dto/request|response/`, `repository/`, `exception/`,
`security/` (JWT filter/provider), `config/`, `seed/` (`DataSeeder.java` duy nhất, `@Profile("seed")`).

## 7. Frontend Structure

`frontend/src/`: `pages/` (Admin*: Dashboard, Students, Teachers, Courses, Classes,
Registrations, Transactions, Attendance, Scores; Teacher*: Classes, Schedule, Attendance, Scores;
Student*: Courses, Schedule, Scores, Registrations; Notifications, Login, shared),
`features/<domain>/` (hooks `use*` + validation), `services/api/` (`httpClient` + `*Api.ts`),
`types/`, `components/ui/` (Button, Badge, Card, Modal, Input, Select, EmptyState, ErrorState,
Spinner, PageHeader, Avatar), `routes/` (`navigation.ts` + `AppRoutes.tsx`), `layouts/`, `utils/`
(`format.ts`: `formatVnd/formatDate/formatDateTime`), `__tests__/`.

## 8. Database / Domain Overview

Entities: User (role ADMIN/TEACHER/STUDENT, status), StudentProfile (@MapsId), Course, CourseClass
(`maxCapacity`, `currentHeadcount` do backend quản lý, status UPCOMING/STUDYING/FINISHED/CANCELLED),
Registration (status PENDING/APPROVED/REJECTED/CANCELLED/PAID, `tuitionAtRegistration` snapshot),
Transaction (status PENDING_CONFIRMATION/SUCCESS/FAILED, `BANK_TRANSFER` duy nhất),
AttendanceSheet (unique `class_id+date`, `orphanRemoval` records) + AttendanceRecord
(PRESENT/ABSENT/EXCUSED, không note), Score (`total = mid*0.4 + fin*0.6`),
Notification + NotificationRecipient. Đã entity: `chat_conversations`/`chat_messages`
(`AiConversation`/`AiMessage`, S12 + migration `001_ai_chat.sql`).
Chưa entity: `faqs`, `audit_logs`,
`system_settings`, `teacher_profiles`, `token_blacklist`, `failed_login_attempts`,
`password_reset_tokens`.

## 9. Authentication & RBAC

- JWT Bearer; 401 sai login; thiếu/hết hạn token → 403 body rỗng → `httpClient` clear session +
  dispatch `UNAUTHORIZED_EVENT` → redirect login. 403 kèm envelope = lỗi phân quyền.
- ADMIN: duyệt/từ chối/hủy/mark-paid registration; confirm/reject transaction; CRUD users/classes/courses.
- TEACHER: chỉ lớp mình dạy (attendance create/update, scores); GET attendance auto-scope.
- STUDENT: self-only (tự đăng ký, tự hủy đơn mình, tự tạo/report-paid transaction mình).
- GET registrations mở cho mọi authenticated; GET transactions student auto-scope; GET classes mở.

## 10. API Conventions

- Envelope `ApiResponse<T> { success, data, message, timestamp }`.
- Exception: `BusinessException→400`, `AccessDeniedException→403`, `ResourceNotFound→404`,
  `DuplicateResource→409` (hiếm), validation→400, `Exception→500`. 409 gần như không xảy ra ở
  registration/transaction/attendance (duplicate báo 400).
- Response DTO qua `fromEntity()`; `204 No Content` cho cancel registration.
- **List endpoints nhiều nơi là XOR** (chỉ 1 filter có tác dụng): registrations
  (`studentId > classId > status`), transactions-admin (`studentId > registrationId > status`),
  classes (`courseId > teacherId > status`). Ngoại lệ: attendance sheets kết hợp được
  `classId + date`.

## 11. Important Business Workflows

- **Registration:** STUDENT tạo (PENDING, class cấm CANCELLED/FINISHED) → ADMIN duyệt
  (PENDING→APPROVED, +1 headcount, check full) / từ chối (PENDING→REJECTED, reason optional ở BE,
  bắt buộc ở FE admin) → APPROVED→PAID (qua mark-paid trực tiếp hoặc transaction confirm);
  hủy non-PAID→CANCELLED (owner-student hoặc admin; −1 headcount nếu từ APPROVED).
- **Transaction:** STUDENT tạo cho APPROVED (PENDING_CONFIRMATION, amount = tuition snapshot) →
  STUDENT report-paid (chỉ set `paidAt`, giữ status; gọi lặp được) → ADMIN confirm
  (PENDING→SUCCESS + registration PAID, không đụng headcount) / reject (→FAILED, registration giữ nguyên).
- **Attendance:** teacher lớp STUDYING chọn class+date → tạo sheet (cấm future, cấm trùng class+date,
  records min 1, student phải APPROVED/PAID) → sửa sau = PUT replace toàn bộ records
  (không đổi class/date, không revalidate STUDYING/future, revalidate enrollment).
- **Seed:** `DataSeeder` nguyên khối `@Transactional`, idempotent qua `existsByEmail(admin)`.

## 12. Important Business Rules

- Enrollment hợp lệ = registration APPROVED hoặc PAID (attendance, SPECIFIC_CLASS notifications).
- `currentHeadcount` chỉ backend đổi (approve +1, cancel-từ-APPROVED −1); FE không tự tính/guard.
- Học phí giao dịch = `tuitionAtRegistration` (snapshot), không phải tuition hiện tại.
- Attendance: 1 sheet/1 lớp/1 ngày; update thay thế toàn bộ (orphanRemoval).
- Reject registration: lý do bắt buộc ở FE admin (UC), nullable ở backend.
- Report-paid không đổi status; SUCCESS/FAILED là terminal; chỉ 1 SUCCESS/registration.

## 13. Frontend Development Rules

- Slice vertical frontend-only; không sửa backend/DB/docs khi chưa lệnh; không dependency mới.
- Không truyền 2 query params cho endpoint XOR; combine filter/search ở client.
- Reload server state sau mutation; không tự đổi state local/headcount.
- Tái dùng UI pattern: PageHeader, toolbar (search + Select), table trong Card, Badge tones,
  Modal confirm, skeleton/`ErrorState`+retry/`EmptyState`, `formatVnd/formatDate/formatDateTime`.
- Route mới = thêm branch trong `AppRoutes.tsx` (nav đã có sẵn, không sửa `navigation.ts` nếu không cần).
- Không gửi `teacherId` trong attendance mutation (backend lấy từ principal); studentId lấy từ `useAuth`.
- Không N+1 (list DTO đã embed đủ; detail chỉ fetch on-demand khi endpoint tồn tại).

## 14. OpenCode Workflow

1. AUDIT code + UC trước (ghi file/line). 2. Đưa PLAN, DỪNG chờ approve. 3. Implement khi lệnh.
4. Việc backend không hỗ trợ → DESCOPED, không workaround trái contract.
5. Discrepancy docs/code → ghi backlog (D/T/S-mã), follow code contract, không tự sửa backend/docs.
6. Không commit/push/reset/revert/delete khi chưa lệnh; giữ working tree.

## 15. Testing Rules

- BE giữ 344/344 (MockMvc/H2, gồm test hồi quy D1 attendance-update). FE: Vitest run 395/395, mỗi slice có `__tests__/<page>.test.tsx` theo pattern
  fetch-mock + `AuthProvider` + `AppRoutes` + `authStorage` session; assertions `toBeTruthy/toBeNull`,
  **không dùng `toBeInTheDocument()`**; scope query vào row/dialog khi text trùng (option/topbar).
- Verify mỗi slice: test mới + full suite + `lint` + `build` + `git diff --check` +
  `git diff --name-only -- backend/ database/` (= rỗng, trừ file fix D1 đã duyệt).
- `dashboardCharts.test.tsx` từng fail 1 assertion hard-coded — đã xử lý ở S15, S16 suite xanh 395/395.

## 16. Known Limitations / Discrepancies

- **Backend backlog:** `POST /api/users` lưu raw password (không BCrypt) → Admin create Student/Teacher descoped.
- **Registration:** không duplicate guard (D2); không capacity-check lúc create (D3); GET mở không enforce owner (D5); docs đòi UPCOMING nhưng code cho cả STUDYING (S11-D1).
- **Headcount:** docs nói +1 sau thanh toán nhưng code +1 ngay khi approve (D1).
- **Transaction:** reject không có reason field (T2); không có cancel-transaction (T3); `docs/api/README` ghi `/api/payments/*` không tồn tại (T4); UC-27 nhắc status "Đã hủy"/pagination không có (T5); gateway log/đối soát/QR-bank info không có backend (T6/T7).
- **Attendance:** docs có "ngày quá xa" nhưng code chỉ chặn future (D1-S10); không tính % chuyên cần (D2); update sheet của class FINISHED vẫn cho phép (D5); duplicate sheet → 400 không 409 (D6).
- **Frontend:** `dashboardCharts.test.tsx` fail 1 assertion (maintenance backlog).
- **D1 (S17, đã fix + verify):** `PUT /api/attendance/sheets/{id}` từng 500 trên MySQL do
  clear+insert cùng flush (vi phạm unique sheet+student); fix bằng `saveAndFlush` sau clear —
  giữ nguyên file sửa, chưa commit.
- **AI live (S16B, DEFERRED):** thiếu `AI_API_KEY` nên cuộc gọi LLM ngoài chưa kiểm chứng;
  backend AI + UI + test tự động đã xong, thiếu key trả 400 thân thiện.

## 17. Out of Scope

Payment Gateway, Refresh Token, OAuth2, JWT blacklist/Redis, Microservices, Docker/Kubernetes,
CI/CD phức tạp, ML training, tự động xếp lớp, chấm tự luận ML, Analytics/Dashboard phức tạp,
realtime/websocket, QR/banking integration, feature ngoài Intern scope.

## 18. Release Goal

Sau CORE BUSINESS COMPLETE: fix dashboardCharts → full regression → UAT tay 3 role →
verify production config → README/ERD/demo docs → deploy → Intern Project Ready.
Chi tiết xem `ROADMAP.md`.
