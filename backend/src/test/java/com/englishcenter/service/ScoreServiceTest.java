package com.englishcenter.service;

import com.englishcenter.dto.request.CreateScoreRequest;
import com.englishcenter.dto.request.UpdateScoreRequest;
import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.Score;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.ScheduleDay;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.ScoreRepository;
import com.englishcenter.service.impl.ScoreServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

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
class ScoreServiceTest {

    @Mock
    private ScoreRepository scoreRepository;

    @Mock
    private UserService userService;

    @Mock
    private CourseClassService courseClassService;

    @Mock
    private RegistrationService registrationService;

    private ScoreService scoreService;

    private Course course;
    private User teacher;
    private User student;
    private CourseClass courseClass;
    private Score score;

    @BeforeEach
    void setUp() {
        scoreService = new ScoreServiceImpl(scoreRepository, userService, courseClassService, registrationService);
        course = Course.builder()
                .id(1L)
                .name("English for Beginners")
                .tuition(new BigDecimal("1500000"))
                .level(CourseLevel.BEGINNER)
                .duration(12)
                .build();
        teacher = User.builder()
                .id(2L)
                .fullName("Tran Thi B")
                .email("tranthib@example.com")
                .role(Role.TEACHER)
                .build();
        student = User.builder()
                .id(3L)
                .fullName("Nguyen Van A")
                .email("nguyenvana@example.com")
                .role(Role.STUDENT)
                .build();
        courseClass = CourseClass.builder()
                .id(1L)
                .course(course)
                .name("Morning Class 01")
                .teacher(teacher)
                .maxCapacity(20)
                .currentHeadcount(0)
                .scheduleDay(ScheduleDay.MON)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 0))
                .room("Room 101")
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 10, 31))
                .status(ClassStatus.STUDYING)
                .build();
        score = Score.builder()
                .id(1L)
                .student(student)
                .courseClass(courseClass)
                .midtermScore(new BigDecimal("8.0"))
                .finalScore(new BigDecimal("9.0"))
                .totalScore(new BigDecimal("8.6"))
                .comment("Good")
                .createdBy(teacher)
                .build();
    }

    private Registration approvedRegistration() {
        return Registration.builder()
                .student(student)
                .courseClass(courseClass)
                .status(RegistrationStatus.APPROVED)
                .build();
    }

    @Test
    @DisplayName("create() — teacher nhập điểm lớp mình thành công, total_score tự tính (8*0.4+9*0.6=8.6)")
    void createSuccess() {
        when(userService.findById(3L)).thenReturn(student);
        when(courseClassService.findById(1L)).thenReturn(courseClass);
        when(registrationService.findAllByClassId(1L)).thenReturn(List.of(approvedRegistration()));
        when(scoreRepository.findByStudent_IdAndCourseClass_Id(3L, 1L)).thenReturn(Optional.empty());
        when(scoreRepository.save(any(Score.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Score created = scoreService.create(
                new CreateScoreRequest(3L, 1L, new BigDecimal("8.0"), new BigDecimal("9.0"), "Good"),
                teacher);

        assertThat(created.getMidtermScore()).isEqualByComparingTo(new BigDecimal("8.0"));
        assertThat(created.getFinalScore()).isEqualByComparingTo(new BigDecimal("9.0"));
        assertThat(created.getTotalScore()).isEqualByComparingTo(new BigDecimal("8.6"));
        assertThat(created.getCreatedBy().getId()).isEqualTo(2L);
        verify(scoreRepository).save(any(Score.class));
    }

    @Test
    @DisplayName("create() — cặp student+class đã có điểm thì cập nhật (upsert) và tính lại total")
    void createUpdatesExistingScore() {
        Score existing = Score.builder()
                .id(1L)
                .student(student)
                .courseClass(courseClass)
                .midtermScore(new BigDecimal("5.0"))
                .finalScore(new BigDecimal("5.0"))
                .totalScore(new BigDecimal("5.0"))
                .createdBy(teacher)
                .build();
        when(userService.findById(3L)).thenReturn(student);
        when(courseClassService.findById(1L)).thenReturn(courseClass);
        when(registrationService.findAllByClassId(1L)).thenReturn(List.of(approvedRegistration()));
        when(scoreRepository.findByStudent_IdAndCourseClass_Id(3L, 1L)).thenReturn(Optional.of(existing));
        when(scoreRepository.save(any(Score.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Score updated = scoreService.create(
                new CreateScoreRequest(3L, 1L, new BigDecimal("8.0"), new BigDecimal("9.0"), "Better"),
                teacher);

        assertThat(updated.getId()).isEqualTo(1L);
        assertThat(updated.getMidtermScore()).isEqualByComparingTo(new BigDecimal("8.0"));
        assertThat(updated.getTotalScore()).isEqualByComparingTo(new BigDecimal("8.6"));
        verify(scoreRepository).save(existing);
    }

    @Test
    @DisplayName("create() — chỉ nhập một trong hai điểm thì total_score = null")
    void createTotalNullWhenScoreMissing() {
        when(userService.findById(3L)).thenReturn(student);
        when(courseClassService.findById(1L)).thenReturn(courseClass);
        when(registrationService.findAllByClassId(1L)).thenReturn(List.of(approvedRegistration()));
        when(scoreRepository.findByStudent_IdAndCourseClass_Id(3L, 1L)).thenReturn(Optional.empty());
        when(scoreRepository.save(any(Score.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Score created = scoreService.create(
                new CreateScoreRequest(3L, 1L, new BigDecimal("8.0"), null, null),
                teacher);

        assertThat(created.getMidtermScore()).isEqualByComparingTo(new BigDecimal("8.0"));
        assertThat(created.getTotalScore()).isNull();
    }

    @Test
    @DisplayName("create() — student không tồn tại ném ResourceNotFoundException")
    void createStudentNotFound() {
        when(userService.findById(99L)).thenThrow(new ResourceNotFoundException("User", 99L));

        assertThatThrownBy(() -> scoreService.create(
                new CreateScoreRequest(99L, 1L, new BigDecimal("8.0"), new BigDecimal("9.0"), null), teacher))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found with id");
    }

    @Test
    @DisplayName("create() — user không phải STUDENT ném BusinessException")
    void createNonStudent() {
        when(userService.findById(2L)).thenReturn(teacher);

        assertThatThrownBy(() -> scoreService.create(
                new CreateScoreRequest(2L, 1L, new BigDecimal("8.0"), new BigDecimal("9.0"), null), teacher))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("role STUDENT");
    }

    @Test
    @DisplayName("create() — class không tồn tại ném ResourceNotFoundException")
    void createClassNotFound() {
        when(userService.findById(3L)).thenReturn(student);
        when(courseClassService.findById(99L)).thenThrow(new ResourceNotFoundException("CourseClass", 99L));

        assertThatThrownBy(() -> scoreService.create(
                new CreateScoreRequest(3L, 99L, new BigDecimal("8.0"), new BigDecimal("9.0"), null), teacher))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found with id");
    }

    @Test
    @DisplayName("create() — teacher không được phân công lớp ném AccessDeniedException")
    void createNotAssignedTeacher() {
        User otherTeacher = User.builder().id(4L).role(Role.TEACHER).build();
        when(userService.findById(3L)).thenReturn(student);
        when(courseClassService.findById(1L)).thenReturn(courseClass);

        assertThatThrownBy(() -> scoreService.create(
                new CreateScoreRequest(3L, 1L, new BigDecimal("8.0"), new BigDecimal("9.0"), null), otherTeacher))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("create() — lớp chưa khai giảng (UPCOMING) ném BusinessException")
    void createClassUpcoming() {
        CourseClass upcoming = CourseClass.builder()
                .id(1L)
                .course(course)
                .name("Morning Class 01")
                .teacher(teacher)
                .status(ClassStatus.UPCOMING)
                .build();
        when(userService.findById(3L)).thenReturn(student);
        when(courseClassService.findById(1L)).thenReturn(upcoming);

        assertThatThrownBy(() -> scoreService.create(
                new CreateScoreRequest(3L, 1L, new BigDecimal("8.0"), new BigDecimal("9.0"), null), teacher))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("STUDYING or FINISHED");
    }

    @Test
    @DisplayName("create() — student chưa APPROVED/PAID trong lớp ném BusinessException")
    void createStudentNotEnrolled() {
        Registration pending = Registration.builder()
                .student(student)
                .courseClass(courseClass)
                .status(RegistrationStatus.PENDING)
                .build();
        when(userService.findById(3L)).thenReturn(student);
        when(courseClassService.findById(1L)).thenReturn(courseClass);
        when(registrationService.findAllByClassId(1L)).thenReturn(List.of(pending));

        assertThatThrownBy(() -> scoreService.create(
                new CreateScoreRequest(3L, 1L, new BigDecimal("8.0"), new BigDecimal("9.0"), null), teacher))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not enrolled");
    }

    @Test
    @DisplayName("findById() — admin xem điểm bất kỳ trả về 200")
    void findByIdAdmin() {
        User admin = User.builder().id(9L).role(Role.ADMIN).build();
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(score));

        Score found = scoreService.findById(1L, admin);

        assertThat(found.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("findById() — teacher xem điểm lớp mình được phép")
    void findByIdTeacherOwnClass() {
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(score));

        Score found = scoreService.findById(1L, teacher);

        assertThat(found.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("findById() — teacher xem điểm lớp khác ném AccessDeniedException")
    void findByIdTeacherOtherClassForbidden() {
        User otherTeacher = User.builder().id(4L).role(Role.TEACHER).build();
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(score));

        assertThatThrownBy(() -> scoreService.findById(1L, otherTeacher))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("findById() — student xem điểm của chính mình được phép")
    void findByIdStudentOwn() {
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(score));

        Score found = scoreService.findById(1L, student);

        assertThat(found.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("findById() — student xem điểm người khác ném AccessDeniedException")
    void findByIdStudentOtherForbidden() {
        User otherStudent = User.builder().id(5L).role(Role.STUDENT).build();
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(score));

        assertThatThrownBy(() -> scoreService.findById(1L, otherStudent))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("findById() — không tìm thấy ném ResourceNotFoundException")
    void findByIdNotFound() {
        when(scoreRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> scoreService.findById(99L, teacher))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found with id");
    }

    @Test
    @DisplayName("findAll() — admin xem mọi điểm")
    void findAllAdmin() {
        User admin = User.builder().id(9L).role(Role.ADMIN).build();
        when(scoreRepository.findAll()).thenReturn(List.of(score));

        List<Score> result = scoreService.findAll(null, null, admin);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("findAll() — admin lọc theo studentId")
    void findAllAdminByStudentId() {
        User admin = User.builder().id(9L).role(Role.ADMIN).build();
        when(scoreRepository.findByStudent_Id(3L)).thenReturn(List.of(score));

        List<Score> result = scoreService.findAll(3L, null, admin);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("findAll() — teacher chỉ thấy điểm các lớp mình dạy")
    void findAllTeacherOwnClasses() {
        when(scoreRepository.findByCourseClass_Teacher_Id(2L)).thenReturn(List.of(score));

        List<Score> result = scoreService.findAll(null, null, teacher);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("findAll() — teacher lọc theo classId lớp khác ném AccessDeniedException")
    void findAllTeacherOtherClassForbidden() {
        CourseClass otherClass = CourseClass.builder()
                .id(2L)
                .course(course)
                .name("Other Class")
                .teacher(User.builder().id(4L).role(Role.TEACHER).build())
                .status(ClassStatus.STUDYING)
                .build();
        when(courseClassService.findById(2L)).thenReturn(otherClass);

        assertThatThrownBy(() -> scoreService.findAll(null, 2L, teacher))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("findAll() — student chỉ thấy điểm của chính mình")
    void findAllStudentOwnOnly() {
        when(scoreRepository.findByStudent_Id(3L)).thenReturn(List.of(score));

        List<Score> result = scoreService.findAll(null, null, student);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("findAll() — student lọc theo studentId người khác ném AccessDeniedException")
    void findAllStudentOtherForbidden() {
        assertThatThrownBy(() -> scoreService.findAll(5L, null, student))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("update() — teacher sửa điểm lớp mình, total_score tính lại")
    void updateSuccess() {
        Score stored = Score.builder()
                .id(1L)
                .student(student)
                .courseClass(courseClass)
                .midtermScore(new BigDecimal("5.0"))
                .finalScore(new BigDecimal("5.0"))
                .totalScore(new BigDecimal("5.0"))
                .createdBy(teacher)
                .build();
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(stored));
        when(scoreRepository.save(any(Score.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Score updated = scoreService.update(1L,
                new UpdateScoreRequest(new BigDecimal("8.0"), new BigDecimal("9.0"), "Great"), teacher);

        assertThat(updated.getTotalScore()).isEqualByComparingTo(new BigDecimal("8.6"));
        assertThat(updated.getComment()).isEqualTo("Great");
    }

    @Test
    @DisplayName("update() — xoá một trong hai điểm thì total_score = null")
    void updateClearsTotalWhenScoreMissing() {
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(score));
        when(scoreRepository.save(any(Score.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Score updated = scoreService.update(1L,
                new UpdateScoreRequest(new BigDecimal("8.0"), null, null), teacher);

        assertThat(updated.getTotalScore()).isNull();
    }

    @Test
    @DisplayName("update() — teacher sửa điểm lớp khác ném AccessDeniedException")
    void updateOtherClassForbidden() {
        User otherTeacher = User.builder().id(4L).role(Role.TEACHER).build();
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(score));

        assertThatThrownBy(() -> scoreService.update(1L,
                new UpdateScoreRequest(new BigDecimal("8.0"), new BigDecimal("9.0"), null), otherTeacher))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("update() — lớp UPCOMING ném BusinessException")
    void updateClassUpcoming() {
        Score upcomingScore = Score.builder()
                .id(1L)
                .student(student)
                .courseClass(CourseClass.builder()
                        .id(1L)
                        .course(course)
                        .name("Morning Class 01")
                        .teacher(teacher)
                        .status(ClassStatus.UPCOMING)
                        .build())
                .createdBy(teacher)
                .build();
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(upcomingScore));

        assertThatThrownBy(() -> scoreService.update(1L,
                new UpdateScoreRequest(new BigDecimal("8.0"), new BigDecimal("9.0"), null), teacher))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("STUDYING or FINISHED");
    }

    @Test
    @DisplayName("delete() — teacher xoá điểm lớp mình thành công")
    void deleteSuccess() {
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(score));

        scoreService.delete(1L, teacher);

        verify(scoreRepository).delete(score);
    }

    @Test
    @DisplayName("delete() — teacher xoá điểm lớp khác ném AccessDeniedException")
    void deleteOtherClassForbidden() {
        User otherTeacher = User.builder().id(4L).role(Role.TEACHER).build();
        when(scoreRepository.findById(1L)).thenReturn(Optional.of(score));

        assertThatThrownBy(() -> scoreService.delete(1L, otherTeacher))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("delete() — không tìm thấy ném ResourceNotFoundException")
    void deleteNotFound() {
        when(scoreRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> scoreService.delete(99L, teacher))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
