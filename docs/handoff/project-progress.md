# Project Progress — Intern Scope

> Checkpoint TẠM DỪNG dự án. Đọc file này trước khi tiếp tục.
> Cập nhật cuối: Step 17.5 — Seed Attendance + Scores (Seed Data 17.1 → 17.5 hoàn thành).

## Current checkpoint

- Đã hoàn thành đến **Step 17.5** (Seed Data: Users + StudentProfiles, Courses + Classes, Registrations + Transactions, Attendance + Scores).
- **Step 14: Score API** (`scores`, UC-17/UC-19). **Step 15: Schedule API / UC-18** (read-only `classes`).
- **Step 16: Notification module** (UC-34 Gửi thông báo, UC-37/UC-38 Xem thông báo) + **Step 16.5** regression tests.
- **Step 17: Seed Data framework** — còn **Step 17.6 (Notifications seed)** và **Step 17.7 (verify)** chưa làm.
- Đây là checkpoint **TẠM DỪNG dự án** — không triển khai thêm feature mới (Frontend, AI Chat, Audit Log...) cho đến khi người dùng xác nhận tiếp tục.

## Repository context

- Backend: Spring Boot 3.2.5, Java 17, Gradle 8.7, MySQL 8.0 (`ddl-auto: validate`), JWT (không refresh token).
- Frontend (`frontend/`) trống — chưa triển khai.
- Script chạy test: `.\gradlew.bat clean test --console=plain` (trong `backend/`).
- Chạy seed: `.\gradlew.bat bootRun --args="--spring.profiles.active=seed"` (seeder chỉ chạy với profile `seed`).

## Git status hiện tại (xác nhận từ repository)

- **HEAD:** `8b94ffb feat: seed attendance and scores (Step 17.5)`
- Working tree **clean** (không có thay đổi chưa commit).
- Branch: `main`.

### Commit log gần nhất (mới → cũ)

```
8b94ffb feat: seed attendance and scores (Step 17.5)
37671c5 feat: seed registrations and transactions (Step 17.4)
3d7e41d feat: seed courses and classes (Step 17.3)
70eda75 feat: seed users and student profiles (Step 17.2)
19c948a feat: add seed data framework (Step 17.1)
c3ec63d test: add notification integration and regression tests (Step 16.5)
ffcd67d docs: update project progress handoff at Step 16.4
9795291 feat: add notification controller and API (Step 16.4)
```

## Completed (theo thứ tự)

1. Analysis + Database Design (`8ba600f`)
2. Phase 2 Backend — JWT auth + 7 business APIs (Users, StudentProfiles, Courses, Classes, Registrations, Transactions, Attendance) (`eb308fd`)
3. Score API — Step 14 (`48d2401`)
4. Schedule API — Step 15 (`48d2401`)
5. Notification module — Step 16.1 → 16.5 (`1d8c804` → `c3ec63d`)
6. Seed Data — Step 17.1 → 17.5 (`19c948a` → `8b94ffb`)

## Current test status

- **315 tests, 0 failures, 0 errors** (xác nhận sau `clean test`).
- Con số này không đổi từ sau Step 16.5 (các bước 17.x chỉ thêm seed data, không thêm test).

## Seed Data — kiến trúc

File duy nhất: `backend/src/main/java/com/englishcenter/seed/DataSeeder.java` (`com.englishcenter.seed`).

- `@Component @Profile("seed")` + `implements CommandLineRunner` + `@Transactional` (nguyên khối — lỗi giữa chừng → rollback toàn bộ).
- **Idempotent guard:** `userRepository.existsByEmail(SEED_ADMIN_EMAIL)` (`admin@example.com`) → chạy lại sẽ skip toàn bộ, không duplicate.
- **Password:** `passwordEncoder.encode("password123")` (BCrypt bean) — KHÔNG hard-code hash.
- Không hard-code ID: course persist trước rồi dùng entity; teacher/student lấy qua `userRepository.findByEmail`; class tra theo tên qua `findClassByName` (dùng `courseClassRepository.findAll()`).
- Trình tự `run()`: `seedUsersAndProfiles()` → `seedCoursesAndClasses()` → `seedRegistrationsAndTransactions()` → `seedAttendanceAndScores()`.

### Dữ liệu đã seed (17.1–17.5)

- **Users:** 1 ADMIN (`admin@example.com`), 2 TEACHER (`teacher1/teacher2@example.com`), 5 STUDENT ACTIVE (`student1..5@example.com`), 1 STUDENT INACTIVE (`student-inactive@example.com`). Password mặc định `password123`.
- **StudentProfiles:** cho tất cả student (kể cả inactive). Dùng `@MapsId` — chỉ set `.user(user)`.
- **Courses (3):** English Foundation (BEGINNER), English Communication (INTERMEDIATE), IELTS Advanced (ADVANCED) — đều ACTIVE.
- **Classes (6):** Beginner Class A (UPCOMING/t1), Beginner Class B (STUDYING/t2), Intermediate Class A (STUDYING/t1), Intermediate Class B (FINISHED/t2), Advanced Class A (FINISHED/t1), Advanced Class B (CANCELLED/t2). Ngày tương đối theo `LocalDate.now()`. `end_time>start_time`, `end_date>start_date`, `max_capacity>0`.
- **Registrations (9):** Beginner B: s1 APPROVED, s2 APPROVED, s3 PAID; Intermediate A: s3 APPROVED, s4 PAID, s5 APPROVED; Beginner A: s1/s2 PENDING; Advanced A: s5 REJECTED. `approved_by/rejected_by` = admin. Không vượt maxCapacity.
- **Transactions (5):** r1 FAILED, r2 PENDING_CONFIRMATION, r3 SUCCESS, r5 SUCCESS, r6 PENDING_CONFIRMATION. `transaction_code` tự sinh `TXN-000001`... (unique).
- **Attendance (4 sheets):** Beginner B (2 ngày) + Intermediate A (2 ngày), `createdBy` = teacher. Records chỉ cho student enrolled (APPROVED/PAID), đủ PRESENT/ABSENT/EXCUSED. Records persist qua cascade của `AttendanceSheet` (KHÔNG có `AttendanceRecordRepository`).
- **Scores (6):** s1/s2/s3 Beginner B, s3/s4/s5 Intermediate A. `total = mid*0.4 + fin*0.6` (scale 1, HALF_UP — đúng `ScoreServiceImpl`).

### Step 17.6 — còn lại (chờ xác nhận)

Seed Notifications (4 target types) + `notification_recipients` (read/unread mix), rồi **Step 17.7** verify.

Gợi ý đúng business rules (ĐÃ CHỐT):
- `ALL_STUDENTS` → chỉ STUDENT ACTIVE; `ALL_TEACHERS` → chỉ TEACHER ACTIVE; `SPECIFIC_CLASS` → student APPROVED/PAID + teacher của class (dedupe); `SPECIFIC_USER` → 1 user.
- Seed bằng **repository trực tiếp** (KHÔNG qua `NotificationService.create`) để tự set `isRead/readAt`; `createdBy` = admin đã persist.
- Các class STUDYING có APPROVED/PAID: Beginner Class B (s1,s2,s3) và Intermediate Class A (s3,s4,s5) — thích hợp cho `SPECIFIC_CLASS`.
- Nhớ test cả trường hợp `ALL_STUDENTS` bỏ qua `student-inactive` (INACTIVE).

## Notification module — các quyết định KHÔNG được thay đổi

1. `NotificationService` contract **CHỈ 7 method** (create, findAll, findUnread, findDetail, countUnread, markAllAsRead, delete).
2. **KHÔNG có `findAllSent()`**; **KHÔNG tạo `GET /api/notifications/sent`**.
3. Phân quyền nằm trong **service layer** — KHÔNG thêm matcher SecurityConfig cho `/api/notifications/**`.
4. Response DTO dùng convention `fromEntity()`; envelope `ApiResponse<T>`.
5. Business rules 1–12 trong NotificationServiceImpl (resolveRecipients).

### Notification API endpoints (đã chốt)

Base: `/api/notifications` — POST `create` (201, ADMIN only), GET list, GET `/unread`, GET `/unread/count`, GET `/{id}` (auto-read), PUT `/read-all`, DELETE `/{id}` (204). Truy cập không thuộc quyền → 404 (không leak existence).

## Intern scope

- Score Management ✅ / Schedule (UC-18) ✅ / Notification ✅ / Seed Data ⏳ (17.6–17.7 còn lại)
- AI Chat + FAQ + Chat History ⏸ (chưa làm) — bảng `chat_conversations`, `chat_messages`, `faqs` chưa có entity.
- Audit Log tối giản ⏸ (chưa làm) — bảng `audit_logs` chưa có entity.
- Frontend ⏸ (trống).

## Explicitly OUT OF SCOPE

Không tự triển khai: Payment Gateway, Refresh Token, OAuth2, JWT blacklist/Redis, Microservices, Docker/Kubernetes, CI/CD phức tạp, ML training, Tự động xếp lớp, Chấm tự luận bằng ML, Analytics/Dashboard phức tạp, các feature ngoài Intern scope.

## Bảng DB chưa có entity/code

`notifications` ✅ / `notification_recipients` ✅ (Step 16). `chat_conversations`, `chat_messages`, `faqs`, `audit_logs`, `system_settings`, `teacher_profiles`, `token_blacklist`, `failed_login_attempts`, `password_reset_tokens` — chưa có entity. (Lưu ý: không seed các bảng này trong giai đoạn hiện tại.)

## Next steps (đề xuất, CHỜ người dùng xác nhận)

1. **Step 17.6 — Seed Notifications** + recipients (đúng business rules trên).
2. **Step 17.7 — Verify Seed Data** (chạy app profile `seed`, smoke-test API; chạy `clean test` giữ 315/0/0).
3. Sau đó: Frontend (trống) hoặc các module intern còn lại (AI Chat/FAQ, Audit Log) — theo quyết định người dùng.

## Resume instructions

1. **Đọc file handoff này trước.**
2. Kiểm tra `git status` và `git rev-parse --short HEAD`.
3. **Không tự ý mở rộng scope** — giữ đúng "Intern scope" và "Explicitly OUT OF SCOPE" ở trên.
4. Chỉ tiếp tục khi người dùng xác nhận.
5. Trước khi code phải **audit lại schema/SRS/use case liên quan** (`database/schema.sql`, `docs/usecase-specification/`, domain model).
6. Giữ nguyên pattern hiện có: `ApiResponse<T>` envelope, `GlobalExceptionHandler`, phân quyền trong service layer, response DTO `fromEntity()`, `@AuthenticationPrincipal User currentUser`, test đầy đủ (unit + MockMvc/H2).
7. Seed Data: chỉ sửa `DataSeeder.java`, giữ `@Profile("seed")` + `@Transactional` + idempotent guard.
