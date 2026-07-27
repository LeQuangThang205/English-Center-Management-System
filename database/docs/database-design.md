# Thiết kế Cơ sở Dữ liệu — English Center Management System

> **Cập nhật:** 2026-07-24
> **Cơ sở dữ liệu:** MySQL 8.0 — `english_center_db`

## Tổng quan

Hệ thống sử dụng cơ sở dữ liệu quan hệ MySQL 8.0 với các thông số:

| Thuộc tính | Giá trị |
|------------|---------|
| Database Name | `english_center_db` |
| Character Set | `utf8mb4` |
| Collation | `utf8mb4_unicode_ci` |
| Storage Engine | `InnoDB` |

## Thống kê

| Hạng mục | Số lượng |
|----------|---------|
| Bảng (Tables) | 20 |
| Physical Foreign Keys | 25 |
| Unique Constraints | 10 (+ 2 implicit PK) |
| CHECK Constraints | 8 |
| ENUM Types | 15 |
| Indexes | ~45 (PK + UK + FK + Query) |

## Kiến trúc

### Authentication & User (6 bảng)

`users` → `student_profiles`, `teacher_profiles`, `password_reset_tokens`, `token_blacklist`, `failed_login_attempts`

### Course & Class (2 bảng)

`courses` → `classes`

### Registration & Payment (2 bảng)

`registrations` → `transactions`

### Attendance (2 bảng)

`attendance_sheets` → `attendance_records`

### Score (1 bảng)

`scores`

### Notification (2 bảng)

`notifications` → `notification_recipients`

### AI & Chat (3 bảng)

`chat_conversations` → `chat_messages`
`faqs`

### System & Audit (2 bảng)

`audit_logs`, `system_settings`

## Tài liệu tham khảo

Xem `docs/database-design/` cho các tài liệu thiết kế chi tiết:

- `domain-model.md` — Domain Model v0.2
- `erd.md` + `erd.puml` — ERD v1.1
- `physical-database-design.md` — Physical Database Design v1.0
- `ddl-review.md` — DDL Review Report
