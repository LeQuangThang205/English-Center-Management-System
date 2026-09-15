package com.englishcenter.service.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatRequest {

    /**
     * System prompt: vai trò + quy tắc + context dữ liệu trong phạm vi role.
     */
    private String systemPrompt;

    /**
     * Câu hỏi của người dùng.
     */
    private String userMessage;

    /**
     * Số token tối đa cho câu trả lời.
     */
    private int maxOutputTokens;
}
