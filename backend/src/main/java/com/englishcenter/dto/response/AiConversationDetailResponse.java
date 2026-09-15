package com.englishcenter.dto.response;

import com.englishcenter.entity.AiConversation;
import com.englishcenter.entity.AiMessage;
import com.englishcenter.entity.enums.ConversationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class AiConversationDetailResponse {

    private Long id;
    private ConversationType type;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AiMessageResponse> messages;

    @Data
    @AllArgsConstructor
    @Builder
    public static class AiMessageResponse {
        private Integer sequenceNumber;
        private String question;
        private String response;
        private LocalDateTime createdAt;
    }

    public static AiConversationDetailResponse fromEntity(AiConversation conversation, List<AiMessage> messages) {
        return AiConversationDetailResponse.builder()
                .id(conversation.getId())
                .type(conversation.getType())
                .title(conversation.getTitle())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .messages(messages.stream()
                        .map(m -> AiMessageResponse.builder()
                                .sequenceNumber(m.getSequenceNumber())
                                .question(m.getQuestion())
                                .response(m.getResponse())
                                .createdAt(m.getCreatedAt())
                                .build())
                        .toList())
                .build();
    }
}
