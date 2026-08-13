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

import java.util.List;

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
}