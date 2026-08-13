package com.englishcenter.controller;

import com.englishcenter.dto.request.CreateNotificationRequest;
import com.englishcenter.dto.response.ApiResponse;
import com.englishcenter.dto.response.NotificationRecipientResponse;
import com.englishcenter.dto.response.NotificationResponse;
import com.englishcenter.entity.Notification;
import com.englishcenter.entity.NotificationRecipient;
import com.englishcenter.entity.User;
import com.englishcenter.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<ApiResponse<NotificationResponse>> create(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CreateNotificationRequest request) {
        Notification notification = notificationService.create(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(NotificationResponse.fromEntity(notification), "Notification sent successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationRecipientResponse>>> findAll(
            @AuthenticationPrincipal User currentUser) {
        List<NotificationRecipientResponse> response = notificationService.findAll(currentUser)
                .stream()
                .map(NotificationRecipientResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationRecipientResponse>>> findUnread(
            @AuthenticationPrincipal User currentUser) {
        List<NotificationRecipientResponse> response = notificationService.findUnread(currentUser)
                .stream()
                .map(NotificationRecipientResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Long>> countUnread(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.countUnread(currentUser)));
    }

    @GetMapping("/{notificationId}")
    public ResponseEntity<ApiResponse<NotificationRecipientResponse>> findDetail(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal User currentUser) {
        NotificationRecipient recipient = notificationService.findDetail(notificationId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(NotificationRecipientResponse.fromEntity(recipient)));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead(
            @AuthenticationPrincipal User currentUser) {
        int marked = notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok(ApiResponse.success(marked, "Marked " + marked + " notifications as read"));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal User currentUser) {
        notificationService.delete(notificationId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
