# Project Progress — Intern Scope

> Checkpoint TẠM DỪNG dự án. Đọc file này trước khi tiếp tục.
> Cập nhật cuối: Step 15 — Schedule API / UC-18.

## Current checkpoint

- Đã hoàn thành đến **Step 15**.
- **Step 14: Score API** (`scores` table, UC-17/UC-19).
- **Step 15: Schedule API / UC-18** (read-only trên bảng `classes`).
- Đây là checkpoint **TẠM DỪNG dự án** — không triển khai thêm Notification, AI Chat hay bất kỳ feature mới nào cho đến khi người dùng xác nhận tiếp tục.

## Completed

- Analysis + Database Design
- Authentication/JWT
- User
- StudentProfile
- Course
- CourseClass
- Registration
- Manual QR Payment
- Attendance
- Score API
- Schedule API

## Current test status

- Tổng **265 tests**
- **0 failures**
- **0 errors**
- Không regression (198 cũ + 53 mới Score + 14 mới Schedule)

## Step 14 — Score API

- **API đã triển khai** (base path `/api/scores`):
  - `POST /api/scores` — **upsert** theo cặp `studentId + classId`: chưa có → tạo (201), đã có → cập nhật total_score.
  - `GET /api/scores` — optional `studentId`, `classId`.
  - `GET /api/scores/{id}`
  - `PUT /api/scores/{id}`
  - `DELETE /api/scores/{id}` (204)
- **Role/authorization**:
  - `ADMIN`: quản lý mọi điểm, xem tất cả.
  - `TEACHER`: chỉ lớp mình được phân công (khác → 403).
  - `STUDENT`: chỉ đọc điểm của chính mình (xem/sửa/xóa điểm khác → 403).
- **Công thức total_score**:
  `round(midterm * 0.4 + final * 0.6, 1)` — tự tính khi đủ cả 2 điểm; thiếu 1 trong 2 → `NULL`; tính lại khi update.
- Nhập/sửa **từng học viên**, **không bulk**.
- **Business rule chính**:
  - Điểm giữa kỳ/cuối kỳ trong thang 0–10 (`@DecimalMin/@DecimalMax` + CHECK constraint DB).
  - Student phải tồn tại và có role `STUDENT`.
  - Lớp phải tồn tại.
  - Học viên phải có registration `APPROVED` hoặc `PAID` trong lớp.
  - Chỉ nhập/sửa khi lớp ở trạng thái `STUDYING` hoặc `FINISHED` (UPCOMING/CANCELLED → 400).
  - Không trùng cặp `(student_id, class_id)` — unique constraint.
- **Test count**: `ScoreServiceTest` 28 + `ScoreControllerTest` 25 = **53 tests**.

## Step 15 — Schedule API / UC-18

- **API đã triển khai**: `GET /api/schedules`
- Optional query params `from` / `to` (ISO date) — **date-range overlap** (`startDate <= to && endDate >= from`).
- **Phân quyền theo role**:
  - `Student`: chỉ các lớp mình đăng ký `APPROVED`/`PAID` **và** `STUDYING`, dedup theo registration.
  - `Teacher`: chỉ các lớp mình dạy **và** `STUDYING`.
  - `Admin`: mọi lớp `STUDYING` (loại UPCOMING/FINISHED/CANCELLED).
- Response: `classId`, `className`, `courseName`, `scheduleDay`, `startTime`, `endTime`, `room`, `teacherId`, `teacherName`, `startDate`, `endDate`.
- **Test count**: `ScheduleServiceTest` 7 + `ScheduleControllerTest` 7 = **14 tests**.

## Intern scope

Đây là phạm vi cần giữ:

- Score Management ✅
- Schedule / UC-18 ✅
- Notification ⏸ (chưa làm)
- AI Chat + FAQ + Chat History ⏸ (chưa làm)
- Audit Log tối giản ⏸ (chưa làm)

## Explicitly OUT OF SCOPE

Không tự triển khai:

- Payment Gateway
- Refresh Token
- OAuth2
- JWT blacklist/Redis
- Microservices
- Docker/Kubernetes
- CI/CD phức tạp
- ML training
- Tự động xếp lớp
- Chấm tự luận bằng ML
- Analytics/Dashboard phức tạp
- Các feature không thuộc Intern scope

## Next step when project resumes

**Notification module** — bảng `notifications` + `notification_recipients` (UC-22…27, module `thong-bao-giam-sat`).

**Nhưng CHƯA triển khai bây giờ.**

## Resume instructions

Khi được yêu cầu tiếp tục:

1. **Đọc file handoff này trước.**
2. Kiểm tra `git status` và `git rev-parse --short HEAD`.
3. **Không tự ý mở rộng scope** — giữ đúng "Intern scope" và "Explicitly OUT OF SCOPE" ở trên.
4. Chỉ bắt đầu **Notification** khi người dùng xác nhận tiếp tục.
5. Trước khi code phải **audit lại schema/SRS/use case liên quan** (`database/schema.sql`, `docs/usecase-specification/thong-bao-giam-sat/`, domain model).
6. Giữ nguyên pattern hiện có: `ApiResponse<T>` envelope, `GlobalExceptionHandler`, phân quyền trong service layer, response DTO `fromEntity()`, `@AuthenticationPrincipal User currentUser`, test đầy đủ (unit + MockMvc/H2).

## Repository context

- Backend: Spring Boot 3.2.5, Java 17, Gradle 8.7, MySQL 8.0 (`ddl-auto: validate`), JWT (không refresh token).
- Frontend (`frontend/`) trống — chưa triển khai.
- Script chạy test: `.\gradlew.bat clean test --console=plain` (trong `backend/`).
- Bảng DB chưa có entity/code: `notifications`, `notification_recipients`, `chat_conversations`, `chat_messages`, `faqs`, `audit_logs`, `system_settings`, `teacher_profiles`, `token_blacklist`, `failed_login_attempts`, `password_reset_tokens`.
