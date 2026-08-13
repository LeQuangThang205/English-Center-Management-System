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
import com.englishcenter.exception.ResourceNotFoundException;
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
import java.time.LocalDateTime;

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
        return notificationRecipientRepository.findByUser_IdOrderByNotification_CreatedAtDesc(currentUser.getId());
    }

    @Override
    public List<NotificationRecipient> findUnread(User currentUser) {
        return notificationRecipientRepository.findByUser_IdAndIsReadFalse(currentUser.getId());
    }

    @Override
    @Transactional
    public NotificationRecipient findDetail(Long notificationId, User currentUser) {
        NotificationRecipient recipient = notificationRecipientRepository
                .findByNotification_IdAndUser_Id(notificationId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        if (!recipient.getIsRead()) {
            recipient.setIsRead(true);
            recipient.setReadAt(LocalDateTime.now());
            notificationRecipientRepository.save(recipient);
        }
        return recipient;
    }

    @Override
    public long countUnread(User currentUser) {
        return notificationRecipientRepository.countByUser_IdAndIsReadFalse(currentUser.getId());
    }

    @Override
    @Transactional
    public int markAllAsRead(User currentUser) {
        List<NotificationRecipient> unread = notificationRecipientRepository
                .findByUser_IdAndIsReadFalse(currentUser.getId());
        if (unread.isEmpty()) {
            return 0;
        }
        LocalDateTime now = LocalDateTime.now();
        unread.forEach(recipient -> {
            recipient.setIsRead(true);
            recipient.setReadAt(now);
        });
        notificationRecipientRepository.saveAll(unread);
        return unread.size();
    }

    @Override
    @Transactional
    public void delete(Long notificationId, User currentUser) {
        notificationRecipientRepository
                .findByNotification_IdAndUser_Id(notificationId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        notificationRecipientRepository.deleteByNotification_IdAndUser_Id(notificationId, currentUser.getId());
    }
}