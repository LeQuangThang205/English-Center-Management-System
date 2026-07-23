# Domain Model — English Center Management System

> **Phase:** Database Design (Step 1)
> **Phiên bản:** Draft v0.2 — chờ review (sửa R11, transaction_code UNIQUE, faqs.question VARCHAR)
> **Chuẩn bị cho:** ERD

---

## 1. Entity Candidate List

Tổng cộng **20 entities** được xác định từ phân tích SRS + 39 Use Case Specifications + Activity Diagrams + Sequence Diagrams.

### Nhóm 1: Authentication & User Management

#### 1.1 `users`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Tài khoản đăng nhập của tất cả người dùng (Admin, Teacher, Student). Là entity trung tâm cho authentication và authorization. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Mỗi user có một email duy nhất, mật khẩu mã hóa bcrypt, một role duy nhất. Tài khoản có thể active hoặc inactive (soft delete). Lưu vết số lần đăng nhập sai để phục vụ lockout. |
| **Key Attributes** | email, password_hash, full_name, phone, role (ADMIN/TEACHER/STUDENT), status (ACTIVE/INACTIVE), avatar_url, email_verified_at, failed_attempts, locked_until, last_login_at |
| **Source UC** | UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08 |

#### 1.2 `student_profiles`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Thông tin mở rộng dành riêng cho Student. Tách riêng khỏi users để giữ users gọn nhẹ. |
| **Primary Key** | `id` (BIGINT, FK → users.id) — 1:1 với users |
| **Business Description** | Chỉ tồn tại khi user có role = STUDENT. Chứa ngày sinh, địa chỉ, ngày tham gia trung tâm. |
| **Key Attributes** | user_id (PK/FK), date_of_birth, address, enrollment_date |
| **Source UC** | UC-07, UC-10 |

#### 1.3 `teacher_profiles`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Thông tin mở rộng dành riêng cho Teacher. |
| **Primary Key** | `id` (BIGINT, FK → users.id) — 1:1 với users |
| **Business Description** | Chỉ tồn tại khi user có role = TEACHER. Chứa chuyên môn, ngày tham gia. |
| **Key Attributes** | user_id (PK/FK), specialization, hire_date |
| **Source UC** | UC-08, UC-11 |

#### 1.4 `password_reset_tokens`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Lưu token đặt lại mật khẩu (UC-04). Token có thời hạn 15 phút, chỉ dùng một lần. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Token được tạo khi user yêu cầu quên mật khẩu. Bị xóa sau khi sử dụng hoặc hết hạn. |
| **Key Attributes** | user_id (FK), token (unique), expires_at, used_at |
| **Source UC** | UC-04 |

#### 1.5 `token_blacklist`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Danh sách JWT token đã logout (UC-03). Ngăn token cũ tiếp tục được sử dụng. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Khi user logout, JWT token được thêm vào blacklist. Token tự động bị xóa khỏi blacklist sau khi hết hạn. |
| **Key Attributes** | token (indexed), expires_at |
| **Source UC** | UC-03 |

### Nhóm 2: Course & Class Management

#### 1.6 `courses`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Danh mục khóa học do trung tâm cung cấp. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Mỗi khóa học có tên, mô tả, học phí (>0), cấp độ (Beginner/Intermediate/Advanced), thời lượng (số buổi). Khóa học có thể bị xóa mềm nếu không có lớp đang hoạt động. |
| **Key Attributes** | name, description, tuition, level (BEGINNER/INTERMEDIATE/ADVANCED), duration (sessions), status (ACTIVE/DELETED), created_at, updated_at |
| **Source UC** | UC-09, UC-12, UC-13, UC-20, UC-21, UC-31 |

#### 1.7 `classes`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Lớp học cụ thể — là một instance của khóa học. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Mỗi lớp học thuộc về một khóa học (course_id), có thể có giáo viên phụ trách (teacher_id, nullable), sĩ số tối đa, lịch học cố định (thứ, giờ bắt đầu, giờ kết thúc, phòng học). Trạng thái: Sắp khai giảng → Đang học → Đã kết thúc / Đã hủy. |
| **Key Attributes** | course_id (FK), name, teacher_id (FK, nullable), max_capacity, current_headcount, schedule_day, start_time, end_time, room, start_date, end_date, status (UPCOMING/STUDYING/FINISHED/CANCELLED) |
| **Source UC** | UC-14, UC-15, UC-16, UC-17, UC-18, UC-20, UC-21 |

### Nhóm 3: Registration & Enrollment

#### 1.8 `registrations`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Ghi nhận yêu cầu đăng ký khóa học của Student. Quản lý toàn bộ vòng đời đăng ký. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Student đăng ký một lớp cụ thể. Qua các giai đoạn: Chờ duyệt → Đã duyệt → Đã thanh toán (hoặc Từ chối / Đã hủy). Mỗi student chỉ được đăng ký một lớp một lần. Registration là entity quyết định việc student thuộc về lớp nào (chỉ khi status = PAID). |
| **Key Attributes** | student_id (FK → users), class_id (FK), status (PENDING/APPROVED/REJECTED/CANCELLED/PAID), tuition_at_registration, registered_at, approved_at, approved_by (FK), rejected_at, rejected_by (FK), rejection_reason, paid_at |
| **Business Rules** | Status PENDING → APPROVED (Admin duyệt). PENDING → REJECTED (Admin từ chối). APPROVED → PAID (Sau khi thanh toán). PENDING → CANCELLED (Student hủy). Chỉ PENDING mới được xử lý. |
| **Source UC** | UC-20, UC-21, UC-22, UC-23, UC-24, UC-25, UC-26, UC-27 |

### Nhóm 4: Payment

#### 1.9 `transactions`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Ghi nhận giao dịch thanh toán học phí qua QR chuyển khoản thủ công. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Được tạo khi Student chọn thanh toán cho một registration đã duyệt. Student chuyển khoản qua ngân hàng, nhấn "Đã thanh toán". Admin kiểm tra Internet Banking và xác nhận. Transaction chuyển từ PENDING_CONFIRMATION → SUCCESS (hoặc FAILED). Khi SUCCESS, registration chuyển PAID và student được thêm vào lớp. |
| **Key Attributes** | registration_id (FK, indexed, NOT NULL), amount, payment_method (BANK_TRANSFER), status (PENDING_CONFIRMATION/SUCCESS/FAILED), transaction_code (nội bộ, unique), created_at, paid_at (khi student báo), confirmed_at, confirmed_by (FK → users) |
| **Source UC** | UC-26, UC-27, UC-28, UC-29 |

### Nhóm 5: Attendance

#### 1.10 `attendance_sheets`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Phiên điểm danh cho một lớp vào một ngày cụ thể. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Mỗi lớp chỉ có một attendance sheet cho mỗi ngày học. Được tạo khi Teacher bắt đầu điểm danh. Sheet có thể được sửa lại (cập nhật). |
| **Key Attributes** | class_id (FK), date, created_by (FK → users), created_at, updated_at |
| **Source UC** | UC-16 |

#### 1.11 `attendance_records`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Trạng thái điểm danh của từng học viên trong một phiên điểm danh. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Mỗi student trong lớp có một record trong mỗi sheet. Trạng thái: Có mặt, Vắng, Vắng có phép. |
| **Key Attributes** | sheet_id (FK), student_id (FK → users), status (PRESENT/ABSENT/EXCUSED) |
| **Unique Constraint** | (sheet_id, student_id) — mỗi student chỉ có một trạng thái trong một sheet |
| **Source UC** | UC-16 |

### Nhóm 6: Score Management

#### 1.12 `scores`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Bảng điểm của student theo từng lớp học. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Lưu điểm giữa kỳ, cuối kỳ, tổng kết (thang 0-10, 1 số thập phân) và nhận xét. Mỗi student có một bản ghi điểm cho mỗi lớp. Teacher được phân công lớp mới có quyền nhập/sửa. |
| **Key Attributes** | student_id (FK → users), class_id (FK), midterm_score, final_score, total_score, comment, created_by (FK), created_at, updated_at |
| **Unique Constraint** | (student_id, class_id) — mỗi student chỉ có một bảng điểm cho mỗi lớp |
| **Source UC** | UC-17, UC-19 |

### Nhóm 7: Notifications

#### 1.13 `notifications`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Thông báo do Admin gửi đến người dùng. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Admin tạo thông báo với tiêu đề, nội dung, đối tượng nhận (tất cả HV, tất cả GV, một lớp cụ thể, cá nhân). Có thể đính kèm file (tối đa 10MB). Thông báo được gửi qua in-app và email. |
| **Key Attributes** | title, content, target_type (ALL_STUDENTS/ALL_TEACHERS/SPECIFIC_CLASS/SPECIFIC_USER), target_id (nullable, tùy target_type), attachment_url (nullable), created_by (FK), created_at |
| **Source UC** | UC-34 |

#### 1.14 `notification_recipients`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Liên kết giữa notification và từng user nhận. Lưu trạng thái đã đọc. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Khi Admin gửi thông báo, hệ thống tạo bản ghi cho mỗi user trong danh sách nhận. User có thể đánh dấu đã đọc. |
| **Key Attributes** | notification_id (FK), user_id (FK), is_read (boolean), read_at (nullable) |
| **Unique Constraint** | (notification_id, user_id) |
| **Source UC** | UC-34, UC-38 |

### Nhóm 8: AI & Chat

#### 1.15 `chat_conversations`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Cuộc hội thoại giữa user (Guest/Student/Admin) và AI. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Mỗi conversation thuộc về một user (nullable cho Guest). Phân loại: AI Chatbot (cho Student/Guest) hoặc AI Assistant (cho Admin). Lưu thời gian bắt đầu. |
| **Key Attributes** | user_id (FK, nullable — null cho Guest), type (CHATBOT/ASSISTANT), title (nullable, generated), created_at |
| **Source UC** | UC-30, UC-32 |

#### 1.16 `chat_messages`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Mỗi lượt hỏi-đáp trong một conversation. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Lưu câu hỏi của user và phản hồi của AI. Đánh số thứ tự trong conversation. |
| **Key Attributes** | conversation_id (FK), sequence_number, question (text), response (text), created_at |
| **Source UC** | UC-30, UC-32 |

#### 1.17 `faqs`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Kho kiến thức FAQ — nguồn dữ liệu cho AI Chatbot và AI Assistant. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Admin quản lý danh sách câu hỏi và câu trả lời mẫu. Có thể phân loại theo danh mục, gắn tag. FAQ có thể ẩn/hiện. FAQ visible được dùng làm context cho AI Service. |
| **Key Attributes** | question, answer, category, tags (JSON/text), status (VISIBLE/HIDDEN), created_by (FK), created_at, updated_at |
| **Source UC** | UC-33 |

### Nhóm 9: System & Audit

#### 1.18 `audit_logs`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Ghi nhận mọi thao tác quan trọng trên hệ thống phục vụ kiểm tra và truy vết. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Read-only, không bao giờ được sửa hoặc xóa. Ghi lại: ai làm gì, lúc nào, trên đối tượng nào, dữ liệu cũ/mới, địa chỉ IP. Các hành động gồm CREATE, UPDATE, DELETE, APPROVE, REJECT, PAYMENT, LOGIN, LOGOUT. |
| **Key Attributes** | actor_id (FK → users, nullable cho Guest), action (CREATE/UPDATE/DELETE/APPROVE/REJECT/PAYMENT/LOGIN/LOGOUT), entity_type (tên bảng), entity_id, old_value (JSON, nullable), new_value (JSON, nullable), ip_address, user_agent, created_at |
| **Source UC** | UC-37 (và tham chiếu từ UC-05, UC-07, UC-08, UC-09, UC-14, UC-15, UC-17, UC-23, UC-24, UC-26, UC-33, UC-34, UC-39) |

#### 1.19 `system_settings`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Lưu cấu hình hệ thống dạng key-value. |
| **Primary Key** | `key` (VARCHAR, PK — tên cài đặt) |
| **Business Description** | Dùng để lưu thông tin trung tâm, cấu hình học phí, email, bảo mật, v.v. Giá trị có thể là string hoặc JSON. Giá trị nhạy cảm (API key, SMTP password) phải được mã hóa. |
| **Key Attributes** | key (PK), value (text/JSON), description, group (CENTER_INFO/TUITION/EMAIL/SECURITY), updated_at |
| **Source UC** | UC-39 |

#### 1.20 `failed_login_attempts`

| Mục | Mô tả |
|-----|-------|
| **Purpose** | Lưu vết các lần đăng nhập thất bại để phát hiện lockout. |
| **Primary Key** | `id` (BIGINT, auto-increment) |
| **Business Description** | Ghi lại mỗi lần đăng nhập sai theo email và IP. Dùng để đếm số lần sai liên tiếp trong 15 phút. Các bản ghi cũ được dọn dẹp định kỳ. |
| **Key Attributes** | email (indexed), ip_address, attempted_at |
| **Source UC** | UC-02 |

---

## 2. Relationship Analysis

### 2.1 Ký hiệu

Ký hiệu | Ý nghĩa
--------|--------
`||--o{` | 1 — N (bắt buộc bên 1, tùy chọn bên nhiều)
`||--\|{` | 1 — N (bắt buộc cả hai)
`o{\|--o{` | N — N (tùy chọn cả hai)
`\|--\|{` | 1 — N (bắt buộc cả hai)
`||--\|{` | 1 — N (bắt buộc bên 1, bắt buộc bên nhiều)

### 2.2 Chi tiết quan hệ

#### 2.2.1 Authentication & User

| # | Entity A | Entity B | Type | Cardinality | Mô tả |
|---|----------|----------|------|-------------|-------|
| R01 | `users` | `student_profiles` | **1:1** | Optional → Optional | User có role=STUDENT mới có profile. Mỗi student có đúng 1 profile. |
| R02 | `users` | `teacher_profiles` | **1:1** | Optional → Optional | User có role=TEACHER mới có profile. Mỗi teacher có đúng 1 profile. |
| R03 | `users` | `password_reset_tokens` | **1:N** | Optional → Optional | User có thể có nhiều token qua các lần quên mật khẩu khác nhau. Token bị xóa sau khi dùng. |
| R04 | `users` | `failed_login_attempts` | **1:N** | Optional → Optional | Ghi lại các lần login sai của user (qua email). Dùng để tính lockout. |

#### 2.2.2 Course & Class

| # | Entity A | Entity B | Type | Cardinality | Mô tả |
|---|----------|----------|------|-------------|-------|
| R05 | `courses` | `classes` | **1:N** | Mandatory → Optional | Một khóa học có thể có nhiều lớp. Mỗi lớp thuộc về đúng một khóa học. |
| R06 | `teacher_profiles` | `classes` | **1:N** | Optional → Optional | Một teacher có thể dạy nhiều lớp. Mỗi lớp có thể có 0 hoặc 1 teacher. |
| R07 | `users` (student) | `classes` | **N:N** | Optional → Optional | Qua `registrations`. Student thuộc về lớp khi registration.status = PAID. |

#### 2.2.3 Registration

| # | Entity A | Entity B | Type | Cardinality | Mô tả |
|---|----------|----------|------|-------------|-------|
| R08 | `users` (student) | `registrations` | **1:N** | Mandatory → Optional | Một student có thể đăng ký nhiều lớp. Mỗi registration thuộc về một student. |
| R09 | `classes` | `registrations` | **1:N** | Mandatory → Optional | Một lớp có thể có nhiều registration. Mỗi registration thuộc về một lớp. |
| R10 | `users` (admin) | `registrations` | **1:N** | Optional → Optional | Admin duyệt/từ chối registration (approved_by, rejected_by). |

#### 2.2.4 Payment

| # | Entity A | Entity B | Type | Cardinality | Mô tả |
|---|----------|----------|------|-------------|-------|
| R11 | `registrations` | `transactions` | **1:N** | Mandatory → Optional | Một registration có thể có nhiều transaction nhưng tối đa một transaction SUCCESS. Mỗi transaction thuộc về đúng một registration. |
| R12 | `users` (admin) | `transactions` | **1:N** | Optional → Optional | Admin xác nhận/từ chối transaction (confirmed_by). |

#### 2.2.5 Attendance

| # | Entity A | Entity B | Type | Cardinality | Mô tả |
|---|----------|----------|------|-------------|-------|
| R13 | `classes` | `attendance_sheets` | **1:N** | Mandatory → Optional | Một lớp có thể có nhiều attendance sheet (mỗi buổi học một sheet). Mỗi sheet thuộc về một lớp. |
| R14 | `attendance_sheets` | `attendance_records` | **1:N** | Mandatory → Mandatory | Một sheet có nhiều record (mỗi student một record). Mỗi record thuộc về đúng một sheet. |
| R15 | `users` (student) | `attendance_records` | **1:N** | Optional → Optional | Một student có nhiều attendance record qua các buổi học. |

#### 2.2.6 Score

| # | Entity A | Entity B | Type | Cardinality | Mô tả |
|---|----------|----------|------|-------------|-------|
| R16 | `users` (student) | `scores` | **1:N** | Optional → Optional | Một student có nhiều score record (mỗi lớp một record). |
| R17 | `classes` | `scores` | **1:N** | Mandatory → Optional | Một lớp có nhiều score record (mỗi student một record). |

#### 2.2.7 Notification

| # | Entity A | Entity B | Type | Cardinality | Mô tả |
|---|----------|----------|------|-------------|-------|
| R18 | `users` (admin) | `notifications` | **1:N** | Optional → Optional | Admin tạo thông báo. Một admin có thể tạo nhiều thông báo. |
| R19 | `notifications` | `notification_recipients` | **1:N** | Mandatory → Mandatory | Một notification có nhiều recipients. Mỗi recipient thuộc về một notification. |
| R20 | `users` | `notification_recipients` | **1:N** | Mandatory → Optional | Một user có thể nhận nhiều thông báo. |

#### 2.2.8 AI & Chat

| # | Entity A | Entity B | Type | Cardinality | Mô tả |
|---|----------|----------|------|-------------|-------|
| R21 | `users` | `chat_conversations` | **1:N** | Optional → Optional | User (Student/Admin) có nhiều conversation. Guest không có user_id (nullable). |
| R22 | `chat_conversations` | `chat_messages` | **1:N** | Mandatory → Mandatory | Một conversation có nhiều message. Mỗi message thuộc về một conversation. |

#### 2.2.9 Audit

| # | Entity A | Entity B | Type | Cardinality | Mô tả |
|---|----------|----------|------|-------------|-------|
| R23 | `users` | `audit_logs` | **1:N** | Optional → Optional | Ghi lại hành động của user. Guest action có actor_id = null. |

### 2.3 Mô hình quan hệ tổng thể (dạng văn bản)

```
users (1) ---- (0..1) student_profiles
users (1) ---- (0..1) teacher_profiles
users (1) ----< (0..N) registrations (as student)
users (1) ----< (0..N) registrations (as approved_by/rejected_by)
users (1) ----< (0..N) transactions (as confirmed_by)
users (1) ----< (0..N) notifications (as created_by)
users (1) ----< (0..N) notification_recipients
users (1) ----< (0..N) chat_conversations
users (1) ----< (0..N) audit_logs
users (1) ----< (0..N) password_reset_tokens
users (1) ----< (0..N) failed_login_attempts

teacher_profiles (1) ----< (0..N) classes (as assigned teacher)

courses (1) ----< (0..N) classes

classes (1) ----< (0..N) registrations
classes (1) ----< (0..N) attendance_sheets
classes (1) ----< (0..N) scores

registrations (1) ----< (0..N) transactions
registrations (N) ---- (1) classes
registrations (N) ---- (1) users (student)

attendance_sheets (1) ----< (0..N) attendance_records

attendance_records (N) ---- (1) attendance_sheets
attendance_records (N) ---- (1) users (student)

scores (N) ---- (1) classes
scores (N) ---- (1) users (student)

notifications (1) ----< (0..N) notification_recipients

notification_recipients (N) ---- (1) notifications
notification_recipients (N) ---- (1) users

chat_conversations (1) ----< (0..N) chat_messages
```

---

## 3. Business Constraints

### 3.1 Unique Constraints

| # | Entity | Constraint | Mục đích |
|---|--------|-----------|----------|
| UC01 | `users` | `email` UNIQUE | Mỗi email chỉ đăng ký một tài khoản (UC-01, UC-07, UC-08) |
| UC02 | `attendance_records` | UNIQUE(`sheet_id`, `student_id`) | Mỗi student chỉ có một trạng thái trong một buổi điểm danh (UC-16) |
| UC03 | `scores` | UNIQUE(`student_id`, `class_id`) | Mỗi student chỉ có một bảng điểm cho một lớp (UC-17) |
| UC04 | `notification_recipients` | UNIQUE(`notification_id`, `user_id`) | Mỗi user chỉ nhận một notification một lần (UC-34) |
| UC05 | `registrations` | UNIQUE(`student_id`, `class_id`) | Một student không thể đăng ký một lớp hai lần (UC-20) |
| UC06 | `transactions` | `transaction_code` UNIQUE | Mã giao dịch nội bộ là duy nhất (UC-26) |
| UC07 | `password_reset_tokens` | `token` UNIQUE | Token đặt lại mật khẩu là duy nhất (UC-04) |
| UC08 | `chat_messages` | UNIQUE(`conversation_id`, `sequence_number`) | Thứ tự message trong conversation là duy nhất (UC-30) |
| UC09 | `system_settings` | `key` PRIMARY KEY | Key cài đặt là duy nhất (UC-39) |
| UC10 | `student_profiles` | `user_id` PRIMARY KEY | 1:1 với users (UC-07) |
| UC11 | `teacher_profiles` | `user_id` PRIMARY KEY | 1:1 với users (UC-08) |

### 3.2 Foreign Key Constraints

| # | Child Table | FK Column | Parent Table | On Delete | On Update |
|---|------------|-----------|-------------|-----------|-----------|
| FK01 | `student_profiles` | `user_id` | `users`.`id` | CASCADE | CASCADE |
| FK02 | `teacher_profiles` | `user_id` | `users`.`id` | CASCADE | CASCADE |
| FK03 | `password_reset_tokens` | `user_id` | `users`.`id` | CASCADE | CASCADE |
| FK04 | `classes` | `course_id` | `courses`.`id` | RESTRICT | CASCADE |
| FK05 | `classes` | `teacher_id` | `users`.`id` | SET NULL | CASCADE |
| FK06 | `registrations` | `student_id` | `users`.`id` | RESTRICT | CASCADE |
| FK07 | `registrations` | `class_id` | `classes`.`id` | RESTRICT | CASCADE |
| FK08 | `registrations` | `approved_by` | `users`.`id` | SET NULL | CASCADE |
| FK09 | `registrations` | `rejected_by` | `users`.`id` | SET NULL | CASCADE |
| FK10 | `transactions` | `registration_id` | `registrations`.`id` | RESTRICT | CASCADE |
| FK11 | `transactions` | `confirmed_by` | `users`.`id` | SET NULL | CASCADE |
| FK12 | `attendance_sheets` | `class_id` | `classes`.`id` | CASCADE | CASCADE |
| FK13 | `attendance_sheets` | `created_by` | `users`.`id` | SET NULL | CASCADE |
| FK14 | `attendance_records` | `sheet_id` | `attendance_sheets`.`id` | CASCADE | CASCADE |
| FK15 | `attendance_records` | `student_id` | `users`.`id` | RESTRICT | CASCADE |
| FK16 | `scores` | `student_id` | `users`.`id` | RESTRICT | CASCADE |
| FK17 | `scores` | `class_id` | `classes`.`id` | CASCADE | CASCADE |
| FK18 | `scores` | `created_by` | `users`.`id` | SET NULL | CASCADE |
| FK19 | `notifications` | `created_by` | `users`.`id` | SET NULL | CASCADE |
| FK20 | `notification_recipients` | `notification_id` | `notifications`.`id` | CASCADE | CASCADE |
| FK21 | `notification_recipients` | `user_id` | `users`.`id` | CASCADE | CASCADE |
| FK22 | `chat_conversations` | `user_id` | `users`.`id` | SET NULL | CASCADE |
| FK23 | `chat_messages` | `conversation_id` | `chat_conversations`.`id` | CASCADE | CASCADE |
| FK24 | `faqs` | `created_by` | `users`.`id` | SET NULL | CASCADE |
| FK25 | `audit_logs` | `actor_id` | `users`.`id` | SET NULL | CASCADE |
| FK26 | `failed_login_attempts` | Không có FK — lưu email dạng string | — | — | — |

### 3.3 Cascade Policy

DELETE CASCADE được áp dụng cho:
- `student_profiles` / `teacher_profiles` khi user bị xóa (trên thực tế, user không bị xóa — chỉ inactive)
- `attendance_records` khi attendance_sheets bị xóa
- `notification_recipients` khi notification bị xóa
- `chat_messages` khi conversation bị xóa
- `password_reset_tokens` khi user bị xóa

DELETE RESTRICT cho:
- `registrations` — không cho xóa class/student nếu còn registration
- `transactions` — không cho xóa registration nếu còn transaction
- `scores` — không cho xóa student nếu còn điểm

SET NULL cho:
- `classes.teacher_id` — khi teacher bị xóa, class vẫn tồn tại
- `registrations.approved_by` / `rejected_by` — khi admin bị xóa
- `transactions.confirmed_by` — khi admin bị xóa
- `audit_logs.actor_id` — giữ log ngay cả khi user bị xóa

### 3.4 Soft Delete

Soft delete được áp dụng cho các entity có dữ liệu quan trọng, không được xóa cứng:

| Entity | Cột Status | Giá trị "Deleted" | Ghi chú |
|--------|-----------|-------------------|---------|
| `users` | `status` | `INACTIVE` | Tài khoản bị vô hiệu hóa, không xóa. Dữ liệu liên quan (registration, score, attendance) vẫn còn. |
| `courses` | `status` | `DELETED` | Chỉ xóa được nếu không có lớp đang hoạt động. |
| `classes` | `status` | `CANCELLED` | Chuyển trạng thái thay vì xóa. |

### 3.5 Status State Machines

#### users.status

```
ACTIVE ←→ INACTIVE
```

Admin có thể kích hoạt/vô hiệu hóa tài khoản. Không tự động chuyển đổi.

#### courses.status

```
ACTIVE → DELETED (chỉ khi không có class STUDING/UPCOMING)
```

#### classes.status

```
UPCOMING → STUDYING → FINISHED
    ↘         ↘
    CANCELLED  CANCELLED
```

#### registrations.status

```
                  → APPROVED → PAID
PENDING →
          → REJECTED
          → CANCELLED (bởi Student)
```

- PENDING → APPROVED: Admin duyệt
- PENDING → REJECTED: Admin từ chối (cần lý do)
- PENDING → CANCELLED: Student hủy
- APPROVED → PAID: Sau khi Admin xác nhận thanh toán

#### transactions.status

```
PENDING_CONFIRMATION → SUCCESS (Admin xác nhận)
                     → FAILED (Admin từ chối / quá hạn)
```

### 3.6 Business Rule Constraints

| # | Rule | Source |
|---|------|--------|
| BR01 | `users.email` phải là định dạng email hợp lệ | UC-01, UC-07, UC-08 |
| BR02 | `users.phone` phải theo định dạng số di động Việt Nam (optional) | UC-01, UC-07, UC-08 |
| BR03 | `courses.tuition` phải > 0 | UC-09 |
| BR04 | `courses.level` chỉ gồm: BEGINNER, INTERMEDIATE, ADVANCED | UC-09 |
| BR05 | `courses.duration` phải là số nguyên dương (số buổi) | UC-09 |
| BR06 | `classes.max_capacity` phải > 0 | UC-14 |
| BR07 | `classes.start_date` < `classes.end_date` | UC-14 |
| BR08 | `classes.current_headcount` <= `classes.max_capacity` | UC-14, UC-20 |
| BR09 | Chỉ teacher được phân công lớp mới được điểm danh/nhập điểm | UC-16, UC-17 |
| BR10 | `scores.midterm_score`, `final_score`, `total_score` trong khoảng 0.0 – 10.0 (1 số thập phân) | UC-17 |
| BR11 | `attendance_sheets.date` không được là ngày tương lai | UC-16 |
| BR12 | Mỗi lớp chỉ có một attendance sheet cho mỗi ngày | UC-16 |
| BR13 | Chỉ registration có status = APPROVED mới được tạo transaction | UC-26 |
| BR14 | Mỗi registration chỉ được thanh toán một lần thành công | UC-26 |
| BR15 | Chỉ registration có status = PENDING mới được duyệt/từ chối | UC-23, UC-24 |
| BR16 | `faqs.question` phải là duy nhất (unique) | UC-33 |
| BR17 | `notifications.title` và `content` không được rỗng | UC-34 |
| BR18 | File đính kèm notification tối đa 10MB | UC-34 |
| BR19 | Audit Log là read-only — không được sửa hoặc xóa | UC-37 |
| BR20 | `system_settings` giá trị nhạy cảm phải được mã hóa | UC-39 |
| BR21 | Không cho phép xóa `courses` nếu còn `classes` với status UPCOMING hoặc STUDYING | UC-09 |
| BR22 | Một teacher không thể bị phân công vào 2 lớp có lịch trùng giờ | UC-15 |
| BR23 | Chat history chỉ lưu cho Student đã đăng nhập (Guest không lưu) | UC-30 |

---

## 4. Attribute Summary per Entity

### 4.1 `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| full_name | VARCHAR(255) | NOT NULL | |
| phone | VARCHAR(20) | NULLABLE | Vietnamese mobile format |
| role | ENUM('ADMIN','TEACHER','STUDENT') | NOT NULL | |
| status | ENUM('ACTIVE','INACTIVE') | NOT NULL, DEFAULT 'ACTIVE' | Soft delete |
| avatar_url | VARCHAR(500) | NULLABLE | |
| email_verified_at | DATETIME | NULLABLE | |
| failed_attempts | INT | NOT NULL, DEFAULT 0 | Login lockout counter |
| locked_until | DATETIME | NULLABLE | Login lockout |
| last_login_at | DATETIME | NULLABLE | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

### 4.2 `student_profiles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| user_id | BIGINT | PK, FK → users.id | 1:1 |
| date_of_birth | DATE | NULLABLE | |
| address | TEXT | NULLABLE | |
| enrollment_date | DATE | NOT NULL | Ngày tham gia trung tâm |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

### 4.3 `teacher_profiles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| user_id | BIGINT | PK, FK → users.id | 1:1 |
| specialization | VARCHAR(255) | NOT NULL | Chuyên môn |
| hire_date | DATE | NOT NULL | Ngày tham gia |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

### 4.4 `courses`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(255) | NOT NULL | |
| description | TEXT | NULLABLE | |
| tuition | DECIMAL(10,2) | NOT NULL, CHECK > 0 | |
| level | ENUM('BEGINNER','INTERMEDIATE','ADVANCED') | NOT NULL | |
| duration | INT | NOT NULL, CHECK > 0 | Số buổi |
| status | ENUM('ACTIVE','DELETED') | NOT NULL, DEFAULT 'ACTIVE' | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

### 4.5 `classes`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| course_id | BIGINT | FK → courses.id, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | Tên lớp |
| teacher_id | BIGINT | FK → users.id, NULLABLE | Được phân công sau |
| max_capacity | INT | NOT NULL, CHECK > 0 | |
| current_headcount | INT | NOT NULL, DEFAULT 0 | |
| schedule_day | ENUM('MON','TUE','WED','THU','FRI','SAT','SUN') | NOT NULL | |
| start_time | TIME | NOT NULL | |
| end_time | TIME | NOT NULL, CHECK > start_time | |
| room | VARCHAR(100) | NOT NULL | |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NOT NULL, CHECK > start_date | |
| status | ENUM('UPCOMING','STUDYING','FINISHED','CANCELLED') | NOT NULL, DEFAULT 'UPCOMING' | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

### 4.6 `registrations`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| student_id | BIGINT | FK → users.id, NOT NULL | |
| class_id | BIGINT | FK → classes.id, NOT NULL | |
| status | ENUM('PENDING','APPROVED','REJECTED','CANCELLED','PAID') | NOT NULL, DEFAULT 'PENDING' | |
| tuition_at_registration | DECIMAL(10,2) | NOT NULL | Giá tại thời điểm đăng ký |
| registered_at | DATETIME | NOT NULL | |
| approved_at | DATETIME | NULLABLE | |
| approved_by | BIGINT | FK → users.id, NULLABLE | |
| rejected_at | DATETIME | NULLABLE | |
| rejected_by | BIGINT | FK → users.id, NULLABLE | |
| rejection_reason | TEXT | NULLABLE | Required khi REJECTED |
| paid_at | DATETIME | NULLABLE | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |
| UNIQUE | (student_id, class_id) | | |

### 4.7 `transactions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| registration_id | BIGINT | FK → registrations.id, NOT NULL | |
| amount | DECIMAL(10,2) | NOT NULL | |
| payment_method | ENUM('BANK_TRANSFER') | NOT NULL, DEFAULT 'BANK_TRANSFER' | |
| transaction_code | VARCHAR(100) | UNIQUE, NOT NULL | Mã giao dịch nội bộ — nội dung chuyển khoản |
| status | ENUM('PENDING_CONFIRMATION','SUCCESS','FAILED') | NOT NULL, DEFAULT 'PENDING_CONFIRMATION' | |
| created_at | DATETIME | NOT NULL | |
| paid_at | DATETIME | NULLABLE | Student báo đã thanh toán |
| confirmed_at | DATETIME | NULLABLE | Admin xác nhận |
| confirmed_by | BIGINT | FK → users.id, NULLABLE | |
| updated_at | DATETIME | NOT NULL | |

### 4.8 `attendance_sheets`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| class_id | BIGINT | FK → classes.id, NOT NULL | |
| date | DATE | NOT NULL | |
| created_by | BIGINT | FK → users.id, NOT NULL | Teacher |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |
| UNIQUE | (class_id, date) | Mỗi lớp một sheet/ngày | |

### 4.9 `attendance_records`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| sheet_id | BIGINT | FK → attendance_sheets.id, NOT NULL | |
| student_id | BIGINT | FK → users.id, NOT NULL | |
| status | ENUM('PRESENT','ABSENT','EXCUSED') | NOT NULL | |
| created_at | DATETIME | NOT NULL | |
| UNIQUE | (sheet_id, student_id) | | |

### 4.10 `scores`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| student_id | BIGINT | FK → users.id, NOT NULL | |
| class_id | BIGINT | FK → classes.id, NOT NULL | |
| midterm_score | DECIMAL(4,1) | NULLABLE, CHECK 0-10 | |
| final_score | DECIMAL(4,1) | NULLABLE, CHECK 0-10 | |
| total_score | DECIMAL(4,1) | NULLABLE, CHECK 0-10 | Auto-calculated |
| comment | TEXT | NULLABLE | |
| created_by | BIGINT | FK → users.id, NOT NULL | Teacher |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |
| UNIQUE | (student_id, class_id) | | |

### 4.11 `notifications`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| title | VARCHAR(255) | NOT NULL | |
| content | TEXT | NOT NULL | |
| target_type | ENUM('ALL_STUDENTS','ALL_TEACHERS','SPECIFIC_CLASS','SPECIFIC_USER') | NOT NULL | |
| target_id | BIGINT | NULLABLE | class_id nếu SPECIFIC_CLASS, user_id nếu SPECIFIC_USER |
| attachment_url | VARCHAR(500) | NULLABLE | Max 10MB |
| created_by | BIGINT | FK → users.id, NOT NULL | Admin |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

### 4.12 `notification_recipients`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| notification_id | BIGINT | FK → notifications.id, NOT NULL | |
| user_id | BIGINT | FK → users.id, NOT NULL | |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE | |
| read_at | DATETIME | NULLABLE | |
| UNIQUE | (notification_id, user_id) | | |

### 4.13 `chat_conversations`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| user_id | BIGINT | FK → users.id, NULLABLE | NULL = Guest |
| type | ENUM('CHATBOT','ASSISTANT') | NOT NULL | CHATBOT = Student/Guest, ASSISTANT = Admin |
| title | VARCHAR(255) | NULLABLE | AI-generated |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

### 4.14 `chat_messages`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| conversation_id | BIGINT | FK → chat_conversations.id, NOT NULL | |
| sequence_number | INT | NOT NULL | |
| question | TEXT | NOT NULL | |
| response | TEXT | NOT NULL | |
| created_at | DATETIME | NOT NULL | |
| UNIQUE | (conversation_id, sequence_number) | | |

### 4.15 `faqs`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| question | VARCHAR(500) | NOT NULL, UNIQUE | |
| answer | TEXT | NOT NULL | |
| category | VARCHAR(100) | NULLABLE | |
| tags | JSON | NULLABLE | Keywords for search |
| status | ENUM('VISIBLE','HIDDEN') | NOT NULL, DEFAULT 'VISIBLE' | |
| created_by | BIGINT | FK → users.id, NOT NULL | Admin |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

### 4.16 `audit_logs`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| actor_id | BIGINT | FK → users.id, NULLABLE | NULL = Guest action |
| action | ENUM('CREATE','UPDATE','DELETE','APPROVE','REJECT','PAYMENT','LOGIN','LOGOUT') | NOT NULL | |
| entity_type | VARCHAR(100) | NOT NULL | Tên bảng |
| entity_id | BIGINT | NULLABLE | ID bản ghi |
| old_value | JSON | NULLABLE | |
| new_value | JSON | NULLABLE | |
| ip_address | VARCHAR(45) | NULLABLE | IPv4 or IPv6 |
| user_agent | TEXT | NULLABLE | |
| created_at | DATETIME | NOT NULL | |

### 4.17 `system_settings`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| key | VARCHAR(100) | PK | |
| value | TEXT | NOT NULL | Có thể là JSON |
| description | TEXT | NULLABLE | |
| group | ENUM('CENTER_INFO','TUITION','EMAIL','SECURITY') | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

### 4.18 `password_reset_tokens`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| user_id | BIGINT | FK → users.id, NOT NULL | |
| token | VARCHAR(255) | UNIQUE, NOT NULL | |
| expires_at | DATETIME | NOT NULL | 15 phút |
| used_at | DATETIME | NULLABLE | |
| created_at | DATETIME | NOT NULL | |

### 4.19 `failed_login_attempts`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| email | VARCHAR(255) | NOT NULL, INDEXED | |
| ip_address | VARCHAR(45) | NOT NULL | |
| attempted_at | DATETIME | NOT NULL | |

### 4.20 `token_blacklist`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, auto-increment | |
| token | VARCHAR(500) | NOT NULL, INDEXED | JWT |
| expires_at | DATETIME | NOT NULL | Token expiry |
| created_at | DATETIME | NOT NULL | |

---

## 5. Entity vs Use Case Coverage Matrix

| Entity | UC-01 | UC-02 | UC-03 | UC-04 | UC-05 | UC-06 | UC-07 | UC-08 | UC-09 | UC-10 | UC-11 | UC-12 | UC-13 | UC-14 | UC-15 | UC-16 | UC-17 | UC-18 | UC-19 | UC-20 | UC-21 | UC-22 | UC-23 | UC-24 | UC-25 | UC-26 | UC-27 | UC-28 | UC-29 | UC-30 | UC-31 | UC-32 | UC-33 | UC-34 | UC-35 | UC-36 | UC-37 | UC-38 | UC-39 |
|--------|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|
| users | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
| student_profiles | | | | | | | ✓ | | | ✓ | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
| teacher_profiles | | | | | | | | ✓ | | | ✓ | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
| courses | | | | | | | | | ✓ | | | ✓ | ✓ | | | | | | | | | | | | | | | | | | ✓ | | | | | | | | |
| classes | | | | | | | | | | | | | | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | | ✓ | | | | | | | | | | | | | | | | |
| registrations | | | | | | | | | | | | | | | | | | | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | | | | | | | | | | |
| transactions | | | | | | | | | | | | | | | | | | | | | | | | | | ✓ | ✓ | ✓ | ✓ | | | | | | | | | | |
| attendance_sheets | | | | | | | | | | | | | | | | ✓ | | | | | | | | | | | | | | | | | | | | | | |
| attendance_records | | | | | | | | | | | | | | | | ✓ | | | | | | | | | | | | | | | | | | | | | | |
| scores | | | | | | | | | | | | | | | | | ✓ | | ✓ | | | | | | | | | | | | | | | | | | | | |
| notifications | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | ✓ | | | | ✓ | |
| notification_recipients | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | ✓ | | | | ✓ | |
| chat_conversations | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | ✓ | | ✓ | | | | | | |
| chat_messages | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | ✓ | | ✓ | | | | | | |
| faqs | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | ✓ | | | | | | |
| audit_logs | | | | | ✓ | | ✓ | ✓ | ✓ | | | | | ✓ | ✓ | | ✓ | | | | | | ✓ | ✓ | | ✓ | | | | | | | | ✓ | | | ✓ | | ✓ |
| system_settings | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | ✓ |
| password_reset_tokens | | | | ✓ | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
| failed_login_attempts | | ✓ | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
| token_blacklist | | | ✓ | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |

---

## 6. Review Checklist

### 6.1 Coverage Verification

| Câu hỏi | Trả lời |
|---------|---------|
| Mọi Use Case có dữ liệu để thực hiện? | ✓ Có. 39/39 UC được phủ bởi 20 entities. Bảng ma trận ở mục 5 thể hiện chi tiết. |
| Có entity dư không? | ✓ Không. Mỗi entity phục vụ ít nhất 1 UC. Các entity như `failed_login_attempts`, `token_blacklist`, `password_reset_tokens` là hỗ trợ cho authentication. |
| Có entity thiếu không? | ✓ Không. Tất cả nghiệp vụ từ SRS + 39 UC Specs đều có entity tương ứng. |
| Circular relationship bất hợp lý? | ✓ Không. Tất cả quan hệ đều là 1:N hoặc N:N qua bảng trung gian. Không có vòng lặp redundant. |

### 6.2 Design Decisions

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Student và Teacher là profiles, không phải users riêng | Profile riêng (1:1) | Dùng chung authentication qua users. Profile chứa thông tin mở rộng theo role. Giảm trùng lặp. |
| Class schedule nhúng trong classes | Thuộc tính trực tiếp | Mỗi lớp có lịch cố định một buổi/tuần. Không cần bảng schedule riêng (chưa có yêu cầu lịch phức tạp). |
| Attendance: tách sheet + record | 2 bảng riêng | Sheet quản lý phiên điểm danh (class_id, date). Record quản lý từng student. Chuẩn hóa 3NF. |
| Registration là bảng trung gian Student- Class | Registration riêng | Quản lý vòng đời đăng ký (Pending → Approved → Paid). Chứa thêm thông tin nghiệp vụ như tuition_at_registration, approved_by. |
| Không tạo bảng `class_students` riêng | Dùng `registrations` | Student thuộc lớp khi registration.status = PAID. Tránh trùng dữ liệu. |
| Transaction không lưu gateway data | Chỉ lưu nội bộ | Thanh toán thủ công qua QR. Không có gateway_transaction_id, signature, callback, v.v. |
| `failed_login_attempts` không có FK đến users | Lưu email dạng string | Guest chưa có tài khoản cũng có thể login sai. Cần track theo email. |

### 6.3 Lưu ý khi chuyển sang ERD

1. **Indexes cần tạo:** `registrations(student_id)`, `registrations(class_id)`, `registrations(status)`, `transactions(registration_id)`, `transactions(status)`, `attendance_sheets(class_id, date)`, `audit_logs(actor_id)`, `audit_logs(created_at)`
2. **ENUM vs lookup table:** Các trường hợp enum ổn định (role, status, level) dùng ENUM. Nếu có khả năng mở rộng (category, tags) dùng VARCHAR hoặc JSON.
3. **Soft delete policy:** `users`, `courses`, `classes` dùng status column. Không dùng `deleted_at`.
4. **Audit Log retention:** Logs > 12 tháng có thể archive. Cần có cột `created_at` để phân vùng.
5. **Chat history cho Guest:** `chat_conversations.user_id` nullable để hỗ trợ Guest chat.
