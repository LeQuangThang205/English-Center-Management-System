# ERD — English Center Management System

> **Phase:** Phase 3.2 — Database Design (ERD)
> **Phiên bản:** v1.1 (Approved Baseline)
> **Nguồn:** Domain Model v0.2 (Approved)
> **Notation:** Crow's Foot

---

## 1. Entity List

Tổng cộng **20 entities**, giữ nguyên từ Domain Model.

### Nhóm 1: Authentication & User Management (6)

| # | Entity | PK | Mô tả |
|---|--------|----|-------|
| 1 | `users` | `id` (BIGINT) | Tài khoản đăng nhập, trung tâm authentication. Soft delete qua status=INACTIVE. |
| 2 | `student_profiles` | `user_id` (FK→users) | Thông tin mở rộng cho Student. 1:1 với users. |
| 3 | `teacher_profiles` | `user_id` (FK→users) | Thông tin mở rộng cho Teacher. 1:1 với users. |
| 4 | `password_reset_tokens` | `id` (BIGINT) | Token đặt lại mật khẩu, thời hạn 15 phút. |
| 5 | `token_blacklist` | `id` (BIGINT) | JWT token đã logout. |
| 6 | `failed_login_attempts` | `id` (BIGINT) | Lưu vết đăng nhập thất bại. Không có FK. |

### Nhóm 2: Course & Class Management (2)

| # | Entity | PK | Mô tả |
|---|--------|----|-------|
| 7 | `courses` | `id` (BIGINT) | Danh mục khóa học. Soft delete qua status=DELETED. |
| 8 | `classes` | `id` (BIGINT) | Lớp học — instance của khóa học. Có lịch cố định. Soft delete qua status=CANCELLED. |

### Nhóm 3: Registration & Enrollment (1)

| # | Entity | PK | Mô tả |
|---|--------|----|-------|
| 9 | `registrations` | `id` (BIGINT) | Bảng trung gian Student—Class. Quản lý vòng đời PENDING→APPROVED→PAID. UNIQUE(student_id, class_id). |

### Nhóm 4: Payment (1)

| # | Entity | PK | Mô tả |
|---|--------|----|-------|
| 10 | `transactions` | `id` (BIGINT) | Giao dịch thanh toán. Retry: 1 registration có thể có nhiều transaction, tối đa 1 SUCCESS. |

### Nhóm 5: Attendance (2)

| # | Entity | PK | Mô tả |
|---|--------|----|-------|
| 11 | `attendance_sheets` | `id` (BIGINT) | Phiên điểm danh — mỗi lớp một sheet/ngày. UNIQUE(class_id, date). |
| 12 | `attendance_records` | `id` (BIGINT) | Trạng thái từng student trong một sheet. UNIQUE(sheet_id, student_id). |

### Nhóm 6: Score Management (1)

| # | Entity | PK | Mô tả |
|---|--------|----|-------|
| 13 | `scores` | `id` (BIGINT) | Bảng điểm student theo lớp. UNIQUE(student_id, class_id). |

### Nhóm 7: Notifications (2)

| # | Entity | PK | Mô tả |
|---|--------|----|-------|
| 14 | `notifications` | `id` (BIGINT) | Thông báo do Admin tạo. target_type + target_id để xác định đối tượng nhận. |
| 15 | `notification_recipients` | `id` (BIGINT) | Liên kết notification→user. UNIQUE(notification_id, user_id). |

### Nhóm 8: AI & Chat (3)

| # | Entity | PK | Mô tả |
|---|--------|----|-------|
| 16 | `chat_conversations` | `id` (BIGINT) | Cuộc hội thoại AI. user_id nullable cho Guest. |
| 17 | `chat_messages` | `id` (BIGINT) | Tin nhắn trong conversation. UNIQUE(conversation_id, sequence_number). |
| 18 | `faqs` | `id` (BIGINT) | Kho kiến thức FAQ. question UNIQUE. |

### Nhóm 9: System & Audit (2)

| # | Entity | PK | Mô tả |
|---|--------|----|-------|
| 19 | `audit_logs` | `id` (BIGINT) | Audit trail — read-only, never deleted. actor_id nullable cho Guest. |
| 20 | `system_settings` | `key` (VARCHAR) | Cấu hình key-value. Không có FK. |

---

## 2. Relationship Summary

Tổng cộng **23 relationships** (R01–R23), giữ nguyên từ Domain Model.

### 2.1 Authentication & User (R01–R04)

| # | Entity A | Entity B | Cardinality | FK | Mô tả |
|---|----------|----------|-------------|----|-------|
| R01 | `users` | `student_profiles` | 1 — 0..1 | `student_profiles.user_id` | Identifying — PK cũng là FK. |
| R02 | `users` | `teacher_profiles` | 1 — 0..1 | `teacher_profiles.user_id` | Identifying — PK cũng là FK. |
| R03 | `users` | `password_reset_tokens` | 1 — 0..N | `password_reset_tokens.user_id` | User có thể có nhiều token. |
| R04 | `users` | `failed_login_attempts` | 1 — 0..N | *Không có FK* | Logical relationship qua email. Dotted line trong ERD. |

### 2.2 Course & Class (R05–R07)

| # | Entity A | Entity B | Cardinality | FK | Mô tả |
|---|----------|----------|-------------|----|-------|
| R05 | `courses` | `classes` | 1 — 0..N | `classes.course_id` | Một course có nhiều class. |
| R06 | `users` | `classes` | 0..1 — 0..N | `classes.teacher_id` | Teacher phụ trách class. Nullable. |
| R07 | `users` | `classes` | N — N | *Qua registrations* | Conceptual N:N. Dotted line. Thực tế qua R08 + R09. |

### 2.3 Registration (R08–R10)

| # | Entity A | Entity B | Cardinality | FK | Mô tả |
|---|----------|----------|-------------|----|-------|
| R08 | `users` | `registrations` | 1 — 0..N | `registrations.student_id` | Student tạo registration. |
| R09 | `classes` | `registrations` | 1 — 0..N | `registrations.class_id` | Class nhận registration. |
| R10 | `users` | `registrations` | 0..1 — 0..N | `registrations.approved_by`, `registrations.rejected_by` | Admin duyệt/từ chối. Nullable. 2 FK cho 1 relationship role. |

### 2.4 Payment (R11–R12)

| # | Entity A | Entity B | Cardinality | FK | Mô tả |
|---|----------|----------|-------------|----|-------|
| R11 | `registrations` | `transactions` | 1 — 0..N | `transactions.registration_id` | Retry payment: 1 registration có thể có nhiều transaction. |
| R12 | `users` | `transactions` | 0..1 — 0..N | `transactions.confirmed_by` | Admin xác nhận transaction. Nullable. |

### 2.5 Attendance (R13–R15)

| # | Entity A | Entity B | Cardinality | FK | Mô tả |
|---|----------|----------|-------------|----|-------|
| R13 | `classes` | `attendance_sheets` | 1 — 0..N | `attendance_sheets.class_id` | Class có nhiều sheet (mỗi buổi một sheet). |
| R14 | `attendance_sheets` | `attendance_records` | 1 — 1..N | `attendance_records.sheet_id` | Mandatory many: mỗi sheet phải có ít nhất 1 record. |
| R15 | `users` | `attendance_records` | 1 — 0..N | `attendance_records.student_id` | Student có nhiều record qua các buổi. |

### 2.6 Score (R16–R17)

| # | Entity A | Entity B | Cardinality | FK | Mô tả |
|---|----------|----------|-------------|----|-------|
| R16 | `users` | `scores` | 1 — 0..N | `scores.student_id` | Student có nhiều score (mỗi lớp một score). |
| R17 | `classes` | `scores` | 1 — 0..N | `scores.class_id` | Class có nhiều score (mỗi student một score). |

### 2.7 Notification (R18–R20)

| # | Entity A | Entity B | Cardinality | FK | Mô tả |
|---|----------|----------|-------------|----|-------|
| R18 | `users` | `notifications` | 1 — 0..N | `notifications.created_by` | Admin tạo thông báo. |
| R19 | `notifications` | `notification_recipients` | 1 — 1..N | `notification_recipients.notification_id` | Mandatory many: mỗi notification phải có ít nhất 1 recipient. |
| R20 | `users` | `notification_recipients` | 1 — 0..N | `notification_recipients.user_id` | User nhận thông báo. |

### 2.8 AI & Chat (R21–R22)

| # | Entity A | Entity B | Cardinality | FK | Mô tả |
|---|----------|----------|-------------|----|-------|
| R21 | `users` | `chat_conversations` | 0..1 — 0..N | `chat_conversations.user_id` | User có nhiều conversation. Nullable cho Guest. |
| R22 | `chat_conversations` | `chat_messages` | 1 — 1..N | `chat_messages.conversation_id` | Mandatory many: mỗi conversation phải có ít nhất 1 message. |

### 2.9 Audit (R23)

| # | Entity A | Entity B | Cardinality | FK | Mô tả |
|---|----------|----------|-------------|----|-------|
| R23 | `users` | `audit_logs` | 0..1 — 0..N | `audit_logs.actor_id` | Actor thực hiện hành động. Nullable cho Guest. |

---

## 3. Cardinality Table

| # | Parent | Child | Crow's Foot | Parent Cardinality | Child Cardinality | Optionality |
|---|--------|-------|-------------|-------------------|-------------------|-------------|
| R01 | `users` | `student_profiles` | `\|\|--\|o` | 1 (bắt buộc) | 0..1 (tùy chọn) | Mandatory → Optional |
| R02 | `users` | `teacher_profiles` | `\|\|--\|o` | 1 (bắt buộc) | 0..1 (tùy chọn) | Mandatory → Optional |
| R03 | `users` | `password_reset_tokens` | `\|\|--o{` | 1 (bắt buộc) | 0..N (tùy chọn) | Mandatory → Optional |
| R04 | `users` | `failed_login_attempts` | `\|\|..o{` | 1 (bắt buộc, logic) | 0..N (tùy chọn) | Logical (no FK) |
| R05 | `courses` | `classes` | `\|\|--o{` | 1 (bắt buộc) | 0..N (tùy chọn) | Mandatory → Optional |
| R06 | `users` | `classes` | `\|o--o{` | 0..1 (tùy chọn) | 0..N (tùy chọn) | Optional → Optional |
| R07 | `users` | `classes` | `}o..o{` | 0..N (tùy chọn) | 0..N (tùy chọn) | Optional → Optional (N:N) |
| R08 | `users` | `registrations` | `\|\|--o{` | 1 (bắt buộc) | 0..N (tùy chọn) | Mandatory → Optional |
| R09 | `classes` | `registrations` | `\|\|--o{` | 1 (bắt buộc) | 0..N (tùy chọn) | Mandatory → Optional |
| R10 | `users` | `registrations` | `\|o--o{` | 0..1 (tùy chọn) | 0..N (tùy chọn) | Optional → Optional |
| R11 | `registrations` | `transactions` | `\|\|--o{` | 1 (bắt buộc) | 0..N (tùy chọn) | Mandatory → Optional |
| R12 | `users` | `transactions` | `\|o--o{` | 0..1 (tùy chọn) | 0..N (tùy chọn) | Optional → Optional |
| R13 | `classes` | `attendance_sheets` | `\|\|--o{` | 1 (bắt buộc) | 0..N (tùy chọn) | Mandatory → Optional |
| R14 | `attendance_sheets` | `attendance_records` | `\|\|--\|{` | 1 (bắt buộc) | 1..N (bắt buộc) | Mandatory → Mandatory |
| R15 | `users` | `attendance_records` | `\|\|--o{` | 1 (bắt buộc) | 0..N (tùy chọn) | Mandatory → Optional |
| R16 | `users` | `scores` | `\|\|--o{` | 1 (bắt buộc) | 0..N (tùy chọn) | Mandatory → Optional |
| R17 | `classes` | `scores` | `\|\|--o{` | 1 (bắt buộc) | 0..N (tùy chọn) | Mandatory → Optional |
| R18 | `users` | `notifications` | `\|\|--o{` | 1 (bắt buộc) | 0..N (tùy chọn) | Mandatory → Optional |
| R19 | `notifications` | `notification_recipients` | `\|\|--\|{` | 1 (bắt buộc) | 1..N (bắt buộc) | Mandatory → Mandatory |
| R20 | `users` | `notification_recipients` | `\|\|--o{` | 1 (bắt buộc) | 0..N (tùy chọn) | Mandatory → Optional |
| R21 | `users` | `chat_conversations` | `\|o--o{` | 0..1 (tùy chọn) | 0..N (tùy chọn) | Optional → Optional |
| R22 | `chat_conversations` | `chat_messages` | `\|\|--\|{` | 1 (bắt buộc) | 1..N (bắt buộc) | Mandatory → Mandatory |
| R23 | `users` | `audit_logs` | `\|o--o{` | 0..1 (tùy chọn) | 0..N (tùy chọn) | Optional → Optional |

---

## 4. Mapping với Domain Model

### 4.1 Entity Coverage

| Domain Model Entity | ERD Entity | Trạng thái | Ghi chú |
|--------------------|------------|-----------|---------|
| `users` | `users` | ✓ Giữ nguyên | |
| `student_profiles` | `student_profiles` | ✓ Giữ nguyên | |
| `teacher_profiles` | `teacher_profiles` | ✓ Giữ nguyên | |
| `password_reset_tokens` | `password_reset_tokens` | ✓ Giữ nguyên | |
| `token_blacklist` | `token_blacklist` | ✓ Giữ nguyên | |
| `courses` | `courses` | ✓ Giữ nguyên | |
| `classes` | `classes` | ✓ Giữ nguyên | |
| `registrations` | `registrations` | ✓ Giữ nguyên | |
| `transactions` | `transactions` | ✓ Giữ nguyên | |
| `attendance_sheets` | `attendance_sheets` | ✓ Giữ nguyên | |
| `attendance_records` | `attendance_records` | ✓ Giữ nguyên | |
| `scores` | `scores` | ✓ Giữ nguyên | |
| `notifications` | `notifications` | ✓ Giữ nguyên | |
| `notification_recipients` | `notification_recipients` | ✓ Giữ nguyên | |
| `chat_conversations` | `chat_conversations` | ✓ Giữ nguyên | |
| `chat_messages` | `chat_messages` | ✓ Giữ nguyên | |
| `faqs` | `faqs` | ✓ Giữ nguyên | |
| `audit_logs` | `audit_logs` | ✓ Giữ nguyên | |
| `system_settings` | `system_settings` | ✓ Giữ nguyên | |
| `failed_login_attempts` | `failed_login_attempts` | ✓ Giữ nguyên | |
| `token_blacklist` | `token_blacklist` | ✓ Giữ nguyên | |

**Kết luận:** 20/20 entities mapped hoàn toàn. Không thêm, không xóa.

### 4.2 Relationship Coverage

| Domain Model R# | ERD | Cardinality Domain Model | Cardinality ERD | Trạng thái |
|-----------------|-----|------------------------|-----------------|-----------|
| R01 | ✓ | Optional → Optional | 1 — 0..1 | ✓ |
| R02 | ✓ | Optional → Optional | 1 — 0..1 | ✓ |
| R03 | ✓ | Optional → Optional | 1 — 0..N | ✓ |
| R04 | ✓ | Optional → Optional | 1 — 0..N (no FK) | ✓ |
| R05 | ✓ | Mandatory → Optional | 1 — 0..N | ✓ |
| R06 | ✓ | Optional → Optional | 0..1 — 0..N | ✓ |
| R07 | ✓ | Optional → Optional | N — N (conceptual) | ✓ |
| R08 | ✓ | Mandatory → Optional | 1 — 0..N | ✓ |
| R09 | ✓ | Mandatory → Optional | 1 — 0..N | ✓ |
| R10 | ✓ | Optional → Optional | 0..1 — 0..N | ✓ |
| R11 | ✓ | Mandatory → Optional | 1 — 0..N | ✓ |
| R12 | ✓ | Optional → Optional | 0..1 — 0..N | ✓ |
| R13 | ✓ | Mandatory → Optional | 1 — 0..N | ✓ |
| R14 | ✓ | Mandatory → Mandatory | 1 — 1..N | ✓ |
| R15 | ✓ | Optional → Optional | 1 — 0..N | ✓ |
| R16 | ✓ | Optional → Optional | 1 — 0..N | ✓ |
| R17 | ✓ | Mandatory → Optional | 1 — 0..N | ✓ |
| R18 | ✓ | Optional → Optional | 1 — 0..N | ✓ |
| R19 | ✓ | Mandatory → Mandatory | 1 — 1..N | ✓ |
| R20 | ✓ | Mandatory → Optional | 1 — 0..N | ✓ |
| R21 | ✓ | Optional → Optional | 0..1 — 0..N | ✓ |
| R22 | ✓ | Mandatory → Mandatory | 1 — 1..N | ✓ |
| R23 | ✓ | Optional → Optional | 0..1 — 0..N | ✓ |

**Kết luận:** 23/23 relationships mapped hoàn toàn. Không đổi cardinality, không thêm, không xóa.

### 4.3 FK Constraint Coverage

| Domain Model FK# | Child Table | FK Column | ERD | Trạng thái |
|-----------------|------------|-----------|-----|-----------|
| FK01 | `student_profiles` | `user_id` | ✓ | Identifying |
| FK02 | `teacher_profiles` | `user_id` | ✓ | Identifying |
| FK03 | `password_reset_tokens` | `user_id` | ✓ | |
| FK04 | `classes` | `course_id` | ✓ | |
| FK05 | `classes` | `teacher_id` | ✓ | Nullable |
| FK06 | `registrations` | `student_id` | ✓ | |
| FK07 | `registrations` | `class_id` | ✓ | |
| FK08 | `registrations` | `approved_by` | ✓ | Nullable |
| FK09 | `registrations` | `rejected_by` | ✓ | Nullable |
| FK10 | `transactions` | `registration_id` | ✓ | |
| FK11 | `transactions` | `confirmed_by` | ✓ | Nullable |
| FK12 | `attendance_sheets` | `class_id` | ✓ | |
| FK13 | `attendance_sheets` | `created_by` | ✓ | FK ghi trong attribute |
| FK14 | `attendance_records` | `sheet_id` | ✓ | |
| FK15 | `attendance_records` | `student_id` | ✓ | |
| FK16 | `scores` | `student_id` | ✓ | |
| FK17 | `scores` | `class_id` | ✓ | |
| FK18 | `scores` | `created_by` | ✓ | FK ghi trong attribute |
| FK19 | `notifications` | `created_by` | ✓ | |
| FK20 | `notification_recipients` | `notification_id` | ✓ | |
| FK21 | `notification_recipients` | `user_id` | ✓ | |
| FK22 | `chat_conversations` | `user_id` | ✓ | Nullable |
| FK23 | `chat_messages` | `conversation_id` | ✓ | |
| FK24 | `faqs` | `created_by` | ✓ | FK ghi trong attribute |
| FK25 | `audit_logs` | `actor_id` | ✓ | Nullable |
| FK26 | `failed_login_attempts` | *không có FK* | ✓ | Logical |

**Kết luận:** 25/25 Physical Foreign Keys + 2 Logical Relationships mapped. FK13, FK18, FK24 (created_by) là secondary FK, được thể hiện trong attribute entity, không có relationship line riêng.

---

## 5. Những quyết định thiết kế

### 5.1 Identifying vs Non-identifying Relationship

| Relationship | Loại | Lý do |
|-------------|------|-------|
| R01: `users` → `student_profiles` | **Identifying** | `user_id` vừa là PK vừa là FK. Student không tồn tại độc lập. |
| R02: `users` → `teacher_profiles` | **Identifying** | `user_id` vừa là PK vừa là FK. Teacher không tồn tại độc lập. |
| Tất cả các relationship còn lại | **Non-identifying** | Các entity có PK riêng, FK là cột riêng biệt. |

### 5.2 Soft Delete

| Entity | Cột | Giá trị "Deleted" | Cách thể hiện trong ERD |
|--------|-----|-------------------|------------------------|
| `users` | `status` | `INACTIVE` | Attribute có DEFAULT 'ACTIVE' |
| `courses` | `status` | `DELETED` | Attribute có DEFAULT 'ACTIVE' |
| `classes` | `status` | `CANCELLED` | Attribute có DEFAULT 'UPCOMING' |

### 5.3 Retry Payment

- R11: `registrations` → `transactions` là 1:N.
- Một registration có thể có nhiều transaction (retry payment).
- Mỗi registration chỉ được phép tồn tại tối đa **01 transaction có status = SUCCESS**.
- Transaction status: PENDING_CONFIRMATION → SUCCESS / FAILED.
- Nếu FAILED, student có thể tạo transaction mới.
- **Enforcement:** Quy tắc "tối đa 1 SUCCESS" được enforce ở tầng Business Logic (Spring Boot Service), không enforce trực tiếp bằng MySQL constraint.

### 5.4 Audit Log

- `audit_logs`: read-only, không bao giờ được sửa hoặc xóa.
- `actor_id` nullable cho Guest action.
- Entity này xuất hiện trong ERD nhưng không có relationship line cho secondary FK.

### 5.5 Secondary FK (created_by) không có relationship line riêng

Các FK sau được thể hiện trong entity attributes nhưng **không có relationship line riêng** trong ERD:

| Entity | FK Column | Parent |
|--------|-----------|--------|
| `attendance_sheets` | `created_by` | `users.id` |
| `scores` | `created_by` | `users.id` |
| `faqs` | `created_by` | `users.id` |

**Lý do:**
- Để giảm độ phức tạp của ERD, các secondary audit FK (created_by) chỉ được thể hiện trong entity attributes và FK table, không vẽ relationship line riêng.
- Các FK này là "secondary" — không phải relationship chính của entity.
- Chúng là FK tham chiếu đến `users` (actor thực hiện thao tác), đã có R23 (audit_logs) cho mục đích audit.
- Domain Model không liệt kê chúng là relationship riêng (không có R#).
- Vẫn được định nghĩa đầy đủ trong entity attribute và FK table.

### 5.6 R07 — N:N Conceptual giữa Student và Class

- R07 không phải physical FK relationship.
- N:N được implement qua `registrations` (bảng trung gian) với R08 + R09.
- Trong ERD, R07 được thể hiện bằng đường dotted để nhắc nhở về mối quan hệ này.
- Student thuộc về class khi registration.status = PAID.

### 5.7 R04 — Không có FK

- `failed_login_attempts` lưu email dạng string, không có FK đến users.
- Lý do: Guest chưa có tài khoản cũng có thể login sai.
- Trong ERD, relationship được thể hiện bằng đường dotted (logical relationship).

### 5.8 Derived Column — `classes.current_headcount`

- `classes.current_headcount` là **Derived Column**.
- Được cập nhật khi:
  - Registration chuyển sang trạng thái `PAID` (tăng +1).
  - Học viên bị hủy/hủy đăng ký (giảm -1).
- Mục đích: tối ưu truy vấn số lượng học viên hiện tại — tránh phải `COUNT(registrations)` mỗi lần hiển thị danh sách lớp.
- Ràng buộc: `current_headcount <= max_capacity` (BR08).

### 5.9 Computed Field — `scores.total_score`

- `scores.total_score` là **Computed / Derived Field**.
- Giá trị được tính theo quy định chấm điểm của trung tâm (Business Logic), không hard-code công thức trong database.
- Database chỉ lưu kết quả cuối cùng sau khi tính toán.
- Thang điểm: 0.0 – 10.0 (1 số thập phân).

### 5.10 Entity không có relationship

| Entity | Ghi chú |
|--------|---------|
| `token_blacklist` | Standalone. Không có FK. JWT token blacklist. |
| `system_settings` | Standalone. Không có FK. Cấu hình key-value. |

### 5.11 Cascade Policy (giữ nguyên từ Domain Model)

| Policy | Áp dụng cho |
|--------|------------|
| DELETE CASCADE | student_profiles, teacher_profiles, attendance_records, notification_recipients, chat_messages, password_reset_tokens |
| DELETE RESTRICT | registrations (student_id, class_id), transactions (registration_id), scores (student_id) |
| SET NULL | classes.teacher_id, registrations.approved_by/rejected_by, transactions.confirmed_by, audit_logs.actor_id |

---

## 6. Thống kê

| Mục | Số lượng |
|-----|---------|
| Entities | 20 |
| Relationships | 23 |
| Physical Foreign Keys | 25 (FK01–FK25) |
| Logical Relationship (no FK) | 1 (R04 — failed_login_attempts) |
| Conceptual N:N Relationship | 1 (R07 — students ↔ classes via registrations) |
| Unique constraints | 11 (UC01–UC11 từ Domain Model) |
| Identifying relationships | 2 (R01, R02) |
| Non-identifying relationships | 20 (R03–R06, R08–R23) |
| Derived / Computed columns | 2 (classes.current_headcount, scores.total_score) |
| Entity có soft delete | 3 (users, courses, classes) |
| Standalone entity (no FK) | 2 (token_blacklist, system_settings) |
