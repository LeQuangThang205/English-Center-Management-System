package com.englishcenter.service.impl;

import com.englishcenter.dto.request.CreateNotificationRequest;
import com.englishcenter.entity.Notification;
import com.englishcenter.entity.NotificationRecipient;
import com.englishcenter.entity.User;
import com.englishcenter.repository.NotificationRecipientRepository;
import com.englishcenter.repository.NotificationRepository;
import com.englishcenter.service.CourseClassService;
import com.englishcenter.service.NotificationService;
import com.englishcenter.service.RegistrationService;
import com.englishcenter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final UserService userService;
    private final CourseClassService courseClassService;
    private final RegistrationService registrationService;

    @Override
    public Notification create(CreateNotificationRequest request, User currentUser) {
        throw new UnsupportedOperationException("Not implemented");
    }

    @Override
    public List<NotificationRecipient> findAll(User currentUser) {
        throw new UnsupportedOperationException("Not implemented");
    }

    @Override
    public List<NotificationRecipient> findUnread(User currentUser) {
        throw new UnsupportedOperationException("Not implemented");
    }

    @Override
    public NotificationRecipient findDetail(Long notificationId, User currentUser) {
        throw new UnsupportedOperationException("Not implemented");
    }

    @Override
    public long countUnread(User currentUser) {
        throw new UnsupportedOperationException("Not implemented");
    }

    @Override
    public int markAllAsRead(User currentUser) {
        throw new UnsupportedOperationException("Not implemented");
    }

    @Override
    public void delete(Long notificationId, User currentUser) {
        throw new UnsupportedOperationException("Not implemented");
    }
}