package com.englishcenter.service;

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
import com.englishcenter.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationRecipientRepository notificationRecipientRepository;

    @Mock
    private UserService userService;

    @Mock
    private CourseClassService courseClassService;

    @Mock
    private RegistrationService registrationService;

    private NotificationService notificationService;

    private User admin;
    private User teacher;
    private User activeStudent;
    private User inactiveStudent;
    private User activeTeacher;
    private CourseClass courseClass;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(
                notificationRepository, notificationRecipientRepository,
                userService, courseClassService, registrationService);
        admin = User.builder()
                .id(1L)
                .fullName("Admin")
                .email("admin@example.com")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        teacher = User.builder()
                .id(2L)
                .fullName("Tran Thi B")
                .email("tranthib@example.com")
                .role(Role.TEACHER)
                .status(UserStatus.ACTIVE)
                .build();
        activeStudent = User.builder()
                .id(3L)
                .fullName("Nguyen Van A")
                .email("nguyenvana@example.com")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        inactiveStudent = User.builder()
                .id(4L)
                .fullName("Le Van C")
                .email("levanc@example.com")
                .role(Role.STUDENT)
                .status(UserStatus.INACTIVE)
                .build();
        activeTeacher = User.builder()
                .id(5L)
                .fullName("Pham Van D")
                .email("phamvand@example.com")
                .role(Role.TEACHER)
                .status(UserStatus.ACTIVE)
                .build();
        courseClass = CourseClass.builder()
                .id(10L)
                .name("Morning Class 01")
                .teacher(teacher)
                .build();
    }

    private CreateNotificationRequest request(NotificationTargetType type, Long targetId) {
        return new CreateNotificationRequest("Thong bao", "Noi dung", type, targetId, null);
    }

    @SuppressWarnings("unchecked")
    private List<NotificationRecipient> capturedRecipients() {
        ArgumentCaptor<List<NotificationRecipient>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRecipientRepository).saveAll(captor.capture());
        return captor.getValue();
    }

    @Test
    @DisplayName("create() — user không phải ADMIN bị từ chối AccessDeniedException")
    void createNonAdminDenied() {
        assertThatThrownBy(() -> notificationService.create(
                request(NotificationTargetType.ALL_STUDENTS, null), teacher))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Access denied");
        verify(notificationRepository, never()).save(any());
        verify(notificationRecipientRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("create() — ALL_STUDENTS chỉ nhận STUDENT có status ACTIVE")
    void createAllStudentsOnlyActive() {
        when(userService.findAllByRole(Role.STUDENT))
                .thenReturn(List.of(activeStudent, inactiveStudent));

        Notification created = notificationService.create(
                request(NotificationTargetType.ALL_STUDENTS, null), admin);

        assertThat(created.getTargetType()).isEqualTo(NotificationTargetType.ALL_STUDENTS);
        assertThat(created.getCreatedBy().getId()).isEqualTo(1L);
        List<NotificationRecipient> recipients = capturedRecipients();
        assertThat(recipients).hasSize(1);
        assertThat(recipients.get(0).getUser().getId()).isEqualTo(3L);
        assertThat(recipients.get(0).getIsRead()).isFalse();
    }

    @Test
    @DisplayName("create() — ALL_TEACHERS chỉ nhận TEACHER có status ACTIVE")
    void createAllTeachersOnlyActive() {
        when(userService.findAllByRole(Role.TEACHER))
                .thenReturn(List.of(activeTeacher, teacher, User.builder()
                        .id(6L)
                        .fullName("Inactive Teacher")
                        .email("inactiveteacher@example.com")
                        .role(Role.TEACHER)
                        .status(UserStatus.INACTIVE)
                        .build()));

        notificationService.create(request(NotificationTargetType.ALL_TEACHERS, null), admin);

        List<NotificationRecipient> recipients = capturedRecipients();
        assertThat(recipients).hasSize(2);
        assertThat(recipients)
                .extracting(r -> r.getUser().getId())
                .containsExactlyInAnyOrder(5L, 2L);
    }

    @Test
    @DisplayName("create() — ALL_STUDENTS/ALL_TEACHERS truyền targetId thì bị BusinessException")
    void createAllTypesWithTargetIdRejected() {
        assertThatThrownBy(() -> notificationService.create(
                request(NotificationTargetType.ALL_STUDENTS, 10L), admin))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("targetId");
        assertThatThrownBy(() -> notificationService.create(
                request(NotificationTargetType.ALL_TEACHERS, 10L), admin))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("targetId");
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("create() — SPECIFIC_USER tạo đúng 1 recipient, không giới hạn role")
    void createSpecificUser() {
        when(userService.findById(2L)).thenReturn(teacher);

        notificationService.create(request(NotificationTargetType.SPECIFIC_USER, 2L), admin);

        List<NotificationRecipient> recipients = capturedRecipients();
        assertThat(recipients).hasSize(1);
        assertThat(recipients.get(0).getUser().getId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("create() — SPECIFIC_USER user không tồn tại ném ResourceNotFoundException")
    void createSpecificUserNotFound() {
        when(userService.findById(99L))
                .thenThrow(new com.englishcenter.exception.ResourceNotFoundException("User", 99L));

        assertThatThrownBy(() -> notificationService.create(
                request(NotificationTargetType.SPECIFIC_USER, 99L), admin))
                .isInstanceOf(com.englishcenter.exception.ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("create() — SPECIFIC_CLASS nhận student APPROVED/PAID + teacher, bỏ REJECTED, dedupe")
    void createSpecificClassResolvesRecipients() {
        User studentB = User.builder()
                .id(7L)
                .fullName("Student B")
                .email("studentb@example.com")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        when(courseClassService.findById(10L)).thenReturn(courseClass);
        when(registrationService.findAllByClassId(10L)).thenReturn(List.of(
                Registration.builder().student(activeStudent).status(RegistrationStatus.APPROVED).build(),
                Registration.builder().student(teacher).status(RegistrationStatus.PAID).build(),
                Registration.builder().student(studentB).status(RegistrationStatus.REJECTED).build()));

        notificationService.create(request(NotificationTargetType.SPECIFIC_CLASS, 10L), admin);

        List<NotificationRecipient> recipients = capturedRecipients();
        assertThat(recipients).hasSize(2);
        assertThat(recipients)
                .extracting(r -> r.getUser().getId())
                .containsExactlyInAnyOrder(3L, 2L);
    }

    @Test
    @DisplayName("create() — SPECIFIC_CLASS không có recipient hợp lệ thì bị BusinessException")
    void createSpecificClassNoRecipients() {
        courseClass.setTeacher(null);
        when(courseClassService.findById(10L)).thenReturn(courseClass);
        when(registrationService.findAllByClassId(10L)).thenReturn(List.of(
                Registration.builder().student(activeStudent).status(RegistrationStatus.PENDING).build(),
                Registration.builder().student(inactiveStudent).status(RegistrationStatus.REJECTED).build()));

        assertThatThrownBy(() -> notificationService.create(
                request(NotificationTargetType.SPECIFIC_CLASS, 10L), admin))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No valid recipients");
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("create() — SPECIFIC_CLASS/SPECIFIC_USER thiếu targetId thì bị BusinessException")
    void createTargetIdRequired() {
        assertThatThrownBy(() -> notificationService.create(
                request(NotificationTargetType.SPECIFIC_CLASS, null), admin))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("targetId");
        assertThatThrownBy(() -> notificationService.create(
                request(NotificationTargetType.SPECIFIC_USER, null), admin))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("targetId");
        verify(notificationRepository, never()).save(any());
    }

    private NotificationRecipient recipient(Long id, Long notificationId, LocalDateTime createdAt, boolean read) {
        Notification notification = Notification.builder()
                .id(notificationId)
                .title("Thong bao " + notificationId)
                .content("Noi dung " + notificationId)
                .targetType(NotificationTargetType.ALL_STUDENTS)
                .createdAt(createdAt)
                .build();
        return NotificationRecipient.builder()
                .id(id)
                .notification(notification)
                .user(activeStudent)
                .isRead(read)
                .build();
    }

    @Test
    @DisplayName("findAll() — trả đúng danh sách recipient mới nhất trước (user hiện tại)")
    void findAllReturnsNewestFirst() {
        LocalDateTime now = LocalDateTime.now();
        NotificationRecipient newest = recipient(1L, 3L, now.minusHours(1), true);
        NotificationRecipient older = recipient(2L, 2L, now.minusDays(1), false);
        NotificationRecipient oldest = recipient(3L, 1L, now.minusDays(2), true);
        when(notificationRecipientRepository.findByUser_IdOrderByNotification_CreatedAtDesc(3L))
                .thenReturn(List.of(newest, older, oldest));

        List<NotificationRecipient> result = notificationService.findAll(activeStudent);

        assertThat(result).hasSize(3);
        assertThat(result).containsExactly(newest, older, oldest);
        verify(notificationRecipientRepository).findByUser_IdOrderByNotification_CreatedAtDesc(3L);
    }

    @Test
    @DisplayName("findUnread() — chỉ trả các notification chưa đọc (isRead = false)")
    void findUnreadReturnsOnlyUnread() {
        NotificationRecipient unread = recipient(1L, 3L, LocalDateTime.now().minusHours(1), false);
        when(notificationRecipientRepository.findByUser_IdAndIsReadFalse(3L))
                .thenReturn(List.of(unread));

        List<NotificationRecipient> result = notificationService.findUnread(activeStudent);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getIsRead()).isFalse();
        verify(notificationRecipientRepository).findByUser_IdAndIsReadFalse(3L);
    }

    @Test
    @DisplayName("findAll()/findUnread() — không có notification trả về empty list")
    void findAllAndUnreadEmpty() {
        when(notificationRecipientRepository.findByUser_IdOrderByNotification_CreatedAtDesc(3L))
                .thenReturn(List.of());
        when(notificationRecipientRepository.findByUser_IdAndIsReadFalse(3L))
                .thenReturn(List.of());

        assertThat(notificationService.findAll(activeStudent)).isEmpty();
        assertThat(notificationService.findUnread(activeStudent)).isEmpty();
    }

    @Test
    @DisplayName("findAll()/findUnread() — repository luôn được gọi với đúng userId của currentUser")
    void findAllAndUnreadUseCurrentUserId() {
        notificationService.findAll(activeStudent);
        notificationService.findUnread(activeStudent);

        verify(notificationRecipientRepository).findByUser_IdOrderByNotification_CreatedAtDesc(3L);
        verify(notificationRecipientRepository).findByUser_IdAndIsReadFalse(3L);
        verify(notificationRecipientRepository, never())
                .findByUser_IdOrderByNotification_CreatedAtDesc(activeStudent.getId() + 1L);
    }

    @Test
    @DisplayName("findDetail() — recipient chưa đọc: đánh dấu isRead=true, set readAt, và save")
    void findDetailMarksAsReadWhenUnread() {
        NotificationRecipient unread = recipient(1L, 5L, LocalDateTime.now().minusHours(1), false);
        when(notificationRecipientRepository.findByNotification_IdAndUser_Id(5L, 3L))
                .thenReturn(Optional.of(unread));

        NotificationRecipient result = notificationService.findDetail(5L, activeStudent);

        assertThat(result.getIsRead()).isTrue();
        assertThat(result.getReadAt()).isNotNull();
        verify(notificationRecipientRepository).findByNotification_IdAndUser_Id(5L, 3L);
        verify(notificationRecipientRepository).save(unread);
    }

    @Test
    @DisplayName("findDetail() — recipient đã đọc: trả recipient, không thay đổi readAt, không save")
    void findDetailAlreadyReadDoesNotChangeReadAt() {
        LocalDateTime readAt = LocalDateTime.now().minusDays(1);
        NotificationRecipient read = recipient(2L, 6L, LocalDateTime.now().minusHours(2), true);
        read.setReadAt(readAt);
        when(notificationRecipientRepository.findByNotification_IdAndUser_Id(6L, 3L))
                .thenReturn(Optional.of(read));

        NotificationRecipient result = notificationService.findDetail(6L, activeStudent);

        assertThat(result.getReadAt()).isEqualTo(readAt);
        assertThat(result.getIsRead()).isTrue();
        verify(notificationRecipientRepository, never()).save(any());
    }

    @Test
    @DisplayName("findDetail() — notification không thuộc user hiện tại ném ResourceNotFoundException")
    void findDetailNotBelongingToUser() {
        when(notificationRecipientRepository.findByNotification_IdAndUser_Id(99L, 3L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.findDetail(99L, activeStudent))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(notificationRecipientRepository, never()).save(any());
    }

    @Test
    @DisplayName("countUnread() — user có 3 notification chưa đọc trả về 3")
    void countUnreadReturnsThree() {
        when(notificationRecipientRepository.countByUser_IdAndIsReadFalse(3L)).thenReturn(3L);

        assertThat(notificationService.countUnread(activeStudent)).isEqualTo(3L);
        verify(notificationRecipientRepository).countByUser_IdAndIsReadFalse(3L);
    }

    @Test
    @DisplayName("countUnread() — user không có notification chưa đọc trả về 0")
    void countUnreadZero() {
        when(notificationRecipientRepository.countByUser_IdAndIsReadFalse(3L)).thenReturn(0L);

        assertThat(notificationService.countUnread(activeStudent)).isZero();
        verify(notificationRecipientRepository).countByUser_IdAndIsReadFalse(3L);
    }

    @Test
    @DisplayName("countUnread() — repository được gọi với đúng userId của currentUser")
    void countUnreadUsesCurrentUserId() {
        when(notificationRecipientRepository.countByUser_IdAndIsReadFalse(3L)).thenReturn(0L);

        notificationService.countUnread(activeStudent);

        verify(notificationRecipientRepository).countByUser_IdAndIsReadFalse(3L);
        verify(notificationRecipientRepository, never()).countByUser_IdAndIsReadFalse(activeStudent.getId() + 1L);
    }

    @Test
    @DisplayName("countUnread() — service trả nguyên giá trị repository trả về")
    void countUnreadReturnsRepositoryValue() {
        when(notificationRecipientRepository.countByUser_IdAndIsReadFalse(3L)).thenReturn(7L);

        assertThat(notificationService.countUnread(activeStudent)).isEqualTo(7L);
    }

    @Test
    @DisplayName("markAllAsRead() — 3 notification chưa đọc: trả 3, cả 3 isRead=true và readAt khác null")
    void markAllAsReadUpdatesAllUnread() {
        NotificationRecipient r1 = recipient(1L, 1L, LocalDateTime.now().minusDays(3), false);
        NotificationRecipient r2 = recipient(2L, 2L, LocalDateTime.now().minusDays(2), false);
        NotificationRecipient r3 = recipient(3L, 3L, LocalDateTime.now().minusDays(1), false);
        when(notificationRecipientRepository.findByUser_IdAndIsReadFalse(3L))
                .thenReturn(List.of(r1, r2, r3));

        int marked = notificationService.markAllAsRead(activeStudent);

        assertThat(marked).isEqualTo(3);
        assertThat(r1.getIsRead()).isTrue();
        assertThat(r2.getIsRead()).isTrue();
        assertThat(r3.getIsRead()).isTrue();
        assertThat(r1.getReadAt()).isNotNull();
        assertThat(r2.getReadAt()).isNotNull();
        assertThat(r3.getReadAt()).isNotNull();
        verify(notificationRecipientRepository).findByUser_IdAndIsReadFalse(3L);
        verify(notificationRecipientRepository, times(1)).saveAll(List.of(r1, r2, r3));
    }

    @Test
    @DisplayName("markAllAsRead() — không có notification chưa đọc: trả 0 và never saveAll")
    void markAllAsReadNoUnread() {
        when(notificationRecipientRepository.findByUser_IdAndIsReadFalse(3L)).thenReturn(List.of());

        assertThat(notificationService.markAllAsRead(activeStudent)).isZero();
        verify(notificationRecipientRepository).findByUser_IdAndIsReadFalse(3L);
        verify(notificationRecipientRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("markAllAsRead() — repository được gọi với đúng userId của currentUser")
    void markAllAsReadUsesCurrentUserId() {
        when(notificationRecipientRepository.findByUser_IdAndIsReadFalse(3L)).thenReturn(List.of());

        notificationService.markAllAsRead(activeStudent);

        verify(notificationRecipientRepository).findByUser_IdAndIsReadFalse(3L);
        verify(notificationRecipientRepository, never()).findByUser_IdAndIsReadFalse(activeStudent.getId() + 1L);
    }

    @Test
    @DisplayName("markAllAsRead() — mọi recipient trong danh sách đều được cập nhật và saveAll đúng 1 lần")
    void markAllAsReadUpdatesEveryRecipientAndSavesOnce() {
        List<NotificationRecipient> unread = List.of(
                recipient(1L, 1L, LocalDateTime.now().minusDays(3), false),
                recipient(2L, 2L, LocalDateTime.now().minusDays(2), false),
                recipient(3L, 3L, LocalDateTime.now().minusDays(1), false),
                recipient(4L, 4L, LocalDateTime.now().minusHours(1), false));
        when(notificationRecipientRepository.findByUser_IdAndIsReadFalse(3L)).thenReturn(unread);

        notificationService.markAllAsRead(activeStudent);

        assertThat(unread).allSatisfy(r -> {
            assertThat(r.getIsRead()).isTrue();
            assertThat(r.getReadAt()).isNotNull();
        });
        verify(notificationRecipientRepository, times(1)).saveAll(any());
    }
}