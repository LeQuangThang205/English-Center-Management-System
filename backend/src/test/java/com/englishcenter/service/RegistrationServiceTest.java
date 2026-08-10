package com.englishcenter.service;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.*;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.CourseClassRepository;
import com.englishcenter.repository.RegistrationRepository;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.service.impl.RegistrationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private RegistrationRepository registrationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CourseClassRepository courseClassRepository;

    private RegistrationService registrationService;

    private User student;
    private User admin;
    private Course course;
    private CourseClass courseClass;
    private Registration registration;

    @BeforeEach
    void setUp() {
        registrationService = new RegistrationServiceImpl(registrationRepository, userRepository, courseClassRepository);
        student = User.builder()
                .id(1L)
                .fullName("Nguyen Van A")
                .email("nguyenvana@example.com")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        admin = User.builder()
                .id(2L)
                .fullName("Admin User")
                .email("admin@example.com")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        course = Course.builder()
                .id(1L)
                .name("English for Beginners")
                .tuition(new BigDecimal("1500000"))
                .level(CourseLevel.BEGINNER)
                .duration(12)
                .build();
        courseClass = CourseClass.builder()
                .id(1L)
                .course(course)
                .name("Morning Class 01")
                .maxCapacity(20)
                .currentHeadcount(5)
                .scheduleDay(ScheduleDay.MON)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 0))
                .room("Room 101")
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 10, 31))
                .status(ClassStatus.UPCOMING)
                .build();
        registration = Registration.builder()
                .id(1L)
                .student(student)
                .courseClass(courseClass)
                .status(RegistrationStatus.PENDING)
                .tuitionAtRegistration(new BigDecimal("1500000"))
                .build();
    }

    @Test
    @DisplayName("create() — đăng ký thành công")
    void createSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(courseClassRepository.findById(1L)).thenReturn(Optional.of(courseClass));
        when(registrationRepository.save(any(Registration.class))).thenReturn(registration);

        Registration created = registrationService.create(registration);

        assertThat(created.getStatus()).isEqualTo(RegistrationStatus.PENDING);
        assertThat(created.getTuitionAtRegistration()).isEqualByComparingTo(new BigDecimal("1500000"));
        verify(registrationRepository).save(registration);
    }

    @Test
    @DisplayName("create() — student không tồn tại ném ResourceNotFoundException")
    void createStudentNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.create(registration))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found with id");
    }

    @Test
    @DisplayName("create() — user không phải STUDENT ném BusinessException")
    void createUserNotStudent() {
        student.setRole(Role.TEACHER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> registrationService.create(registration))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only users with role STUDENT");
    }

    @Test
    @DisplayName("create() — class không tồn tại ném ResourceNotFoundException")
    void createClassNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(courseClassRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.create(registration))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found with id");
    }

    @Test
    @DisplayName("create() — class CANCELLED ném BusinessException")
    void createClassCancelled() {
        courseClass.setStatus(ClassStatus.CANCELLED);
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(courseClassRepository.findById(1L)).thenReturn(Optional.of(courseClass));

        assertThatThrownBy(() -> registrationService.create(registration))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot register");
    }

    @Test
    @DisplayName("findById() — tìm thấy registration")
    void findByIdFound() {
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));

        Registration found = registrationService.findById(1L);

        assertThat(found.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("findById() — không tìm thấy ném ResourceNotFoundException")
    void findByIdNotFound() {
        when(registrationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("findAll() — trả về tất cả registrations")
    void findAll() {
        when(registrationRepository.findAll()).thenReturn(List.of(registration));

        List<Registration> registrations = registrationService.findAll();

        assertThat(registrations).hasSize(1);
    }

    @Test
    @DisplayName("findAllByStudentId() — lọc theo student")
    void findAllByStudentId() {
        when(registrationRepository.findByStudent_Id(1L)).thenReturn(List.of(registration));

        List<Registration> registrations = registrationService.findAllByStudentId(1L);

        assertThat(registrations).hasSize(1);
    }

    @Test
    @DisplayName("findAllByClassId() — lọc theo class")
    void findAllByClassId() {
        when(registrationRepository.findByCourseClass_Id(1L)).thenReturn(List.of(registration));

        List<Registration> registrations = registrationService.findAllByClassId(1L);

        assertThat(registrations).hasSize(1);
    }

    @Test
    @DisplayName("findAllByStatus() — lọc theo trạng thái")
    void findAllByStatus() {
        when(registrationRepository.findByStatus(RegistrationStatus.PENDING)).thenReturn(List.of(registration));

        List<Registration> registrations = registrationService.findAllByStatus(RegistrationStatus.PENDING);

        assertThat(registrations).hasSize(1);
    }

    @Test
    @DisplayName("approve() — duyệt thành công")
    void approveSuccess() {
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Registration result = registrationService.approve(1L, 2L);

        assertThat(result.getStatus()).isEqualTo(RegistrationStatus.APPROVED);
        assertThat(result.getApprovedBy()).isEqualTo(admin);
        assertThat(result.getApprovedAt()).isNotNull();
        assertThat(courseClass.getCurrentHeadcount()).isEqualTo(6);
        verify(courseClassRepository).save(courseClass);
    }

    @Test
    @DisplayName("approve() — không phải PENDING ném BusinessException")
    void approveNotPending() {
        registration.setStatus(RegistrationStatus.APPROVED);
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> registrationService.approve(1L, 2L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only PENDING registrations");
    }

    @Test
    @DisplayName("approve() — class đầy ném BusinessException")
    void approveFullClass() {
        courseClass.setMaxCapacity(5);
        courseClass.setCurrentHeadcount(5);
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> registrationService.approve(1L, 2L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("full capacity");
    }

    @Test
    @DisplayName("approve() — approver không tồn tại ném ResourceNotFoundException")
    void approveApproverNotFound() {
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.approve(1L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("reject() — từ chối thành công")
    void rejectSuccess() {
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Registration result = registrationService.reject(1L, 2L, "Class is full");

        assertThat(result.getStatus()).isEqualTo(RegistrationStatus.REJECTED);
        assertThat(result.getRejectedBy()).isEqualTo(admin);
        assertThat(result.getRejectedAt()).isNotNull();
        assertThat(result.getRejectionReason()).isEqualTo("Class is full");
    }

    @Test
    @DisplayName("reject() — không phải PENDING ném BusinessException")
    void rejectNotPending() {
        registration.setStatus(RegistrationStatus.APPROVED);
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> registrationService.reject(1L, 2L, "reason"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only PENDING registrations");
    }

    @Test
    @DisplayName("cancel() — hủy registration PENDING thành công")
    void cancelPending() {
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Registration result = registrationService.cancel(1L);

        assertThat(result.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
    }

    @Test
    @DisplayName("cancel() — hủy PAID ném BusinessException")
    void cancelPaid() {
        registration.setStatus(RegistrationStatus.PAID);
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));

        assertThatThrownBy(() -> registrationService.cancel(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot cancel a PAID registration");
    }

    @Test
    @DisplayName("markPaid() — đánh dấu đã thanh toán thành công")
    void markPaidSuccess() {
        registration.setStatus(RegistrationStatus.APPROVED);
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Registration result = registrationService.markPaid(1L);

        assertThat(result.getStatus()).isEqualTo(RegistrationStatus.PAID);
        assertThat(result.getPaidAt()).isNotNull();
    }

    @Test
    @DisplayName("markPaid() — không phải APPROVED ném BusinessException")
    void markPaidNotApproved() {
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));

        assertThatThrownBy(() -> registrationService.markPaid(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only APPROVED registrations");
    }
}
