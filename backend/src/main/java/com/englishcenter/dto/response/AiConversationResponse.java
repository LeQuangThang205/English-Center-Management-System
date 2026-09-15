package com.englishcenter.dto.response;

import com.englishcenter.entity.AiConversation;
import com.englishcenter.entity.enums.ConversationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@Builder
public class AiConversationResponse {

    private Long id;
    private ConversationType type;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AiConversationResponse fromEntity(AiConversation conversation) {
        return AiConversationResponse.builder()
                .id(conversation.getId())
                .type(conversation.getType())
                .title(conversation.getTitle())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }
}
