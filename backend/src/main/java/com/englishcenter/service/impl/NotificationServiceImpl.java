package com.englishcenter.service.impl;

import com.englishcenter.dto.request.CreateNotificationRequest;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Notification;
import com.englishcenter.entity.NotificationRecipient;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.NotificationTargetType;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.repository.NotificationRecipientRepository;
import com.englishcenter.repository.NotificationRepository;
import com.englishcenter.service.CourseClassService;
import com.englishcenter.service.NotificationService;
import com.englishcenter.service.RegistrationService;
import com.englishcenter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final UserService userService;
    private final CourseClassService courseClassService;
    private final RegistrationService registrationService;

    @Override
    @Transactional
    public Notification create(CreateNotificationRequest request, User currentUser) {
        requireAdmin(currentUser);
        List<User> recipients = resolveRecipients(request.getTargetType(), request.getTargetId());
        Notification notification = Notification.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .attachmentUrl(request.getAttachmentUrl())
                .createdBy(currentUser)
                .build();
        notificationRepository.save(notification);
        List<NotificationRecipient> recipientEntities = recipients.stream()
                .map(user -> NotificationRecipient.builder()
                        .notification(notification)
                        .user(user)
                        .isRead(false)
                        .build())
                .toList();
        notificationRecipientRepository.saveAll(recipientEntities);
        return notification;
    }

    private List<User> resolveRecipients(NotificationTargetType targetType, Long targetId) {
        return switch (targetType) {
            case ALL_STUDENTS -> {
                requireNoTargetId(targetId);
                yield activeUsersByRole(Role.STUDENT);
            }
            case ALL_TEACHERS -> {
                requireNoTargetId(targetId);
                yield activeUsersByRole(Role.TEACHER);
            }
            case SPECIFIC_CLASS -> {
                requireTargetId(targetId);
                yield resolveClassRecipients(targetId);
            }
            case SPECIFIC_USER -> {
                requireTargetId(targetId);
                yield List.of(userService.findById(targetId));
            }
        };
    }

    private List<User> resolveClassRecipients(Long classId) {
        CourseClass courseClass = courseClassService.findById(classId);
        List<User> recipients = new ArrayList<>();
        registrationService.findAllByClassId(classId).stream()
                .filter(r -> r.getStatus() == RegistrationStatus.APPROVED || r.getStatus() == RegistrationStatus.PAID)
                .map(Registration::getStudent)
                .forEach(recipients::add);
        if (courseClass.getTeacher() != null) {
            recipients.add(courseClass.getTeacher());
        }
        Set<Long> seen = new HashSet<>();
        List<User> deduped = recipients.stream()
                .filter(user -> seen.add(user.getId()))
                .toList();
        if (deduped.isEmpty()) {
            throw new BusinessException("No valid recipients");
        }
        return deduped;
    }

    private List<User> activeUsersByRole(Role role) {
        return userService.findAllByRole(role).stream()
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .toList();
    }

    private void requireAdmin(User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private void requireTargetId(Long targetId) {
        if (targetId == null) {
            throw new BusinessException("targetId is required for this target type");
        }
    }

    private void requireNoTargetId(Long targetId) {
        if (targetId != null) {
            throw new BusinessException("targetId must not be provided for this target type");
        }
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