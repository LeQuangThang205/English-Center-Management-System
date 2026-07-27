# DDL Review Report

> **Phase:** Phase 3.3.2 — MySQL DDL Generation
> **Nguồn:** Physical Database Design v1.0 (Approved)
> **File:** `database/schema.sql`

---

## Kết quả kiểm tra

### 1. Tổng quan

| Hạng mục | Kỳ vọng | Thực tế | Kết luận |
|----------|---------|---------|----------|
| Số bảng (CREATE TABLE) | 20 | 20 | ✅ |
| Physical Foreign Keys | 25 | 25 | ✅ |
| Unique Constraints (UK) | 10 (+ 2 implicit PK-based) | 10 | ✅ |
| CHECK Constraints | 8 | 8 | ✅ |
| ENUM Definitions | 15 | 15 | ✅ |
| ENGINE=InnoDB | 20/20 | 20/20 | ✅ |
| CHARSET=utf8mb4 | 20/20 | 20/20 | ✅ |
| COLLATE=utf8mb4_unicode_ci | 20/20 | 20/20 | ✅ |
| Indexes bổ sung | 19 | 19 | ✅ |

### 2. Danh sách bảng (20)

| STT | Tên bảng | PK | FK | UK | CK | Ghi chú |
|-----|----------|----|----|----|----|---------|
| 1 | `token_blacklist` | `id` | 0 | 0 | 0 | Standalone — không FK |
| 2 | `system_settings` | `key` | 0 | 0 (PK) | 0 | Standalone — không FK |
| 3 | `failed_login_attempts` | `id` | 0 | 0 | 0 | Logical — không FK |
| 4 | `users` | `id` | 0 | 1 | 0 | Trung tâm authentication |
| 5 | `courses` | `id` | 0 | 0 | 2 | Soft delete |
| 6 | `student_profiles` | `user_id` | 1 | 0 (PK) | 0 | Identifying 1:1 |
| 7 | `teacher_profiles` | `user_id` | 1 | 0 (PK) | 0 | Identifying 1:1 |
| 8 | `password_reset_tokens` | `id` | 1 | 1 | 0 | |
| 9 | `classes` | `id` | 2 | 0 | 3 | Soft delete, derived column |
| 10 | `registrations` | `id` | 4 | 1 | 0 | Retry payment |
| 11 | `transactions` | `id` | 2 | 1 | 0 | |
| 12 | `attendance_sheets` | `id` | 2 | 1 | 0 | |
| 13 | `attendance_records` | `id` | 2 | 1 | 0 | |
| 14 | `scores` | `id` | 3 | 1 | 3 | Computed field |
| 15 | `notifications` | `id` | 1 | 0 | 0 | |
| 16 | `notification_recipients` | `id` | 2 | 1 | 0 | |
| 17 | `chat_conversations` | `id` | 1 | 0 | 0 | |
| 18 | `chat_messages` | `id` | 1 | 1 | 0 | |
| 19 | `faqs` | `id` | 1 | 1 | 0 | |
| 20 | `audit_logs` | `id` | 1 | 0 | 0 | Read-only |

### 3. Thứ tự tạo bảng

Bảng được tạo theo thứ tự phụ thuộc FK — không có lỗi dependency:

```
1. token_blacklist          (không phụ thuộc)
2. system_settings          (không phụ thuộc)
3. failed_login_attempts    (không phụ thuộc)
4. users                    (không phụ thuộc)
5. courses                  (không phụ thuộc)
6. student_profiles         → phụ thuộc users
7. teacher_profiles         → phụ thuộc users
8. password_reset_tokens    → phụ thuộc users
9. classes                  → phụ thuộc courses, users
10. registrations            → phụ thuộc users, classes
11. transactions             → phụ thuộc registrations, users
12. attendance_sheets        → phụ thuộc classes, users
13. attendance_records       → phụ thuộc attendance_sheets, users
14. scores                   → phụ thuộc users, classes
15. notifications            → phụ thuộc users
16. notification_recipients  → phụ thuộc notifications, users
17. chat_conversations       → phụ thuộc users
18. chat_messages            → phụ thuộc chat_conversations
19. faqs                     → phụ thuộc users
20. audit_logs               → phụ thuộc users
```

### 4. Foreign Key Cascade Policy

| Policy | Số lượng | Danh sách FK |
|--------|---------|--------------|
| CASCADE | 10 | student_profiles, teacher_profiles, password_reset_tokens, attendance_sheets(class_id), attendance_records(sheet_id), scores(class_id), notification_recipients(notification_id), notification_recipients(user_id), chat_messages, notification_recipients |
| RESTRICT | 6 | classes(course_id), registrations(student_id), registrations(class_id), transactions(registration_id), attendance_records(student_id), scores(student_id) |
| SET NULL | 9 | classes(teacher_id), registrations(approved_by), registrations(rejected_by), transactions(confirmed_by), attendance_sheets(created_by), scores(created_by), notifications(created_by), chat_conversations, faqs(created_by), audit_logs |

### 5. ENUM Definitions (15)

| # | Bảng | Cột | Giá trị ENUM |
|---|------|-----|-------------|
| 1 | `users` | `role` | ADMIN, TEACHER, STUDENT |
| 2 | `users` | `status` | ACTIVE, INACTIVE |
| 3 | `courses` | `level` | BEGINNER, INTERMEDIATE, ADVANCED |
| 4 | `courses` | `status` | ACTIVE, DELETED |
| 5 | `classes` | `schedule_day` | MON, TUE, WED, THU, FRI, SAT, SUN |
| 6 | `classes` | `status` | UPCOMING, STUDYING, FINISHED, CANCELLED |
| 7 | `registrations` | `status` | PENDING, APPROVED, REJECTED, CANCELLED, PAID |
| 8 | `transactions` | `payment_method` | BANK_TRANSFER |
| 9 | `transactions` | `status` | PENDING_CONFIRMATION, SUCCESS, FAILED |
| 10 | `attendance_records` | `status` | PRESENT, ABSENT, EXCUSED |
| 11 | `notifications` | `target_type` | ALL_STUDENTS, ALL_TEACHERS, SPECIFIC_CLASS, SPECIFIC_USER |
| 12 | `chat_conversations` | `type` | CHATBOT, ASSISTANT |
| 13 | `faqs` | `status` | VISIBLE, HIDDEN |
| 14 | `audit_logs` | `action` | CREATE, UPDATE, DELETE, APPROVE, REJECT, PAYMENT, LOGIN, LOGOUT |
| 15 | `system_settings` | `group` | CENTER_INFO, TUITION, EMAIL, SECURITY |

### 6. CHECK Constraints (8)

| # | Bảng | CK Name | Biểu thức |
|---|------|---------|-----------|
| 1 | `courses` | `ck_courses_tuition_positive` | `tuition > 0` |
| 2 | `courses` | `ck_courses_duration_positive` | `duration > 0` |
| 3 | `classes` | `ck_classes_max_capacity` | `max_capacity > 0` |
| 4 | `classes` | `ck_classes_time_range` | `end_time > start_time` |
| 5 | `classes` | `ck_classes_date_range` | `end_date > start_date` |
| 6 | `scores` | `ck_scores_midterm_range` | `midterm_score IS NULL OR (midterm_score >= 0.0 AND midterm_score <= 10.0)` |
| 7 | `scores` | `ck_scores_final_range` | `final_score IS NULL OR (final_score >= 0.0 AND final_score <= 10.0)` |
| 8 | `scores` | `ck_scores_total_range` | `total_score IS NULL OR (total_score >= 0.0 AND total_score <= 10.0)` |

### 7. Unique Constraints (10 + 2 implicit)

| # | Bảng | UK Name | Cột |
|---|------|---------|-----|
| 1 | `users` | `uk_users_email` | `email` |
| 2 | `password_reset_tokens` | `uk_password_reset_tokens_token` | `token` |
| 3 | `registrations` | `uk_registrations_student_class` | `student_id`, `class_id` |
| 4 | `transactions` | `uk_transactions_code` | `transaction_code` |
| 5 | `attendance_sheets` | `uk_attendance_sheets_class_date` | `class_id`, `date` |
| 6 | `attendance_records` | `uk_attendance_records_sheet_student` | `sheet_id`, `student_id` |
| 7 | `scores` | `uk_scores_student_class` | `student_id`, `class_id` |
| 8 | `notification_recipients` | `uk_notification_recipients` | `notification_id`, `user_id` |
| 9 | `chat_messages` | `uk_chat_messages_conversation_sequence` | `conversation_id`, `sequence_number` |
| 10 | `faqs` | `uk_faqs_question` | `question` |
| — | `student_profiles` | *(PK — implicit)* | `user_id` |
| — | `teacher_profiles` | *(PK — implicit)* | `user_id` |

### 8. Indexes bổ sung (19)

| # | Bảng | Index Name | Cột | Mục đích |
|---|------|-----------|-----|---------|
| 1 | `token_blacklist` | `idx_token_blacklist_token` | `token` | Tra cứu token blacklist |
| 2 | `failed_login_attempts` | `idx_failed_login_attempts_email` | `email` | Tra cứu login sai theo email |
| 3 | `users` | `idx_users_full_name` | `full_name` | Tìm kiếm user theo tên |
| 4 | `password_reset_tokens` | `idx_password_reset_tokens_user_id` | `user_id` | Tra cứu token theo user |
| 5 | `classes` | `idx_classes_course_id` | `course_id` | Lọc class theo course |
| 6 | `classes` | `idx_classes_teacher_id` | `teacher_id` | Lọc class theo teacher |
| 7 | `registrations` | `idx_registrations_student_id` | `student_id` | Xem lịch sử đăng ký |
| 8 | `registrations` | `idx_registrations_class_id` | `class_id` | Xem đăng ký của lớp |
| 9 | `registrations` | `idx_registrations_status` | `status` | Lọc registration theo trạng thái |
| 10 | `registrations` | `idx_registrations_student_status` | `student_id`, `status` | Composite — xem trạng thái đăng ký |
| 11 | `transactions` | `idx_transactions_registration_id` | `registration_id` | Tra cứu transaction theo registration |
| 12 | `transactions` | `idx_transactions_status` | `status` | Lọc PENDING_CONFIRMATION cần xác nhận |
| 13 | `scores` | `idx_scores_class_id` | `class_id` | Lọc score theo lớp |
| 14 | `notifications` | `idx_notifications_created_by` | `created_by` | Tra cứu notification theo admin |
| 15 | `notification_recipients` | `idx_notification_recipients_user_id` | `user_id` | Tra cứu notification của user |
| 16 | `chat_conversations` | `idx_chat_conversations_user_id` | `user_id` | Tra cứu conversation của user |
| 17 | `audit_logs` | `idx_audit_logs_actor_id` | `actor_id` | Tra cứu log theo actor |
| 18 | `audit_logs` | `idx_audit_logs_created_at` | `created_at` | Tra cứu log theo thời gian |
| 19 | `audit_logs` | `idx_audit_logs_entity` | `entity_type`, `entity_id` | Tra cứu log theo đối tượng |

### 9. Domain Model Consistency

| Kiểm tra | Kết quả |
|----------|---------|
| Tất cả entity từ Domain Model đều có CREATE TABLE | ✅ |
| Tất cả attribute từ Domain Model đều có column | ✅ |
| SQL Data Type khớp Physical Database Design | ✅ |
| NULL / NOT NULL khớp Physical Database Design | ✅ |
| DEFAULT khớp Physical Database Design | ✅ |
| FK Cascade khớp Physical Database Design | ✅ |
| ENUM values khớp Physical Database Design | ✅ |
| CHECK constraints khớp Physical Database Design | ✅ |
| Indexes khớp Physical Database Design | ✅ |

### 10. Vấn đề đã phát hiện và xử lý

| Vấn đề | Trạng thái | Xử lý |
|--------|-----------|-------|
| Không có | ✅ PASS | |

---

## Kết luận

```
DDL Generation: ✅ PASS
- 20 Tables
- 25 Physical Foreign Keys
- 10 Unique Constraints (+ 2 implicit PK-based)
- 8 CHECK Constraints
- 15 ENUM Definitions
- 19 Indexes bổ sung
- 0 Lỗi
```

**READY FOR PHASE 3.3.3 – SEED DATA**
