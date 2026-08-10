package com.englishcenter.service;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.ScheduleDay;
import com.englishcenter.repository.CourseClassRepository;
import com.englishcenter.service.impl.ScheduleServiceImpl;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceTest {

    @Mock
    private CourseClassRepository courseClassRepository;

    @Mock
    private RegistrationService registrationService;

    private ScheduleService scheduleService;

    private Course course;
    private User teacher;
    private User student;
    private CourseClass studyingClass;
    private CourseClass upcomingClass;
    private CourseClass otherClass;

    @BeforeEach
    void setUp() {
        scheduleService = new ScheduleServiceImpl(courseClassRepository, registrationService);
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
        studyingClass = CourseClass.builder()
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
        upcomingClass = CourseClass.builder()
                .id(2L)
                .course(course)
                .name("Upcoming Class")
                .teacher(teacher)
                .status(ClassStatus.UPCOMING)
                .startDate(LocalDate.of(2026, 11, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .build();
        otherClass = CourseClass.builder()
                .id(3L)
                .course(course)
                .name("Other Teacher Class")
                .teacher(User.builder().id(4L).role(Role.TEACHER).build())
                .status(ClassStatus.STUDYING)
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 10, 31))
                .build();
    }

    @Test
    @DisplayName("getSchedule() — admin thấy mọi lớp STUDYING, không thấy UPCOMING")
    void adminSeesAllStudyingClasses() {
        User admin = User.builder().id(9L).role(Role.ADMIN).build();
        when(courseClassRepository.findByStatus(ClassStatus.STUDYING))
                .thenReturn(List.of(studyingClass, otherClass));

        List<CourseClass> result = scheduleService.getSchedule(admin, null, null);

        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("getSchedule() — teacher chỉ thấy lớp mình dạy và STUDYING (BR-02)")
    void teacherSeesOwnStudyingClasses() {
        when(courseClassRepository.findByTeacher_Id(2L))
                .thenReturn(List.of(studyingClass, upcomingClass));

        List<CourseClass> result = scheduleService.getSchedule(teacher, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getSchedule() — student chỉ thấy lớp đã APPROVED/PAID và STUDYING (BR-01/BR-04)")
    void studentSeesEnrolledStudyingClasses() {
        Registration approved = Registration.builder()
                .student(student).courseClass(studyingClass)
                .status(RegistrationStatus.APPROVED).build();
        Registration pending = Registration.builder()
                .student(student).courseClass(upcomingClass)
                .status(RegistrationStatus.PENDING).build();
        when(registrationService.findAllByStudentId(3L)).thenReturn(List.of(approved, pending));

        List<CourseClass> result = scheduleService.getSchedule(student, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getSchedule() — student không trùng lặp lớp dù có nhiều registration")
    void studentScheduleDistinct() {
        Registration r1 = Registration.builder()
                .student(student).courseClass(studyingClass)
                .status(RegistrationStatus.APPROVED).build();
        Registration r2 = Registration.builder()
                .student(student).courseClass(studyingClass)
                .status(RegistrationStatus.PAID).build();
        when(registrationService.findAllByStudentId(3L)).thenReturn(List.of(r1, r2));

        List<CourseClass> result = scheduleService.getSchedule(student, null, null);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("getSchedule() — admin lọc theo khoảng ngày trùng lịch lớp (overlap)")
    void dateRangeFilterKeepsOverlappingClasses() {
        User admin = User.builder().id(9L).role(Role.ADMIN).build();
        when(courseClassRepository.findByStatus(ClassStatus.STUDYING))
                .thenReturn(List.of(studyingClass, otherClass));

        List<CourseClass> result = scheduleService.getSchedule(admin,
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30));

        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("getSchedule() — khoảng ngày không chạm lịch lớp thì rỗng")
    void dateRangeFilterEmptyWhenNoOverlap() {
        User admin = User.builder().id(9L).role(Role.ADMIN).build();
        when(courseClassRepository.findByStatus(ClassStatus.STUDYING))
                .thenReturn(List.of(studyingClass));

        List<CourseClass> result = scheduleService.getSchedule(admin,
                LocalDate.of(2027, 1, 1), LocalDate.of(2027, 1, 31));

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getSchedule() — chỉ có to mà không có from vẫn lọc theo ngày kết thúc")
    void dateRangeFilterWithOnlyTo() {
        User admin = User.builder().id(9L).role(Role.ADMIN).build();
        when(courseClassRepository.findByStatus(ClassStatus.STUDYING))
                .thenReturn(List.of(studyingClass));

        List<CourseClass> result = scheduleService.getSchedule(admin, null,
                LocalDate.of(2026, 7, 31));

        assertThat(result).isEmpty();
    }
}
