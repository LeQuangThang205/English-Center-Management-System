package com.englishcenter.dto.response;

import com.englishcenter.entity.Notification;
import com.englishcenter.entity.enums.NotificationTargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private String title;
    private String content;
    private NotificationTargetType targetType;
    private Long targetId;
    private String attachmentUrl;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NotificationResponse fromEntity(Notification notification) {
        NotificationResponseBuilder builder = NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .targetType(notification.getTargetType())
                .targetId(notification.getTargetId())
                .attachmentUrl(notification.getAttachmentUrl())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt());
        if (notification.getCreatedBy() != null) {
            builder.createdById(notification.getCreatedBy().getId());
            builder.createdByName(notification.getCreatedBy().getFullName());
        }
        return builder.build();
    }
}
