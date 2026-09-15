package com.englishcenter.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class AiChatResponse {

    private String reply;

    private Long conversationId;

    /**
     * True khi lượt hỏi-đáp đã được lưu vào lịch sử. False khi lưu thất bại —
     * FE phải báo rõ cho user rằng history không được lưu (không giả vờ đã lưu).
     */
    private boolean historySaved;

    /**
     * Thông báo bổ sung cho user (ví dụ khi lưu history thất bại). Null khi mọi thứ ổn.
     */
    private String notice;
}
