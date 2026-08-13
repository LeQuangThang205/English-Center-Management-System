package com.englishcenter.service;

import com.englishcenter.dto.request.CreateNotificationRequest;
import com.englishcenter.entity.Notification;
import com.englishcenter.entity.NotificationRecipient;
import com.englishcenter.entity.User;

import java.util.List;

public interface NotificationService {

    Notification create(CreateNotificationRequest request, User currentUser);

    List<NotificationRecipient> findAll(User currentUser);

    List<NotificationRecipient> findUnread(User currentUser);

    NotificationRecipient findDetail(Long notificationId, User currentUser);

    long countUnread(User currentUser);

    int markAllAsRead(User currentUser);

    void delete(Long notificationId, User currentUser);
}