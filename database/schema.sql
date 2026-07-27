 -- ============================================================================
-- English Center Management System
-- MySQL 8.0 DDL Schema
-- Nguồn: Physical Database Design v1.0 (Approved)
--         Domain Model v0.2 (Approved)
--         ERD v1.1 (Approved Baseline)
-- ============================================================================
-- Tạo cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS english_center_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE english_center_db;

-- ============================================================================
-- Bảng 1: token_blacklist
-- Mục đích: Danh sách JWT token đã logout. Ngăn token cũ tiếp tục được sử dụng.
-- Standalone — không có Foreign Key.
-- ============================================================================
CREATE TABLE token_blacklist (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    token       VARCHAR(500)    NOT NULL COMMENT 'JWT token đã logout',
    expires_at  DATETIME        NOT NULL COMMENT 'Thời điểm token hết hạn',
    created_at  DATETIME        NOT NULL COMMENT 'Thời điểm tạo bản ghi',
    CONSTRAINT pk_token_blacklist PRIMARY KEY (id),
    INDEX idx_token_blacklist_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='JWT token đã logout — hỗ trợ blacklist cho tính năng logout';

-- ============================================================================
-- Bảng 2: system_settings
-- Mục đích: Lưu cấu hình hệ thống dạng key-value.
-- Standalone — không có Foreign Key.
-- ============================================================================
CREATE TABLE system_settings (
    `key`       VARCHAR(100)                                        NOT NULL COMMENT 'Tên cài đặt',
    `value`     TEXT                                                NOT NULL COMMENT 'Giá trị cài đặt (có thể là JSON)',
    description TEXT                                                NULL     COMMENT 'Mô tả cài đặt',
    `group`     ENUM('CENTER_INFO','TUITION','EMAIL','SECURITY')    NOT NULL COMMENT 'Nhóm cài đặt',
    updated_at  DATETIME                                            NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_system_settings PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cấu hình hệ thống — lưu thông tin trung tâm, học phí, email, bảo mật';

-- ============================================================================
-- Bảng 3: failed_login_attempts
-- Mục đích: Lưu vết các lần đăng nhập thất bại để phát hiện lockout.
-- Không có FK — Guest chưa có tài khoản cũng có thể login sai.
-- ============================================================================
CREATE TABLE failed_login_attempts (
    id            BIGINT          NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255)    NOT NULL COMMENT 'Email đăng nhập thất bại',
    ip_address    VARCHAR(45)     NOT NULL COMMENT 'Địa chỉ IP (IPv4 hoặc IPv6)',
    attempted_at  DATETIME        NOT NULL COMMENT 'Thời điểm đăng nhập thất bại',
    CONSTRAINT pk_failed_login_attempts PRIMARY KEY (id),
    INDEX idx_failed_login_attempts_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lưu vết đăng nhập thất bại — dùng để tính lockout tài khoản';

-- ============================================================================
-- Bảng 4: users
-- Mục đích: Tài khoản đăng nhập của tất cả người dùng (Admin, Teacher, Student).
-- Là entity trung tâm cho authentication và authorization.
-- Soft delete qua status = INACTIVE.
-- ============================================================================
CREATE TABLE users (
    id                  BIGINT                                      NOT NULL AUTO_INCREMENT,
    email               VARCHAR(255)                                NOT NULL COMMENT 'Email đăng nhập (unique)',
    password_hash       VARCHAR(255)                                NOT NULL COMMENT 'Mật khẩu mã hóa bcrypt',
    full_name           VARCHAR(255)                                NOT NULL COMMENT 'Họ và tên',
    phone               VARCHAR(20)                                 NULL     COMMENT 'Số điện thoại di động',
    role                ENUM('ADMIN','TEACHER','STUDENT')           NOT NULL COMMENT 'Vai trò',
    status              ENUM('ACTIVE','INACTIVE')                   NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái tài khoản (INACTIVE = soft delete)',
    avatar_url          VARCHAR(500)                                NULL     COMMENT 'URL ảnh đại diện',
    email_verified_at   DATETIME                                    NULL     COMMENT 'Thời điểm xác thực email',
    failed_attempts     INT                                         NOT NULL DEFAULT 0 COMMENT 'Số lần đăng nhập sai liên tiếp',
    locked_until        DATETIME                                    NULL     COMMENT 'Thời điểm hết khóa tài khoản',
    last_login_at       DATETIME                                    NULL     COMMENT 'Thời điểm đăng nhập gần nhất',
    created_at          DATETIME                                    NOT NULL COMMENT 'Thời điểm tạo tài khoản',
    updated_at          DATETIME                                    NOT NULL COMMENT 'Thời điểm cập nhật gần nhất',
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tài khoản người dùng — trung tâm xác thực và phân quyền (Admin/Teacher/Student)';

-- ============================================================================
-- Bảng 5: courses
-- Mục đích: Danh mục khóa học do trung tâm cung cấp.
-- Soft delete qua status = DELETED.
-- ============================================================================
CREATE TABLE courses (
    id          BIGINT                                              NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255)                                        NOT NULL COMMENT 'Tên khóa học',
    description TEXT                                                NULL     COMMENT 'Mô tả khóa học',
    tuition     DECIMAL(10,2)                                       NOT NULL COMMENT 'Học phí (phải > 0)',
    level       ENUM('BEGINNER','INTERMEDIATE','ADVANCED')          NOT NULL COMMENT 'Cấp độ khóa học',
    duration    INT                                                 NOT NULL COMMENT 'Số buổi học (phải > 0)',
    status      ENUM('ACTIVE','DELETED')                            NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái (DELETED = soft delete)',
    created_at  DATETIME                                            NOT NULL COMMENT 'Thời điểm tạo',
    updated_at  DATETIME                                            NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_courses PRIMARY KEY (id),
    CONSTRAINT ck_courses_tuition_positive CHECK (tuition > 0),
    CONSTRAINT ck_courses_duration_positive CHECK (duration > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Danh mục khóa học — quản lý thông tin khóa học và học phí';

-- ============================================================================
-- Bảng 6: student_profiles
-- Mục đích: Thông tin mở rộng dành riêng cho Student.
-- 1:1 với users — PK cũng là FK (identifying relationship).
-- ============================================================================
CREATE TABLE student_profiles (
    user_id         BIGINT      NOT NULL COMMENT 'PK — đồng thời là FK đến users.id',
    date_of_birth   DATE        NULL     COMMENT 'Ngày sinh',
    address         TEXT        NULL     COMMENT 'Địa chỉ',
    enrollment_date DATE        NOT NULL COMMENT 'Ngày tham gia trung tâm',
    created_at      DATETIME    NOT NULL COMMENT 'Thời điểm tạo',
    updated_at      DATETIME    NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_student_profiles PRIMARY KEY (user_id),
    CONSTRAINT fk_student_profiles_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thông tin mở rộng của Student — 1:1 với users';

-- ============================================================================
-- Bảng 7: teacher_profiles
-- Mục đích: Thông tin mở rộng dành riêng cho Teacher.
-- 1:1 với users — PK cũng là FK (identifying relationship).
-- ============================================================================
CREATE TABLE teacher_profiles (
    user_id         BIGINT          NOT NULL COMMENT 'PK — đồng thời là FK đến users.id',
    specialization  VARCHAR(255)    NOT NULL COMMENT 'Chuyên môn giảng dạy',
    hire_date       DATE            NOT NULL COMMENT 'Ngày tham gia trung tâm',
    created_at      DATETIME        NOT NULL COMMENT 'Thời điểm tạo',
    updated_at      DATETIME        NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_teacher_profiles PRIMARY KEY (user_id),
    CONSTRAINT fk_teacher_profiles_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thông tin mở rộng của Teacher — 1:1 với users';

-- ============================================================================
-- Bảng 8: password_reset_tokens
-- Mục đích: Token đặt lại mật khẩu. Có thời hạn 15 phút, chỉ dùng một lần.
-- ============================================================================
CREATE TABLE password_reset_tokens (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    user_id     BIGINT          NOT NULL COMMENT 'FK — người dùng yêu cầu đặt lại mật khẩu',
    token       VARCHAR(255)    NOT NULL COMMENT 'Token đặt lại mật khẩu (unique)',
    expires_at  DATETIME        NOT NULL COMMENT 'Thời điểm hết hạn (15 phút)',
    used_at     DATETIME        NULL     COMMENT 'Thời điểm sử dụng (NULL nếu chưa dùng)',
    created_at  DATETIME        NOT NULL COMMENT 'Thời điểm tạo token',
    CONSTRAINT pk_password_reset_tokens PRIMARY KEY (id),
    CONSTRAINT uk_password_reset_tokens_token UNIQUE (token),
    CONSTRAINT fk_password_reset_tokens_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Token đặt lại mật khẩu — thời hạn 15 phút, chỉ dùng một lần';

-- ============================================================================
-- Bảng 9: classes
-- Mục đích: Lớp học cụ thể — là một instance của khóa học.
-- Soft delete qua status = CANCELLED.
-- ============================================================================
CREATE TABLE classes (
    id                  BIGINT                                                      NOT NULL AUTO_INCREMENT,
    course_id           BIGINT                                                      NOT NULL COMMENT 'FK — khóa học',
    name                VARCHAR(255)                                                NOT NULL COMMENT 'Tên lớp',
    teacher_id          BIGINT                                                      NULL     COMMENT 'FK — giáo viên phụ trách (nullable)',
    max_capacity        INT                                                         NOT NULL COMMENT 'Sĩ số tối đa (> 0)',
    current_headcount   INT                                                         NOT NULL DEFAULT 0 COMMENT 'Số học viên hiện tại (derived column)',
    schedule_day        ENUM('MON','TUE','WED','THU','FRI','SAT','SUN')             NOT NULL COMMENT 'Thứ trong tuần',
    start_time          TIME                                                        NOT NULL COMMENT 'Giờ bắt đầu',
    end_time            TIME                                                        NOT NULL COMMENT 'Giờ kết thúc',
    room                VARCHAR(100)                                                NOT NULL COMMENT 'Phòng học',
    start_date          DATE                                                        NOT NULL COMMENT 'Ngày khai giảng',
    end_date            DATE                                                        NOT NULL COMMENT 'Ngày kết thúc',
    status              ENUM('UPCOMING','STUDYING','FINISHED','CANCELLED')           NOT NULL DEFAULT 'UPCOMING' COMMENT 'Trạng thái lớp học',
    created_at          DATETIME                                                    NOT NULL COMMENT 'Thời điểm tạo',
    updated_at          DATETIME                                                    NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_classes PRIMARY KEY (id),
    CONSTRAINT ck_classes_max_capacity CHECK (max_capacity > 0),
    CONSTRAINT ck_classes_time_range CHECK (end_time > start_time),
    CONSTRAINT ck_classes_date_range CHECK (end_date > start_date),
    CONSTRAINT fk_classes_courses_course_id FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_classes_users_teacher_id FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lớp học — instance của khóa học, có lịch cố định';

-- ============================================================================
-- Bảng 10: registrations
-- Mục đích: Ghi nhận yêu cầu đăng ký khóa học của Student.
-- Bảng trung gian Student — Class. Quản lý vòng đời PENDING → APPROVED → PAID.
-- ============================================================================
CREATE TABLE registrations (
    id                          BIGINT                                                  NOT NULL AUTO_INCREMENT,
    student_id                  BIGINT                                                  NOT NULL COMMENT 'FK — học viên đăng ký',
    class_id                    BIGINT                                                  NOT NULL COMMENT 'FK — lớp học',
    status                      ENUM('PENDING','APPROVED','REJECTED','CANCELLED','PAID') NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái đăng ký',
    tuition_at_registration     DECIMAL(10,2)                                           NOT NULL COMMENT 'Học phí tại thời điểm đăng ký',
    registered_at               DATETIME                                                NOT NULL COMMENT 'Thời điểm đăng ký',
    approved_at                 DATETIME                                                NULL     COMMENT 'Thời điểm duyệt',
    approved_by                 BIGINT                                                  NULL     COMMENT 'FK — admin duyệt',
    rejected_at                 DATETIME                                                NULL     COMMENT 'Thời điểm từ chối',
    rejected_by                 BIGINT                                                  NULL     COMMENT 'FK — admin từ chối',
    rejection_reason            TEXT                                                    NULL     COMMENT 'Lý do từ chối (bắt buộc khi REJECTED)',
    paid_at                     DATETIME                                                NULL     COMMENT 'Thời điểm thanh toán',
    created_at                  DATETIME                                                NOT NULL COMMENT 'Thời điểm tạo',
    updated_at                  DATETIME                                                NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_registrations PRIMARY KEY (id),
    CONSTRAINT uk_registrations_student_class UNIQUE (student_id, class_id),
    CONSTRAINT fk_registrations_users_student_id FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_registrations_classes_class_id FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_registrations_users_approved_by FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_registrations_users_rejected_by FOREIGN KEY (rejected_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Đăng ký khóa học — vòng đời PENDING → APPROVED → PAID, cho phép retry thanh toán';

-- ============================================================================
-- Bảng 11: transactions
-- Mục đích: Ghi nhận giao dịch thanh toán học phí qua QR chuyển khoản thủ công.
-- Retry payment: 1 registration có thể có nhiều transaction.
-- ============================================================================
CREATE TABLE transactions (
    id                  BIGINT                                      NOT NULL AUTO_INCREMENT,
    registration_id     BIGINT                                      NOT NULL COMMENT 'FK — đăng ký',
    amount              DECIMAL(10,2)                               NOT NULL COMMENT 'Số tiền thanh toán',
    payment_method      ENUM('BANK_TRANSFER')                       NOT NULL DEFAULT 'BANK_TRANSFER' COMMENT 'Phương thức thanh toán',
    transaction_code    VARCHAR(100)                                NOT NULL COMMENT 'Mã giao dịch nội bộ (unique)',
    status              ENUM('PENDING_CONFIRMATION','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING_CONFIRMATION' COMMENT 'Trạng thái giao dịch',
    created_at          DATETIME                                    NOT NULL COMMENT 'Thời điểm tạo',
    paid_at             DATETIME                                    NULL     COMMENT 'Thời điểm student báo đã thanh toán',
    confirmed_at        DATETIME                                    NULL     COMMENT 'Thời điểm admin xác nhận',
    confirmed_by        BIGINT                                      NULL     COMMENT 'FK — admin xác nhận',
    updated_at          DATETIME                                    NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_transactions PRIMARY KEY (id),
    CONSTRAINT uk_transactions_code UNIQUE (transaction_code),
    CONSTRAINT fk_transactions_registrations_registration_id FOREIGN KEY (registration_id) REFERENCES registrations (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_transactions_users_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Giao dịch thanh toán — hỗ trợ retry (nhiều transaction cho một registration)';

-- ============================================================================
-- Bảng 12: attendance_sheets
-- Mục đích: Phiên điểm danh cho một lớp vào một ngày cụ thể.
-- Mỗi lớp chỉ có một sheet cho mỗi ngày.
-- ============================================================================
CREATE TABLE attendance_sheets (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    class_id    BIGINT      NOT NULL COMMENT 'FK — lớp học',
    date        DATE        NOT NULL COMMENT 'Ngày điểm danh',
    created_by  BIGINT      NULL     COMMENT 'FK — giáo viên tạo phiếu (secondary FK)',
    created_at  DATETIME    NOT NULL COMMENT 'Thời điểm tạo',
    updated_at  DATETIME    NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_attendance_sheets PRIMARY KEY (id),
    CONSTRAINT uk_attendance_sheets_class_date UNIQUE (class_id, date),
    CONSTRAINT fk_attendance_sheets_classes_class_id FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_sheets_users_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Phiên điểm danh — mỗi lớp một sheet cho mỗi ngày học';

-- ============================================================================
-- Bảng 13: attendance_records
-- Mục đích: Trạng thái điểm danh của từng học viên trong một phiên.
-- ============================================================================
CREATE TABLE attendance_records (
    id          BIGINT                                  NOT NULL AUTO_INCREMENT,
    sheet_id    BIGINT                                  NOT NULL COMMENT 'FK — phiên điểm danh',
    student_id  BIGINT                                  NOT NULL COMMENT 'FK — học viên',
    status      ENUM('PRESENT','ABSENT','EXCUSED')      NOT NULL COMMENT 'Trạng thái điểm danh',
    created_at  DATETIME                                NOT NULL COMMENT 'Thời điểm tạo',
    CONSTRAINT pk_attendance_records PRIMARY KEY (id),
    CONSTRAINT uk_attendance_records_sheet_student UNIQUE (sheet_id, student_id),
    CONSTRAINT fk_attendance_records_sheets_sheet_id FOREIGN KEY (sheet_id) REFERENCES attendance_sheets (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_records_users_student_id FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Chi tiết điểm danh — trạng thái từng học viên trong một phiên';

-- ============================================================================
-- Bảng 14: scores
-- Mục đích: Bảng điểm của student theo từng lớp học.
-- total_score là computed field — tính theo business logic.
-- ============================================================================
CREATE TABLE scores (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    student_id      BIGINT          NOT NULL COMMENT 'FK — học viên',
    class_id        BIGINT          NOT NULL COMMENT 'FK — lớp học',
    midterm_score   DECIMAL(4,1)    NULL     COMMENT 'Điểm giữa kỳ (0.0–10.0)',
    final_score     DECIMAL(4,1)    NULL     COMMENT 'Điểm cuối kỳ (0.0–10.0)',
    total_score     DECIMAL(4,1)    NULL     COMMENT 'Điểm tổng kết (0.0–10.0) — computed field',
    comment         TEXT            NULL     COMMENT 'Nhận xét',
    created_by      BIGINT          NULL     COMMENT 'FK — giáo viên nhập điểm (secondary FK)',
    created_at      DATETIME        NOT NULL COMMENT 'Thời điểm tạo',
    updated_at      DATETIME        NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_scores PRIMARY KEY (id),
    CONSTRAINT uk_scores_student_class UNIQUE (student_id, class_id),
    CONSTRAINT ck_scores_midterm_range CHECK (midterm_score IS NULL OR (midterm_score >= 0.0 AND midterm_score <= 10.0)),
    CONSTRAINT ck_scores_final_range CHECK (final_score IS NULL OR (final_score >= 0.0 AND final_score <= 10.0)),
    CONSTRAINT ck_scores_total_range CHECK (total_score IS NULL OR (total_score >= 0.0 AND total_score <= 10.0)),
    CONSTRAINT fk_scores_users_student_id FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_scores_classes_class_id FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_scores_users_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng điểm — lưu điểm giữa kỳ, cuối kỳ, tổng kết cho mỗi học viên theo lớp';

-- ============================================================================
-- Bảng 15: notifications
-- Mục đích: Thông báo do Admin gửi đến người dùng.
-- target_type + target_id xác định đối tượng nhận.
-- ============================================================================
CREATE TABLE notifications (
    id              BIGINT                                                              NOT NULL AUTO_INCREMENT,
    title           VARCHAR(255)                                                        NOT NULL COMMENT 'Tiêu đề thông báo',
    content         TEXT                                                                NOT NULL COMMENT 'Nội dung thông báo',
    target_type     ENUM('ALL_STUDENTS','ALL_TEACHERS','SPECIFIC_CLASS','SPECIFIC_USER') NOT NULL COMMENT 'Loại đối tượng nhận',
    target_id       BIGINT                                                              NULL     COMMENT 'ID đối tượng (class_id hoặc user_id)',
    attachment_url  VARCHAR(500)                                                        NULL     COMMENT 'URL file đính kèm (tối đa 10MB)',
    created_by      BIGINT                                                              NULL     COMMENT 'FK — admin tạo thông báo',
    created_at      DATETIME                                                            NOT NULL COMMENT 'Thời điểm tạo',
    updated_at      DATETIME                                                            NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT fk_notifications_users_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thông báo — Admin gửi đến học viên, giáo viên hoặc cá nhân';

-- ============================================================================
-- Bảng 16: notification_recipients
-- Mục đích: Liên kết giữa notification và từng user nhận.
-- Lưu trạng thái đã đọc.
-- ============================================================================
CREATE TABLE notification_recipients (
    id                BIGINT      NOT NULL AUTO_INCREMENT,
    notification_id   BIGINT      NOT NULL COMMENT 'FK — thông báo',
    user_id           BIGINT      NOT NULL COMMENT 'FK — người nhận',
    is_read           TINYINT(1)  NOT NULL DEFAULT 0 COMMENT 'Đã đọc? (0 = chưa, 1 = đã đọc)',
    read_at           DATETIME    NULL     COMMENT 'Thời điểm đọc',
    CONSTRAINT pk_notification_recipients PRIMARY KEY (id),
    CONSTRAINT uk_notification_recipients UNIQUE (notification_id, user_id),
    CONSTRAINT fk_notification_recipients_notifications_notification_id FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notification_recipients_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Người nhận thông báo — liên kết notification → user, lưu trạng thái đã đọc';

-- ============================================================================
-- Bảng 17: chat_conversations
-- Mục đích: Cuộc hội thoại giữa user (Student/Guest/Admin) và AI.
-- user_id nullable cho Guest.
-- ============================================================================
CREATE TABLE chat_conversations (
    id          BIGINT                                      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT                                      NULL     COMMENT 'FK — người dùng (NULL = Guest)',
    type        ENUM('CHATBOT','ASSISTANT')                 NOT NULL COMMENT 'Loại hội thoại (CHATBOT = Student/Guest, ASSISTANT = Admin)',
    title       VARCHAR(255)                                NULL     COMMENT 'Tiêu đề (AI-generated)',
    created_at  DATETIME                                    NOT NULL COMMENT 'Thời điểm tạo',
    updated_at  DATETIME                                    NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_chat_conversations PRIMARY KEY (id),
    CONSTRAINT fk_chat_conversations_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cuộc hội thoại AI — hỗ trợ Chatbot cho Student/Guest và Assistant cho Admin';

-- ============================================================================
-- Bảng 18: chat_messages
-- Mục đích: Mỗi lượt hỏi-đáp trong một conversation.
-- ============================================================================
CREATE TABLE chat_messages (
    id                BIGINT      NOT NULL AUTO_INCREMENT,
    conversation_id   BIGINT      NOT NULL COMMENT 'FK — cuộc hội thoại',
    sequence_number   INT         NOT NULL COMMENT 'Số thứ tự tin nhắn trong conversation',
    question          TEXT        NOT NULL COMMENT 'Câu hỏi của người dùng',
    response          TEXT        NOT NULL COMMENT 'Phản hồi của AI',
    created_at        DATETIME    NOT NULL COMMENT 'Thời điểm tạo',
    CONSTRAINT pk_chat_messages PRIMARY KEY (id),
    CONSTRAINT uk_chat_messages_conversation_sequence UNIQUE (conversation_id, sequence_number),
    CONSTRAINT fk_chat_messages_conversations_conversation_id FOREIGN KEY (conversation_id) REFERENCES chat_conversations (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tin nhắn AI — lưu câu hỏi và phản hồi trong cuộc hội thoại';

-- ============================================================================
-- Bảng 19: faqs
-- Mục đích: Kho kiến thức FAQ — nguồn dữ liệu cho AI Chatbot và AI Assistant.
-- ============================================================================
CREATE TABLE faqs (
    id          BIGINT                                  NOT NULL AUTO_INCREMENT,
    question    VARCHAR(500)                            NOT NULL COMMENT 'Câu hỏi (unique)',
    answer      TEXT                                    NOT NULL COMMENT 'Câu trả lời',
    category    VARCHAR(100)                            NULL     COMMENT 'Danh mục',
    tags        JSON                                    NULL     COMMENT 'Tags (JSON array — keywords cho search)',
    status      ENUM('VISIBLE','HIDDEN')                NOT NULL DEFAULT 'VISIBLE' COMMENT 'Trạng thái hiển thị',
    created_by  BIGINT                                  NULL     COMMENT 'FK — admin tạo FAQ',
    created_at  DATETIME                                NOT NULL COMMENT 'Thời điểm tạo',
    updated_at  DATETIME                                NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_faqs PRIMARY KEY (id),
    CONSTRAINT uk_faqs_question UNIQUE (question),
    CONSTRAINT fk_faqs_users_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Kho kiến thức FAQ — cung cấp ngữ cảnh cho AI Chatbot và AI Assistant';

-- ============================================================================
-- Bảng 20: audit_logs
-- Mục đích: Ghi nhận mọi thao tác quan trọng trên hệ thống phục vụ kiểm tra và truy vết.
-- Read-only — không bao giờ được sửa hoặc xóa.
-- ============================================================================
CREATE TABLE audit_logs (
    id              BIGINT                                                              NOT NULL AUTO_INCREMENT,
    actor_id        BIGINT                                                              NULL     COMMENT 'FK — người thực hiện (NULL = Guest)',
    action          ENUM('CREATE','UPDATE','DELETE','APPROVE','REJECT','PAYMENT','LOGIN','LOGOUT') NOT NULL COMMENT 'Hành động',
    entity_type     VARCHAR(100)                                                        NOT NULL COMMENT 'Loại đối tượng (tên bảng)',
    entity_id       BIGINT                                                              NULL     COMMENT 'ID đối tượng',
    old_value       JSON                                                                NULL     COMMENT 'Giá trị cũ (JSON)',
    new_value       JSON                                                                NULL     COMMENT 'Giá trị mới (JSON)',
    ip_address      VARCHAR(45)                                                         NULL     COMMENT 'Địa chỉ IP',
    user_agent      TEXT                                                                NULL     COMMENT 'User agent',
    created_at      DATETIME                                                            NOT NULL COMMENT 'Thời điểm ghi nhận',
    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_users_actor_id FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Nhật ký kiểm toán — ghi lại mọi thao tác quan trọng, read-only, không được sửa hoặc xóa';

-- ============================================================================
-- Indexes bổ sung cho hiệu năng truy vấn
-- ============================================================================

-- users: tìm kiếm theo tên
CREATE INDEX idx_users_full_name ON users (full_name);

-- password_reset_tokens: tra cứu token theo user
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);

-- classes: lọc class theo course
CREATE INDEX idx_classes_course_id ON classes (course_id);

-- classes: lọc class theo teacher
CREATE INDEX idx_classes_teacher_id ON classes (teacher_id);

-- registrations: lọc theo student
CREATE INDEX idx_registrations_student_id ON registrations (student_id);

-- registrations: lọc theo class
CREATE INDEX idx_registrations_class_id ON registrations (class_id);

-- registrations: lọc theo trạng thái (ví dụ: PENDING cần duyệt)
CREATE INDEX idx_registrations_status ON registrations (status);

-- registrations: composite — xem trạng thái đăng ký của student
CREATE INDEX idx_registrations_student_status ON registrations (student_id, status);

-- transactions: lọc theo registration
CREATE INDEX idx_transactions_registration_id ON transactions (registration_id);

-- transactions: lọc theo trạng thái (PENDING_CONFIRMATION cần xác nhận)
CREATE INDEX idx_transactions_status ON transactions (status);

-- scores: lọc score theo class
CREATE INDEX idx_scores_class_id ON scores (class_id);

-- notifications: lọc theo admin tạo
CREATE INDEX idx_notifications_created_by ON notifications (created_by);

-- notification_recipients: lọc theo user
CREATE INDEX idx_notification_recipients_user_id ON notification_recipients (user_id);

-- chat_conversations: lọc theo user
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations (user_id);

-- audit_logs: lọc theo actor
CREATE INDEX idx_audit_logs_actor_id ON audit_logs (actor_id);

-- audit_logs: lọc theo thời gian
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);

-- audit_logs: composite theo đối tượng
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
