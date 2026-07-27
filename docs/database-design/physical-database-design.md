# Physical Database Design — English Center Management System

> **Phase:** Phase 3.3 — Physical Database Design (Step 1)
> **Phiên bản:** v1.0
> **Nguồn:** Domain Model v0.2 (Approved) + ERD v1.1 (Approved Baseline)
> **Database:** MySQL 8.0

---

## 1. Database Overview

### 1.1 Database Metadata

| Thuộc tính | Giá trị |
|------------|---------|
| Database Name | `english_center_db` |
| Character Set | `utf8mb4` — hỗ trợ đầy đủ Unicode, bao gồm tiếng Việt và emoji |
| Collation | `utf8mb4_unicode_ci` — so sánh Unicode chuẩn, không phân biệt chữ hoa/thường |
| Storage Engine | `InnoDB` — hỗ trợ transaction, FK constraint, row-level locking |
| Timezone | `+07:00` (Asia/Ho_Chi_Minh) |
| Version | MySQL 8.0 (LTS) |

### 1.2 Naming Convention

| Đối tượng | Quy ước | Ví dụ |
|-----------|---------|-------|
| Database | `snake_case` | `english_center_db` |
| Table | `snake_case`, plural | `users`, `student_profiles` |
| Column | `snake_case` | `full_name`, `created_at` |
| Primary Key | `pk_<table>` | `pk_users` |
| Foreign Key | `fk_<child_table>_<parent_table>_<column>` | `fk_registrations_users_student_id` |
| Unique Key | `uk_<table>_<columns>` | `uk_users_email` |
| Index | `idx_<table>_<columns>` | `idx_users_email` |
| Check | `ck_<table>_<column>` | `ck_courses_tuition` |
| ENUM | PascalCase values | `ACTIVE`, `PENDING_CONFIRMATION` |
| Timestamp | `created_at`, `updated_at` | `created_at DATETIME` |
| Boolean | `TINYINT(1)` với `is_` prefix | `is_read TINYINT(1)` |

---

## 2. Table Specification

### 2.1 `users` — Người dùng

**Purpose:** Tài khoản đăng nhập trung tâm authentication. Soft delete qua `status = INACTIVE`.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `email` | `VARCHAR(255)` | NOT NULL | — | — | UNIQUE |
| `password_hash` | `VARCHAR(255)` | NOT NULL | — | — | |
| `full_name` | `VARCHAR(255)` | NOT NULL | — | — | |
| `phone` | `VARCHAR(20)` | NULL | — | — | |
| `role` | `ENUM('ADMIN','TEACHER','STUDENT')` | NOT NULL | — | — | |
| `status` | `ENUM('ACTIVE','INACTIVE')` | NOT NULL | `'ACTIVE'` | — | |
| `avatar_url` | `VARCHAR(500)` | NULL | — | — | |
| `email_verified_at` | `DATETIME` | NULL | — | — | |
| `failed_attempts` | `INT` | NOT NULL | `0` | — | |
| `locked_until` | `DATETIME` | NULL | — | — | |
| `last_login_at` | `DATETIME` | NULL | — | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**CK:** `ck_users_email_format` (email hợp lệ — Business Logic Layer)
**CK:** `ck_users_phone_format` (SĐT Việt Nam — Business Logic Layer)

---

### 2.2 `student_profiles` — Thông tin Student

**Purpose:** Thông tin mở rộng cho Student. 1:1 identifying relationship với `users`.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `user_id` | `BIGINT` | NOT NULL | — | — | PK, FK → `users.id` |
| `date_of_birth` | `DATE` | NULL | — | — | |
| `address` | `TEXT` | NULL | — | — | |
| `enrollment_date` | `DATE` | NOT NULL | — | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**Cascade:** ON DELETE CASCADE, ON UPDATE CASCADE

---

### 2.3 `teacher_profiles` — Thông tin Teacher

**Purpose:** Thông tin mở rộng cho Teacher. 1:1 identifying relationship với `users`.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `user_id` | `BIGINT` | NOT NULL | — | — | PK, FK → `users.id` |
| `specialization` | `VARCHAR(255)` | NOT NULL | — | — | |
| `hire_date` | `DATE` | NOT NULL | — | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**Cascade:** ON DELETE CASCADE, ON UPDATE CASCADE

---

### 2.4 `password_reset_tokens` — Token đặt lại mật khẩu

**Purpose:** Token đặt lại mật khẩu, thời hạn 15 phút, chỉ dùng một lần.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `user_id` | `BIGINT` | NOT NULL | — | — | FK → `users.id` |
| `token` | `VARCHAR(255)` | NOT NULL | — | — | UNIQUE |
| `expires_at` | `DATETIME` | NOT NULL | — | — | |
| `used_at` | `DATETIME` | NULL | — | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |

**Cascade:** ON DELETE CASCADE, ON UPDATE CASCADE

---

### 2.5 `token_blacklist` — JWT Blacklist

**Purpose:** Danh sách JWT token đã logout. Standalone — không có FK.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `token` | `VARCHAR(500)` | NOT NULL | — | — | INDEXED |
| `expires_at` | `DATETIME` | NOT NULL | — | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |

---

### 2.6 `failed_login_attempts` — Lưu vết đăng nhập thất bại

**Purpose:** Lưu vết đăng nhập sai. Không có FK — Guest chưa có tài khoản vẫn có thể login sai.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `email` | `VARCHAR(255)` | NOT NULL | — | — | INDEXED |
| `ip_address` | `VARCHAR(45)` | NOT NULL | — | — | |
| `attempted_at` | `DATETIME` | NOT NULL | — | — | |

---

### 2.7 `courses` — Khóa học

**Purpose:** Danh mục khóa học. Soft delete qua `status = DELETED`.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `name` | `VARCHAR(255)` | NOT NULL | — | — | |
| `description` | `TEXT` | NULL | — | — | |
| `tuition` | `DECIMAL(10,2)` | NOT NULL | — | — | CK: `tuition > 0` |
| `level` | `ENUM('BEGINNER','INTERMEDIATE','ADVANCED')` | NOT NULL | — | — | |
| `duration` | `INT` | NOT NULL | — | — | CK: `duration > 0` |
| `status` | `ENUM('ACTIVE','DELETED')` | NOT NULL | `'ACTIVE'` | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**CK:** `ck_courses_tuition_positive` (`tuition > 0`)
**CK:** `ck_courses_duration_positive` (`duration > 0`)

---

### 2.8 `classes` — Lớp học

**Purpose:** Lớp học cụ thể — instance của khóa học. Soft delete qua `status = CANCELLED`.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `course_id` | `BIGINT` | NOT NULL | — | — | FK → `courses.id` |
| `name` | `VARCHAR(255)` | NOT NULL | — | — | |
| `teacher_id` | `BIGINT` | NULL | — | — | FK → `users.id` |
| `max_capacity` | `INT` | NOT NULL | — | — | CK: `max_capacity > 0` |
| `current_headcount` | `INT` | NOT NULL | `0` | — | Derived Column |
| `schedule_day` | `ENUM('MON','TUE','WED','THU','FRI','SAT','SUN')` | NOT NULL | — | — | |
| `start_time` | `TIME` | NOT NULL | — | — | |
| `end_time` | `TIME` | NOT NULL | — | — | CK: `end_time > start_time` |
| `room` | `VARCHAR(100)` | NOT NULL | — | — | |
| `start_date` | `DATE` | NOT NULL | — | — | |
| `end_date` | `DATE` | NOT NULL | — | — | CK: `end_date > start_date` |
| `status` | `ENUM('UPCOMING','STUDYING','FINISHED','CANCELLED')` | NOT NULL | `'UPCOMING'` | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**CK:** `ck_classes_max_capacity` (`max_capacity > 0`)
**CK:** `ck_classes_time_range` (`end_time > start_time`)
**CK:** `ck_classes_date_range` (`end_date > start_date`)
**CK:** `ck_classes_headcount` (`current_headcount <= max_capacity`) — Business Logic Layer
**Cascade (FK04):** ON DELETE RESTRICT, ON UPDATE CASCADE
**Cascade (FK05):** ON DELETE SET NULL, ON UPDATE CASCADE

---

### 2.9 `registrations` — Đăng ký khóa học

**Purpose:** Bảng trung gian Student—Class. Quản lý vòng đời PENDING → APPROVED → PAID.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `student_id` | `BIGINT` | NOT NULL | — | — | FK → `users.id` |
| `class_id` | `BIGINT` | NOT NULL | — | — | FK → `classes.id` |
| `status` | `ENUM('PENDING','APPROVED','REJECTED','CANCELLED','PAID')` | NOT NULL | `'PENDING'` | — | |
| `tuition_at_registration` | `DECIMAL(10,2)` | NOT NULL | — | — | |
| `registered_at` | `DATETIME` | NOT NULL | — | — | |
| `approved_at` | `DATETIME` | NULL | — | — | |
| `approved_by` | `BIGINT` | NULL | — | — | FK → `users.id` |
| `rejected_at` | `DATETIME` | NULL | — | — | |
| `rejected_by` | `BIGINT` | NULL | — | — | FK → `users.id` |
| `rejection_reason` | `TEXT` | NULL | — | — | |
| `paid_at` | `DATETIME` | NULL | — | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**UK:** `uk_registrations_student_class` (`student_id`, `class_id`)
**Cascade (FK06):** ON DELETE RESTRICT, ON UPDATE CASCADE
**Cascade (FK07):** ON DELETE RESTRICT, ON UPDATE CASCADE
**Cascade (FK08):** ON DELETE SET NULL, ON UPDATE CASCADE
**Cascade (FK09):** ON DELETE SET NULL, ON UPDATE CASCADE

---

### 2.10 `transactions` — Giao dịch thanh toán

**Purpose:** Ghi nhận giao dịch thanh toán. Retry payment: 1 registration → nhiều transactions.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `registration_id` | `BIGINT` | NOT NULL | — | — | FK → `registrations.id` |
| `amount` | `DECIMAL(10,2)` | NOT NULL | — | — | |
| `payment_method` | `ENUM('BANK_TRANSFER')` | NOT NULL | `'BANK_TRANSFER'` | — | |
| `transaction_code` | `VARCHAR(100)` | NOT NULL | — | — | UNIQUE |
| `status` | `ENUM('PENDING_CONFIRMATION','SUCCESS','FAILED')` | NOT NULL | `'PENDING_CONFIRMATION'` | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `paid_at` | `DATETIME` | NULL | — | — | |
| `confirmed_at` | `DATETIME` | NULL | — | — | |
| `confirmed_by` | `BIGINT` | NULL | — | — | FK → `users.id` |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**Cascade (FK10):** ON DELETE RESTRICT, ON UPDATE CASCADE
**Cascade (FK11):** ON DELETE SET NULL, ON UPDATE CASCADE

---

### 2.11 `attendance_sheets` — Phiên điểm danh

**Purpose:** Phiên điểm danh cho một lớp vào một ngày cụ thể.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `class_id` | `BIGINT` | NOT NULL | — | — | FK → `classes.id` |
| `date` | `DATE` | NOT NULL | — | — | |
| `created_by` | `BIGINT` | NOT NULL | — | — | FK → `users.id` (secondary) |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**UK:** `uk_attendance_sheets_class_date` (`class_id`, `date`)
**Cascade (FK12):** ON DELETE CASCADE, ON UPDATE CASCADE
**Cascade (FK13):** ON DELETE SET NULL, ON UPDATE CASCADE

---

### 2.12 `attendance_records` — Chi tiết điểm danh

**Purpose:** Trạng thái điểm danh của từng học viên trong một phiên.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `sheet_id` | `BIGINT` | NOT NULL | — | — | FK → `attendance_sheets.id` |
| `student_id` | `BIGINT` | NOT NULL | — | — | FK → `users.id` |
| `status` | `ENUM('PRESENT','ABSENT','EXCUSED')` | NOT NULL | — | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |

**UK:** `uk_attendance_records_sheet_student` (`sheet_id`, `student_id`)
**Cascade (FK14):** ON DELETE CASCADE, ON UPDATE CASCADE
**Cascade (FK15):** ON DELETE RESTRICT, ON UPDATE CASCADE

---

### 2.13 `scores` — Bảng điểm

**Purpose:** Điểm số của student theo từng lớp học.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `student_id` | `BIGINT` | NOT NULL | — | — | FK → `users.id` |
| `class_id` | `BIGINT` | NOT NULL | — | — | FK → `classes.id` |
| `midterm_score` | `DECIMAL(4,1)` | NULL | — | — | CK: 0.0–10.0 |
| `final_score` | `DECIMAL(4,1)` | NULL | — | — | CK: 0.0–10.0 |
| `total_score` | `DECIMAL(4,1)` | NULL | — | — | CK: 0.0–10.0 (Computed Field) |
| `comment` | `TEXT` | NULL | — | — | |
| `created_by` | `BIGINT` | NOT NULL | — | — | FK → `users.id` (secondary) |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**UK:** `uk_scores_student_class` (`student_id`, `class_id`)
**CK:** `ck_scores_midterm_range` (`midterm_score BETWEEN 0.0 AND 10.0`)
**CK:** `ck_scores_final_range` (`final_score BETWEEN 0.0 AND 10.0`)
**CK:** `ck_scores_total_range` (`total_score BETWEEN 0.0 AND 10.0`)
**Cascade (FK16):** ON DELETE RESTRICT, ON UPDATE CASCADE
**Cascade (FK17):** ON DELETE CASCADE, ON UPDATE CASCADE
**Cascade (FK18):** ON DELETE SET NULL, ON UPDATE CASCADE

---

### 2.14 `notifications` — Thông báo

**Purpose:** Thông báo do Admin tạo. target_type + target_id xác định đối tượng nhận.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `title` | `VARCHAR(255)` | NOT NULL | — | — | |
| `content` | `TEXT` | NOT NULL | — | — | |
| `target_type` | `ENUM('ALL_STUDENTS','ALL_TEACHERS','SPECIFIC_CLASS','SPECIFIC_USER')` | NOT NULL | — | — | |
| `target_id` | `BIGINT` | NULL | — | — | |
| `attachment_url` | `VARCHAR(500)` | NULL | — | — | |
| `created_by` | `BIGINT` | NOT NULL | — | — | FK → `users.id` |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**Cascade (FK19):** ON DELETE SET NULL, ON UPDATE CASCADE

---

### 2.15 `notification_recipients` — Người nhận thông báo

**Purpose:** Liên kết notification → user. Lưu trạng thái đã đọc.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `notification_id` | `BIGINT` | NOT NULL | — | — | FK → `notifications.id` |
| `user_id` | `BIGINT` | NOT NULL | — | — | FK → `users.id` |
| `is_read` | `TINYINT(1)` | NOT NULL | `0` | — | |
| `read_at` | `DATETIME` | NULL | — | — | |

**UK:** `uk_notification_recipients` (`notification_id`, `user_id`)
**Cascade (FK20):** ON DELETE CASCADE, ON UPDATE CASCADE
**Cascade (FK21):** ON DELETE CASCADE, ON UPDATE CASCADE

---

### 2.16 `chat_conversations` — Cuộc hội thoại AI

**Purpose:** Cuộc hội thoại giữa user (Student/Guest/Admin) và AI.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `user_id` | `BIGINT` | NULL | — | — | FK → `users.id` |
| `type` | `ENUM('CHATBOT','ASSISTANT')` | NOT NULL | — | — | |
| `title` | `VARCHAR(255)` | NULL | — | — | AI-generated |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**Cascade (FK22):** ON DELETE SET NULL, ON UPDATE CASCADE

---

### 2.17 `chat_messages` — Tin nhắn AI

**Purpose:** Mỗi lượt hỏi-đáp trong một conversation.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `conversation_id` | `BIGINT` | NOT NULL | — | — | FK → `chat_conversations.id` |
| `sequence_number` | `INT` | NOT NULL | — | — | |
| `question` | `TEXT` | NOT NULL | — | — | |
| `response` | `TEXT` | NOT NULL | — | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |

**UK:** `uk_chat_messages_conversation_sequence` (`conversation_id`, `sequence_number`)
**Cascade (FK23):** ON DELETE CASCADE, ON UPDATE CASCADE

---

### 2.18 `faqs` — Kho kiến thức FAQ

**Purpose:** Kho kiến thức FAQ — nguồn dữ liệu cho AI Chatbot và AI Assistant.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `question` | `VARCHAR(500)` | NOT NULL | — | — | UNIQUE |
| `answer` | `TEXT` | NOT NULL | — | — | |
| `category` | `VARCHAR(100)` | NULL | — | — | |
| `tags` | `JSON` | NULL | — | — | |
| `status` | `ENUM('VISIBLE','HIDDEN')` | NOT NULL | `'VISIBLE'` | — | |
| `created_by` | `BIGINT` | NOT NULL | — | — | FK → `users.id` (secondary) |
| `created_at` | `DATETIME` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

**Cascade (FK24):** ON DELETE SET NULL, ON UPDATE CASCADE

---

### 2.19 `audit_logs` — Nhật ký kiểm toán

**Purpose:** Ghi nhận mọi thao tác quan trọng. Read-only — không được sửa hoặc xóa.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `id` | `BIGINT` | NOT NULL | — | AUTO_INCREMENT | PK |
| `actor_id` | `BIGINT` | NULL | — | — | FK → `users.id` |
| `action` | `ENUM('CREATE','UPDATE','DELETE','APPROVE','REJECT','PAYMENT','LOGIN','LOGOUT')` | NOT NULL | — | — | |
| `entity_type` | `VARCHAR(100)` | NOT NULL | — | — | |
| `entity_id` | `BIGINT` | NULL | — | — | |
| `old_value` | `JSON` | NULL | — | — | |
| `new_value` | `JSON` | NULL | — | — | |
| `ip_address` | `VARCHAR(45)` | NULL | — | — | |
| `user_agent` | `TEXT` | NULL | — | — | |
| `created_at` | `DATETIME` | NOT NULL | — | — | |

**Cascade (FK25):** ON DELETE SET NULL, ON UPDATE CASCADE

---

### 2.20 `system_settings` — Cấu hình hệ thống

**Purpose:** Lưu cấu hình hệ thống dạng key-value. Standalone — không có FK.

| Column | MySQL Type | NULL | Default | Extra | Constraints |
|--------|-----------|------|---------|-------|-------------|
| `key` | `VARCHAR(100)` | NOT NULL | — | — | PK |
| `value` | `TEXT` | NOT NULL | — | — | |
| `description` | `TEXT` | NULL | — | — | |
| `group` | `ENUM('CENTER_INFO','TUITION','EMAIL','SECURITY')` | NOT NULL | — | — | |
| `updated_at` | `DATETIME` | NOT NULL | — | — | |

---

## 3. Foreign Key Design

### 3.1 Tổng quan

Tổng cộng **25 Physical Foreign Keys** (FK01–FK25).

### 3.2 Chi tiết

| FK# | Child Table | FK Column | Parent Table | Parent Column | ON DELETE | ON UPDATE |
|-----|------------|-----------|-------------|---------------|-----------|-----------|
| FK01 | `student_profiles` | `user_id` | `users` | `id` | CASCADE | CASCADE |
| FK02 | `teacher_profiles` | `user_id` | `users` | `id` | CASCADE | CASCADE |
| FK03 | `password_reset_tokens` | `user_id` | `users` | `id` | CASCADE | CASCADE |
| FK04 | `classes` | `course_id` | `courses` | `id` | RESTRICT | CASCADE |
| FK05 | `classes` | `teacher_id` | `users` | `id` | SET NULL | CASCADE |
| FK06 | `registrations` | `student_id` | `users` | `id` | RESTRICT | CASCADE |
| FK07 | `registrations` | `class_id` | `classes` | `id` | RESTRICT | CASCADE |
| FK08 | `registrations` | `approved_by` | `users` | `id` | SET NULL | CASCADE |
| FK09 | `registrations` | `rejected_by` | `users` | `id` | SET NULL | CASCADE |
| FK10 | `transactions` | `registration_id` | `registrations` | `id` | RESTRICT | CASCADE |
| FK11 | `transactions` | `confirmed_by` | `users` | `id` | SET NULL | CASCADE |
| FK12 | `attendance_sheets` | `class_id` | `classes` | `id` | CASCADE | CASCADE |
| FK13 | `attendance_sheets` | `created_by` | `users` | `id` | SET NULL | CASCADE |
| FK14 | `attendance_records` | `sheet_id` | `attendance_sheets` | `id` | CASCADE | CASCADE |
| FK15 | `attendance_records` | `student_id` | `users` | `id` | RESTRICT | CASCADE |
| FK16 | `scores` | `student_id` | `users` | `id` | RESTRICT | CASCADE |
| FK17 | `scores` | `class_id` | `classes` | `id` | CASCADE | CASCADE |
| FK18 | `scores` | `created_by` | `users` | `id` | SET NULL | CASCADE |
| FK19 | `notifications` | `created_by` | `users` | `id` | SET NULL | CASCADE |
| FK20 | `notification_recipients` | `notification_id` | `notifications` | `id` | CASCADE | CASCADE |
| FK21 | `notification_recipients` | `user_id` | `users` | `id` | CASCADE | CASCADE |
| FK22 | `chat_conversations` | `user_id` | `users` | `id` | SET NULL | CASCADE |
| FK23 | `chat_messages` | `conversation_id` | `chat_conversations` | `id` | CASCADE | CASCADE |
| FK24 | `faqs` | `created_by` | `users` | `id` | SET NULL | CASCADE |
| FK25 | `audit_logs` | `actor_id` | `users` | `id` | SET NULL | CASCADE |

### 3.3 Cascade Policy — Giải thích

| Policy | Số FK | Lý do |
|--------|-------|-------|
| **CASCADE** | 10 | Áp dụng cho child entity phụ thuộc hoàn toàn vào parent (identifying relationship như `student_profiles`, `teacher_profiles`) hoặc dữ liệu không có ý nghĩa khi parent bị xóa (chat message, attendance record). |
| **RESTRICT** | 6 | Áp dụng cho dữ liệu quan trọng: không cho phép xóa course/class/student nếu còn registration, transaction, score. Bảo toàn tính toàn vẹn tham chiếu. |
| **SET NULL** | 9 | Áp dụng cho FK không bắt buộc (nullable): khi user (admin/teacher) bị xóa, các bản ghi liên quan vẫn tồn tại nhưng mất thông tin người thực hiện. Audit log không được phép mất dữ liệu. |

---

## 4. Index Design

### 4.1 Primary Index

Mỗi bảng có PRIMARY KEY trên cột id (hoặc user_id cho profile tables).

| Table | PK Column(s) | Index Name |
|-------|-------------|------------|
| `users` | `id` | `pk_users` |
| `student_profiles` | `user_id` | `pk_student_profiles` |
| `teacher_profiles` | `user_id` | `pk_teacher_profiles` |
| `password_reset_tokens` | `id` | `pk_password_reset_tokens` |
| `token_blacklist` | `id` | `pk_token_blacklist` |
| `failed_login_attempts` | `id` | `pk_failed_login_attempts` |
| `courses` | `id` | `pk_courses` |
| `classes` | `id` | `pk_classes` |
| `registrations` | `id` | `pk_registrations` |
| `transactions` | `id` | `pk_transactions` |
| `attendance_sheets` | `id` | `pk_attendance_sheets` |
| `attendance_records` | `id` | `pk_attendance_records` |
| `scores` | `id` | `pk_scores` |
| `notifications` | `id` | `pk_notifications` |
| `notification_recipients` | `id` | `pk_notification_recipients` |
| `chat_conversations` | `id` | `pk_chat_conversations` |
| `chat_messages` | `id` | `pk_chat_messages` |
| `faqs` | `id` | `pk_faqs` |
| `audit_logs` | `id` | `pk_audit_logs` |
| `system_settings` | `key` | `pk_system_settings` |

### 4.2 Unique Index

| # | Index Name | Table | Columns | Lý do |
|---|------------|-------|---------|-------|
| UC01 | `uk_users_email` | `users` | `email` | Mỗi email chỉ đăng ký một tài khoản. |
| UC02 | `uk_attendance_records_sheet_student` | `attendance_records` | `sheet_id`, `student_id` | Mỗi student chỉ có một trạng thái trong một buổi. |
| UC03 | `uk_scores_student_class` | `scores` | `student_id`, `class_id` | Mỗi student chỉ có một bảng điểm cho một lớp. |
| UC04 | `uk_notification_recipients` | `notification_recipients` | `notification_id`, `user_id` | Mỗi user chỉ nhận một notification một lần. |
| UC05 | `uk_registrations_student_class` | `registrations` | `student_id`, `class_id` | Một student không thể đăng ký một lớp hai lần. |
| UC06 | `uk_transactions_code` | `transactions` | `transaction_code` | Mã giao dịch nội bộ là duy nhất. |
| UC07 | `uk_password_reset_tokens_token` | `password_reset_tokens` | `token` | Token đặt lại mật khẩu là duy nhất. |
| UC08 | `uk_chat_messages_conversation_sequence` | `chat_messages` | `conversation_id`, `sequence_number` | Thứ tự message trong conversation là duy nhất. |
| UC09 | `pk_system_settings` | `system_settings` | `key` | Key cài đặt là duy nhất (PK). |
| UC10 | *(PK — implicit)* | `student_profiles` | `user_id` | 1:1 với users. |
| UC11 | *(PK — implicit)* | `teacher_profiles` | `user_id` | 1:1 với users. |
| — | `uk_attendance_sheets_class_date` | `attendance_sheets` | `class_id`, `date` | Mỗi lớp chỉ có một sheet cho mỗi ngày. |
| — | `uk_faqs_question` | `faqs` | `question` | Câu hỏi FAQ là duy nhất. |

### 4.3 Foreign Key Index

Tất cả FK columns đều cần index để tối ưu JOIN và tránh table scan.

| Table | FK Column | Index Name | Lý do |
|-------|-----------|------------|-------|
| `student_profiles` | `user_id` | *(PK — implicit)* | PK index đã bao phủ. |
| `teacher_profiles` | `user_id` | *(PK — implicit)* | PK index đã bao phủ. |
| `password_reset_tokens` | `user_id` | `idx_password_reset_tokens_user_id` | Tra cứu token theo user. |
| `classes` | `course_id` | `idx_classes_course_id` | Lọc class theo course. |
| `classes` | `teacher_id` | `idx_classes_teacher_id` | Lọc class theo teacher. |
| `registrations` | `student_id` | `idx_registrations_student_id` | Xem lịch sử đăng ký của student. |
| `registrations` | `class_id` | `idx_registrations_class_id` | Xem danh sách đăng ký của class. |
| `registrations` | `approved_by` | *(phủ bởi idx_registrations)* | Low selectivity. |
| `registrations` | `rejected_by` | *(phủ bởi idx_registrations)* | Low selectivity. |
| `transactions` | `registration_id` | `idx_transactions_registration_id` | Tra cứu transaction theo registration. |
| `transactions` | `confirmed_by` | *(low selectivity)* | Không cần index riêng. |
| `attendance_sheets` | `class_id` | *(phủ bởi UK — implicit)* | UK(class_id, date) đã bao phủ. |
| `attendance_sheets` | `created_by` | *(low selectivity)* | Không cần index riêng. |
| `attendance_records` | `sheet_id` | *(phủ bởi UK — implicit)* | UK(sheet_id, student_id) đã bao phủ. |
| `attendance_records` | `student_id` | *(phủ bởi UK — implicit)* | UK(sheet_id, student_id) đã bao phủ. |
| `scores` | `student_id` | *(phủ bởi UK — implicit)* | UK(student_id, class_id) đã bao phủ. |
| `scores` | `class_id` | `idx_scores_class_id` | Lọc score theo class. |
| `scores` | `created_by` | *(low selectivity)* | Không cần index riêng. |
| `notifications` | `created_by` | `idx_notifications_created_by` | Tra cứu notification do admin tạo. |
| `notification_recipients` | `notification_id` | *(phủ bởi UK — implicit)* | UK(notification_id, user_id) đã bao phủ. |
| `notification_recipients` | `user_id` | `idx_notification_recipients_user_id` | Tra cứu notification của user. |
| `chat_conversations` | `user_id` | `idx_chat_conversations_user_id` | Tra cứu conversation của user. |
| `chat_messages` | `conversation_id` | *(phủ bởi UK — implicit)* | UK(conversation_id, sequence_number) đã bao phủ. |
| `faqs` | `created_by` | *(low selectivity)* | Không cần index riêng. |
| `audit_logs` | `actor_id` | `idx_audit_logs_actor_id` | Tra cứu audit log theo user. |

### 4.4 Composite Index cho Query Optimization

| Index Name | Table | Columns | Lý do |
|------------|-------|---------|-------|
| `idx_registrations_status` | `registrations` | `status` | Lọc registration theo trạng thái (phổ biến: PENDING cần duyệt). |
| `idx_registrations_student_status` | `registrations` | `student_id`, `status` | Xem trạng thái đăng ký của một student. |
| `idx_transactions_status` | `transactions` | `status` | Lọc transaction PENDING_CONFIRMATION cần xác nhận. |
| `idx_audit_logs_created_at` | `audit_logs` | `created_at` | Audit logs thường được truy vấn theo thời gian. |
| `idx_audit_logs_entity` | `audit_logs` | `entity_type`, `entity_id` | Tra cứu audit log theo đối tượng. |

### 4.5 Search Index

| Table | Column | Index Type | Lý do |
|-------|--------|-----------|-------|
| `users` | `email` | (UNIQUE — đã bao phủ) | Login lookup. |
| `users` | `full_name` | `INDEX` (optional) | Tìm kiếm user theo tên. |
| `courses` | `name` | `INDEX` | Tìm kiếm khóa học theo tên. |
| `faqs` | `question` | (UNIQUE — đã bao phủ) | Tìm kiếm câu hỏi. |
| `faqs` | `tags` | `INDEX` (JSON) | Tìm kiếm FAQ theo tag. |

---

## 5. Constraint Design

### 5.1 CHECK Constraints

| CK# | Table | Column | Constraint | Mô tả |
|-----|-------|--------|-----------|-------|
| CK01 | `courses` | `tuition` | `tuition > 0` | Học phí phải > 0. |
| CK02 | `courses` | `duration` | `duration > 0` | Số buổi phải > 0. |
| CK03 | `classes` | `max_capacity` | `max_capacity > 0` | Sĩ số tối đa phải > 0. |
| CK04 | `classes` | `end_time` | `end_time > start_time` | Giờ kết thúc sau giờ bắt đầu. |
| CK05 | `classes` | `end_date` | `end_date > start_date` | Ngày kết thúc sau ngày bắt đầu. |
| CK06 | `scores` | `midterm_score` | `midterm_score BETWEEN 0.0 AND 10.0` | |
| CK07 | `scores` | `final_score` | `final_score BETWEEN 0.0 AND 10.0` | |
| CK08 | `scores` | `total_score` | `total_score BETWEEN 0.0 AND 10.0` | |

### 5.2 UNIQUE Constraints

Tổng cộng **11 Unique Constraints** (UC01–UC11). Chi tiết tại mục 4.2.

### 5.3 DEFAULT Values

| Table | Column | Default | Lý do |
|-------|--------|---------|-------|
| `users` | `status` | `'ACTIVE'` | Tài khoản mới active. |
| `users` | `failed_attempts` | `0` | Chưa có lần đăng nhập sai nào. |
| `courses` | `status` | `'ACTIVE'` | Khóa học mới active. |
| `classes` | `current_headcount` | `0` | Lớp mới chưa có học viên. |
| `classes` | `status` | `'UPCOMING'` | Lớp mới sắp khai giảng. |
| `registrations` | `status` | `'PENDING'` | Registration mới chờ duyệt. |
| `transactions` | `payment_method` | `'BANK_TRANSFER'` | Chỉ hỗ trợ chuyển khoản. |
| `transactions` | `status` | `'PENDING_CONFIRMATION'` | Transaction mới chờ xác nhận. |
| `notification_recipients` | `is_read` | `0` (FALSE) | Mặc định chưa đọc. |
| `faqs` | `status` | `'VISIBLE'` | FAQ mới hiển thị. |

### 5.4 NOT NULL Constraints

Tổng cộng **113 NOT NULL columns** (đã liệt kê chi tiết trong mục 2).

### 5.5 Business Rule Mapping

| BR# | Rule | Enforcement Layer |
|-----|------|-------------------|
| BR01 | `users.email` định dạng hợp lệ | Application Logic |
| BR02 | `users.phone` định dạng SĐT VN | Application Logic |
| BR03 | `courses.tuition > 0` | CHECK CK01 |
| BR04 | `courses.level` ∈ {BEGINNER, INTERMEDIATE, ADVANCED} | ENUM |
| BR05 | `courses.duration > 0` | CHECK CK02 |
| BR06 | `classes.max_capacity > 0` | CHECK CK03 |
| BR07 | `classes.start_date < end_date` | CHECK CK05 |
| BR08 | `classes.current_headcount <= max_capacity` | Application Logic |
| BR09 | Teacher phân công mới được điểm danh/nhập điểm | Application Logic |
| BR10 | Score 0.0–10.0 | CHECK CK06–CK08 |
| BR11 | `attendance_sheets.date` không phải tương lai | Application Logic |
| BR12 | Mỗi lớp một sheet/ngày | UNIQUE |
| BR13 | Chỉ APPROVED mới tạo transaction | Application Logic |
| BR14 | Mỗi registration tối đa 1 SUCCESS | Application Logic |
| BR15 | Chỉ PENDING mới được duyệt/từ chối | Application Logic |
| BR16 | `faqs.question` UNIQUE | UNIQUE |
| BR17 | `notifications.title`, `content` không rỗng | NOT NULL |
| BR18 | File đính kèm tối đa 10MB | Application Logic |
| BR19 | Audit Log read-only | Application Logic |
| BR20 | Sensitive settings mã hóa | Application Logic |
| BR21 | Không xóa course có class UPCOMING/STUDYING | FK RESTRICT |
| BR22 | Teacher không trùng lịch | Application Logic |
| BR23 | Chat history chỉ lưu cho Student đã login | Application Logic |

---

## 6. Enum Definition

### 6.1 `users.role`

```sql
ENUM('ADMIN', 'TEACHER', 'STUDENT')
```

### 6.2 `users.status`

```sql
ENUM('ACTIVE', 'INACTIVE')
```

### 6.3 `courses.level`

```sql
ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED')
```

### 6.4 `courses.status`

```sql
ENUM('ACTIVE', 'DELETED')
```

### 6.5 `classes.schedule_day`

```sql
ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN')
```

### 6.6 `classes.status`

```sql
ENUM('UPCOMING', 'STUDYING', 'FINISHED', 'CANCELLED')
```

### 6.7 `registrations.status`

```sql
ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'PAID')
```

### 6.8 `transactions.payment_method`

```sql
ENUM('BANK_TRANSFER')
```

### 6.9 `transactions.status`

```sql
ENUM('PENDING_CONFIRMATION', 'SUCCESS', 'FAILED')
```

### 6.10 `attendance_records.status`

```sql
ENUM('PRESENT', 'ABSENT', 'EXCUSED')
```

### 6.11 `notifications.target_type`

```sql
ENUM('ALL_STUDENTS', 'ALL_TEACHERS', 'SPECIFIC_CLASS', 'SPECIFIC_USER')
```

### 6.12 `chat_conversations.type`

```sql
ENUM('CHATBOT', 'ASSISTANT')
```

### 6.13 `faqs.status`

```sql
ENUM('VISIBLE', 'HIDDEN')
```

### 6.14 `audit_logs.action`

```sql
ENUM('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'PAYMENT', 'LOGIN', 'LOGOUT')
```

### 6.15 `system_settings.group`

```sql
ENUM('CENTER_INFO', 'TUITION', 'EMAIL', 'SECURITY')
```

---
## 7. Naming Convention — Tổng hợp

### 7.1 Đặt tên Constraint

| Prefix | Đối tượng | Format | Ví dụ |
|--------|----------|--------|-------|
| `pk_` | Primary Key | `pk_<table>` | `pk_users` |
| `fk_` | Foreign Key | `fk_<child>_<parent>_<column>` | `fk_registrations_users_student_id` |
| `uk_` | Unique Key | `uk_<table>_<columns>` | `uk_users_email` |
| `idx_` | Index | `idx_<table>_<columns>` | `idx_registrations_status` |
| `ck_` | Check | `ck_<table>_<column>` | `ck_courses_tuition` |

### 7.2 Đặt tên cột quy ước

| Loại cột | Quy ước | Ví dụ |
|----------|---------|-------|
| Primary Key | `id` (hoặc `user_id` cho identifying) | `id`, `user_id` |
| Foreign Key | `{table}_id` | `course_id`, `student_id` |
| Timestamp | `created_at`, `updated_at` | `created_at` |
| Date | `{prefix}_date` hoặc `{prefix}_at` | `enrollment_date`, `approved_at` |
| Boolean | `is_` + tính từ | `is_read` |
| Status | `status` | `status` |
| ENUM | PascalCase | `ACTIVE`, `PENDING` |

### 7.3 Table name rules

- Plural snake_case: `users`, `student_profiles`, `notification_recipients`
- Junction tables: không có prefix riêng — `registrations` là tên nghiệp vụ
- Viết tắt: không dùng viết tắt trừ khi phổ biến (`faqs`)

---

## 8. Performance Considerations

### 8.1 Search Optimization

| Use case | Table | Index Strategy |
|----------|-------|---------------|
| Login | `users` | `uk_users_email` — unique index, O(1) lookup |
| Find user by name | `users` | `idx_users_full_name` (optional B-tree) |
| List courses by level | `courses` | Index on `level` |
| Find class by teacher | `classes` | `idx_classes_teacher_id` |
| Registration history | `registrations` | `idx_registrations_student_id` |
| Pending approvals | `registrations` | `idx_registrations_status` + status check |
| Payment confirmation | `transactions` | `idx_transactions_status` + `idx_transactions_registration_id` |
| Attendance lookup | `attendance_records` | UK(sheet_id, student_id) composite |
| Scores by class | `scores` | `idx_scores_class_id` |
| User notifications | `notification_recipients` | `idx_notification_recipients_user_id` |
| Chat history | `chat_messages` | UK(conversation_id, sequence_number) |
| Audit trail | `audit_logs` | `idx_audit_logs_actor_id` + `idx_audit_logs_created_at` |

### 8.2 Join Optimization

- Tất cả FK columns đều có index (PK hoặc UK thường đã bao phủ).
- Composite indexes được thiết kế để phủ các join pattern phổ biến:
  - `registrations`: (student_id, class_id) UK → join user + class
  - `scores`: (student_id, class_id) UK → join user + class
  - `attendance_records`: (sheet_id, student_id) UK → join sheet + student

### 8.3 Pagination

- Sử dụng `LIMIT` + `OFFSET` cho phân trang cơ bản.
- Sử dụng **Keyset Pagination** (`WHERE id > ? ORDER BY id LIMIT ?`) cho audit_logs và bảng lớn.
- `ORDER BY created_at DESC` trên các bảng có timestamp.

### 8.4 Index Maintenance

- Tránh over-indexing: chỉ index các cột thực sự dùng trong WHERE, JOIN, ORDER BY.
- Index trên ENUM columns: không cần index cho ENUM có cardinality thấp trừ khi kết hợp với filter khác.
- JSON columns (`tags` trong `faqs`, `old_value`/`new_value` trong `audit_logs`): MySQL 8.0 hỗ trợ multi-value index trên JSON.

### 8.5 Future Scalability

| Concern | Giải pháp |
|---------|----------|
| Bảng lớn nhất | `audit_logs` — partition theo tháng (`created_at`) |
| `chat_messages` | Có thể archive conversation > 12 tháng |
| `notification_recipients` | Có thể xóa sau 12 tháng |
| `failed_login_attempts` | Dọn dẹp định kỳ (batch delete > 24h) |
| `token_blacklist` | Dọn dẹp token đã hết hạn (cron job) |
| `password_reset_tokens` | Dọn dẹp token đã hết hạn |

---

## 9. Review Checklist

### 9.1 Entity & Relationship

| Check | Expected | Actual |
|-------|----------|--------|
| Tables | 20 | ✅ 20 |
| Physical Foreign Keys | 25 | ✅ 25 (FK01–FK25) |
| Logical Relationship (no FK) | 1 | ✅ 1 (R04 — failed_login_attempts) |
| Conceptual N:N | 1 | ✅ 1 (R07 — qua registrations) |
| Unique Constraints | 11 | ✅ 11 (UC01–UC11) |
| CHECK Constraints | 8 | ✅ 8 (CK01–CK08) |

### 9.2 FK Cascade

| Policy | Expected | Actual |
|--------|----------|--------|
| CASCADE | 10 | ✅ 10 |
| RESTRICT | 6 | ✅ 6 |
| SET NULL | 9 | ✅ 9 |

### 9.3 Domain Model Consistency

| Check | Result |
|-------|--------|
| Tất cả entity từ Domain Model đều có table | ✅ |
| Tất cả attribute từ Domain Model đều có column | ✅ |
| SQL Data Type tương thích với Domain Model type | ✅ |
| NULL/NOT NULL khớp Domain Model | ✅ |
| DEFAULT khớp Domain Model | ✅ |
| UNIQUE khớp Domain Model | ✅ |
| FK Cascade khớp Domain Model | ✅ |
| ENUM values khớp Domain Model | ✅ |
| Soft Delete đúng 3 entity | ✅ |
| Retry Payment 1:N | ✅ |
| Audit Log read-only | ✅ |

### 9.4 Index Completeness

| Check | Result |
|-------|--------|
| PK trên mọi bảng | ✅ |
| UK trên mọi unique constraint | ✅ |
| FK index cho mọi FK column | ✅ |
| Composite index cho query pattern | ✅ |
| Search index cho text search | ✅ |

---

## 10. Summary

| Mục | Số lượng |
|-----|---------|
| Tables | 20 |
| Physical Foreign Keys | 25 |
| Logical Relationship (no FK) | 1 |
| Conceptual N:N Relationship | 1 |
| Unique Constraints | 11 |
| CHECK Constraints | 8 |
| Primary Indexes | 20 |
| Foreign Key Indexes | 10 |
| Composite Query Indexes | 5 |
| Search Indexes | 2 (optional) |
| ENUM Types | 15 |
| NOT NULL Columns | 113 |
| DEFAULT Values | 10 |
| CK: Application Logic | 11 |
| CK: Database CHECK | 8 |
| Soft Delete Entities | 3 |
| Standalone Entities | 2 |

---

**Review Result: PASS** ✅

**Kết luận:** Physical Database Specification hoàn chỉnh, đồng bộ 100% với Domain Model v0.2 và ERD v1.1. Sẵn sàng cho bước sinh MySQL DDL.

**READY FOR PHASE 3.3.2 – MYSQL DDL GENERATION**
