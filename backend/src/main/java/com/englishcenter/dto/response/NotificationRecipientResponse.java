package com.englishcenter.dto.response;

import com.englishcenter.entity.NotificationRecipient;
import com.englishcenter.entity.enums.NotificationTargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@Builder
public class NotificationRecipientResponse {
    private Long id;
    private Long notificationId;
    private String title;
    private String content;
    private NotificationTargetType targetType;
    private Long targetId;
    private String attachmentUrl;
    private LocalDateTime createdAt;
    private Boolean isRead;
    private LocalDateTime readAt;

    public static NotificationRecipientResponse fromEntity(NotificationRecipient recipient) {
        return NotificationRecipientResponse.builder()
                .id(recipient.getId())
                .notificationId(recipient.getNotification().getId())
                .title(recipient.getNotification().getTitle())
                .content(recipient.getNotification().getContent())
                .targetType(recipient.getNotification().getTargetType())
                .targetId(recipient.getNotification().getTargetId())
                .attachmentUrl(recipient.getNotification().getAttachmentUrl())
                .createdAt(recipient.getNotification().getCreatedAt())
                .isRead(recipient.getIsRead())
                .readAt(recipient.getReadAt())
                .build();
    }
}
