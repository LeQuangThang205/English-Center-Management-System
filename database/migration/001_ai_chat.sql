-- ============================================================================
-- Migration 001: AI Chat (S12)
-- Mục đích: tạo bảng hội thoại và tin nhắn AI cho mọi user đã đăng nhập.
-- Khớp schema.sql bảng 17 (chat_conversations) và bảng 18 (chat_messages).
-- Áp dụng thủ công cho MySQL 8.0 (ddl-auto: validate nên app không tự tạo bảng).
-- Idempotent: dùng CREATE TABLE IF NOT EXISTS.
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_conversations (
    id          BIGINT                                      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT                                      NULL     COMMENT 'FK — người dùng sở hữu hội thoại',
    type        ENUM('CHATBOT','ASSISTANT')                 NOT NULL COMMENT 'Loại hội thoại (CHATBOT = Student/Teacher, ASSISTANT = Admin)',
    title       VARCHAR(255)                                NULL     COMMENT 'Tiêu đề (lấy từ câu hỏi đầu tiên)',
    created_at  DATETIME                                    NOT NULL COMMENT 'Thời điểm tạo',
    updated_at  DATETIME                                    NOT NULL COMMENT 'Thời điểm cập nhật',
    CONSTRAINT pk_chat_conversations PRIMARY KEY (id),
    CONSTRAINT fk_chat_conversations_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cuộc hội thoại AI — S12';

CREATE TABLE IF NOT EXISTS chat_messages (
    id                BIGINT      NOT NULL AUTO_INCREMENT,
    conversation_id   BIGINT      NOT NULL COMMENT 'FK — cuộc hội thoại',
    sequence_number   INT         NOT NULL COMMENT 'Số thứ tự lượt hỏi-đáp trong conversation',
    question          TEXT        NOT NULL COMMENT 'Câu hỏi của người dùng',
    response          TEXT        NOT NULL COMMENT 'Phản hồi của AI',
    created_at        DATETIME    NOT NULL COMMENT 'Thời điểm tạo',
    CONSTRAINT pk_chat_messages PRIMARY KEY (id),
    CONSTRAINT uk_chat_messages_conversation_sequence UNIQUE (conversation_id, sequence_number),
    CONSTRAINT fk_chat_messages_conversations_conversation_id FOREIGN KEY (conversation_id) REFERENCES chat_conversations (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lượt hỏi-đáp AI — S12 (một row cho mỗi lượt hỏi-đáp)';
