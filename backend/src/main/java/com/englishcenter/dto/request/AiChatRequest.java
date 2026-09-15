package com.englishcenter.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatRequest {

    @NotBlank(message = "Message must not be blank")
    private String message;

    /**
     * Id conversation hiện có (để tiếp tục hội thoại). Null = tạo hội thoại mới.
     */
    private Long conversationId;
}
