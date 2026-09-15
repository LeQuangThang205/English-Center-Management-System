package com.englishcenter.service;

import com.englishcenter.config.AiProperties;
import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.Transaction;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.ScheduleDay;
import com.englishcenter.entity.enums.TransactionStatus;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.service.ai.AiContextBuilder;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiContextBuilderTest {

    @Mock
    private AiProperties properties;

    @Mock
    private RegistrationService registrationService;

    @Mock
    private TransactionService transactionService;

    @Mock
    private CourseClassService courseClassService;

    @Mock
    private AttendanceService attendanceService;

    @Mock
    private UserService userService;

    private AiContextBuilder contextBuilder;

    private User studentA;
    private User studentB;
    private User teacherA;
    private User teacherB;
    private User admin;
    private Course course;
    private CourseClass classA;
    private CourseClass classB;

    @BeforeEach
    void setUp() {
        contextBuilder = new AiContextBuilder(
                properties, registrationService, transactionService,
                courseClassService, attendanceService, userService);
        when(properties.getMaxContextChars()).thenReturn(20000);

        studentA = user(1L, Role.STUDENT, "studenta@example.com", "Student A");
        studentB = user(2L, Role.STUDENT, "studentb@example.com", "Student B");
        teacherA = user(3L, Role.TEACHER, "teachera@example.com", "Teacher A");
        teacherB = user(4L, Role.TEACHER, "teacherb@example.com", "Teacher B");
        admin = user(5L, Role.ADMIN, "admin@example.com", "Admin");

        course = Course.builder().id(1L).name("English Foundation").tuition(new BigDecimal("1500000")).build();
        classA = courseClass(10L, "Class A", teacherA);
        classB = courseClass(11L, "Class B", teacherB);
    }

    private User user(Long id, Role role, String email, String fullName) {
        return User.builder()
                .id(id).email(email).passwordHash("hashed-secret")
                .fullName(fullName).phone("0123456789")
                .role(role).status(UserStatus.ACTIVE)
                .build();
    }

    private CourseClass courseClass(Long id, String name, User teacher) {
        return CourseClass.builder()
                .id(id).course(course).name(name).teacher(teacher)
                .maxCapacity(20).currentHeadcount(5)
                .scheduleDay(ScheduleDay.MON)
                .startTime(LocalTime.of(18, 0)).endTime(LocalTime.of(20, 0))
                .room("Room 101")
                .startDate(LocalDate.of(2026, 8, 1)).endDate(LocalDate.of(2026, 10, 1))
                .status(ClassStatus.STUDYING)
                .build();
    }

    private Registration registration(Long id, User student, CourseClass cls) {
        return Registration.builder()
                .id(id).student(student).courseClass(cls)
                .status(RegistrationStatus.APPROVED)
                .tuitionAtRegistration(new BigDecimal("1500000"))
                .build();
    }

    @Test
    @DisplayName("STUDENT — context chứa dữ liệu của mình, không chứa của student khác")
    void studentContextScopedToSelf() {
        Registration own = registration(1L, studentA, classA);
        Registration other = registration(2L, studentB, classB);
        when(registrationService.findAllByStudentId(1L)).thenReturn(List.of(own));
        when(transactionService.findAll(null, null, null, studentA)).thenReturn(List.of());
        when(courseClassService.findAll()).thenReturn(List.of(classA, classB));

        String prompt = contextBuilder.buildSystemPrompt(studentA);

        assertThat(prompt).contains("Class A");
        // Lớp tuyển sinh là thông tin công khai nên tên lớp khác được phép xuất hiện;
        // dữ liệu cá nhân của student khác thì không.
        assertThat(prompt).doesNotContain("Student B");
    }

    @Test
    @DisplayName("STUDENT — context không bao giờ chứa password hay hash")
    void studentContextNeverContainsSecrets() {
        when(registrationService.findAllByStudentId(1L)).thenReturn(List.of(registration(1L, studentA, classA)));
        when(transactionService.findAll(null, null, null, studentA)).thenReturn(List.of());
        when(courseClassService.findAll()).thenReturn(List.of(classA));

        String prompt = contextBuilder.buildSystemPrompt(studentA);

        assertThat(prompt.toLowerCase()).doesNotContain("passwordhash");
        assertThat(prompt).doesNotContain("hashed-secret");
    }

    @Test
    @DisplayName("TEACHER — context chỉ chứa lớp mình dạy")
    void teacherContextScopedToOwnClasses() {
        when(courseClassService.findAllByTeacherId(3L)).thenReturn(List.of(classA));
        when(attendanceService.findAll(10L, null, teacherA)).thenReturn(List.of());

        String prompt = contextBuilder.buildSystemPrompt(teacherA);

        assertThat(prompt).contains("Class A");
        assertThat(prompt).doesNotContain("Class B");
        assertThat(prompt.toLowerCase()).doesNotContain("passwordhash");
    }

    @Test
    @DisplayName("ADMIN — context chứa tổng hợp, không chứa chi tiết nhạy cảm")
    void adminContextAggregates() {
        when(userService.findAllByRole(Role.STUDENT)).thenReturn(List.of(studentA, studentB));
        when(userService.findAllByRole(Role.TEACHER)).thenReturn(List.of(teacherA));
        when(courseClassService.findAll()).thenReturn(List.of(classA, classB));
        when(registrationService.findAllByStatus(RegistrationStatus.PENDING)).thenReturn(List.of());
        when(transactionService.findAll(any(), isNull(), isNull(), any())).thenReturn(List.of());

        String prompt = contextBuilder.buildSystemPrompt(admin);

        assertThat(prompt).contains("Học viên: 2");
        assertThat(prompt).contains("Giáo viên: 1");
        assertThat(prompt.toLowerCase()).doesNotContain("passwordhash");
        assertThat(prompt).doesNotContain("hashed-secret");
    }

    @Test
    @DisplayName("Context bị cắt ở maxContextChars")
    void contextTruncated() {
        when(properties.getMaxContextChars()).thenReturn(100);
        when(registrationService.findAllByStudentId(1L)).thenReturn(List.of(registration(1L, studentA, classA)));
        when(transactionService.findAll(null, null, null, studentA)).thenReturn(List.of());
        when(courseClassService.findAll()).thenReturn(List.of(classA));

        String prompt = contextBuilder.buildSystemPrompt(studentA);

        assertThat(prompt.length()).isLessThanOrEqualTo(100);
    }

    @Test
    @DisplayName("Transaction của student xuất hiện với mã và trạng thái, không dư thừa")
    void studentTransactionsIncluded() {
        when(registrationService.findAllByStudentId(1L)).thenReturn(List.of());
        Transaction tx = Transaction.builder()
                .id(7L)
                .registration(registration(1L, studentA, classA))
                .amount(new BigDecimal("1500000"))
                .transactionCode("TXN123")
                .status(TransactionStatus.PENDING_CONFIRMATION)
                .build();
        when(transactionService.findAll(null, null, null, studentA)).thenReturn(List.of(tx));
        when(courseClassService.findAll()).thenReturn(List.of());

        String prompt = contextBuilder.buildSystemPrompt(studentA);

        assertThat(prompt).contains("TXN123");
        assertThat(prompt).contains("PENDING_CONFIRMATION");
    }
}
