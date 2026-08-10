package com.englishcenter.controller;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.CourseStatus;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.ScheduleDay;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.CourseClassRepository;
import com.englishcenter.repository.CourseRepository;
import com.englishcenter.repository.RegistrationRepository;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:schedule_test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"
})
class ScheduleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User admin;
    private User teacherA;
    private User teacherB;
    private User studentA;
    private Course course;
    private CourseClass studyingClass;
    private CourseClass upcomingClass;
    private CourseClass teacherBClass;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        courseRepository.deleteAll();
        courseClassRepository.deleteAll();
        registrationRepository.deleteAll();
        admin = createUser(Role.ADMIN, "admin@example.com");
        teacherA = createUser(Role.TEACHER, "teachera@example.com");
        teacherB = createUser(Role.TEACHER, "teacherb@example.com");
        studentA = createUser(Role.STUDENT, "studenta@example.com");
        course = courseRepository.save(Course.builder()
                .name("English Foundation")
                .tuition(new BigDecimal("1500000.00"))
                .level(CourseLevel.BEGINNER)
                .duration(12)
                .status(CourseStatus.ACTIVE)
                .build());
        studyingClass = createClass("Class A", teacherA, ClassStatus.STUDYING,
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 10, 1));
        upcomingClass = createClass("Class B", teacherA, ClassStatus.UPCOMING,
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 31));
        teacherBClass = createClass("Class C", teacherB, ClassStatus.STUDYING,
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 10, 1));
        createRegistration(studentA, RegistrationStatus.APPROVED, studyingClass);
        createRegistration(studentA, RegistrationStatus.PENDING, upcomingClass);
    }

    private User createUser(Role role, String email) {
        return userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test User")
                .phone("0123456789")
                .role(role)
                .status(UserStatus.ACTIVE)
                .build());
    }

    private CourseClass createClass(String name, User teacher, ClassStatus status,
                                    LocalDate startDate, LocalDate endDate) {
        return courseClassRepository.save(CourseClass.builder()
                .course(course)
                .name(name)
                .teacher(teacher)
                .maxCapacity(20)
                .scheduleDay(ScheduleDay.MON)
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(20, 0))
                .room("Room 101")
                .startDate(startDate)
                .endDate(endDate)
                .status(status)
                .build());
    }

    private Registration createRegistration(User student, RegistrationStatus status, CourseClass courseClass) {
        return registrationRepository.save(Registration.builder()
                .student(student)
                .courseClass(courseClass)
                .status(status)
                .tuitionAtRegistration(course.getTuition())
                .registeredAt(LocalDateTime.now())
                .approvedAt(status == RegistrationStatus.APPROVED ? LocalDateTime.now() : null)
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtTokenProvider.generateToken(user);
    }

    @Test
    @DisplayName("ADMIN — GET /api/schedules trả 200, thấy mọi lớp STUDYING (BR-03)")
    void adminSeesAllSchedules() throws Exception {
        mockMvc.perform(get("/api/schedules")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].className").value("Class A"))
                .andExpect(jsonPath("$.data[0].scheduleDay").value("MON"))
                .andExpect(jsonPath("$.data[0].room").value("Room 101"));
    }

    @Test
    @DisplayName("ADMIN — GET không bao gồm lớp UPCOMING (BR-04)")
    void adminScheduleExcludesUpcoming() throws Exception {
        mockMvc.perform(get("/api/schedules")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("TEACHER — GET trả 200, chỉ thấy lớp mình dạy và STUDYING (BR-02)")
    void teacherSeesOwnSchedules() throws Exception {
        mockMvc.perform(get("/api/schedules")
                        .header("Authorization", bearer(teacherA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].classId").value(studyingClass.getId()))
                .andExpect(jsonPath("$.data[0].teacherId").value(teacherA.getId()));
    }

    @Test
    @DisplayName("STUDENT — GET trả 200, chỉ thấy lớp APPROVED và STUDYING (BR-01)")
    void studentSeesOwnSchedules() throws Exception {
        mockMvc.perform(get("/api/schedules")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].classId").value(studyingClass.getId()));
    }

    @Test
    @DisplayName("ADMIN — GET với from/to trùng khoảng học trả 200, đúng lớp")
    void adminScheduleFilteredByDateRange() throws Exception {
        mockMvc.perform(get("/api/schedules")
                        .header("Authorization", bearer(admin))
                        .param("from", "2026-09-01")
                        .param("to", "2026-09-30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("ADMIN — GET với from/to ngoài khoảng học trả 200, rỗng")
    void adminScheduleFilteredOutOfRange() throws Exception {
        mockMvc.perform(get("/api/schedules")
                        .header("Authorization", bearer(admin))
                        .param("from", "2027-01-01")
                        .param("to", "2027-01-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    @DisplayName("GET không có token trả 403")
    void unauthenticatedRequestForbidden() throws Exception {
        mockMvc.perform(get("/api/schedules"))
                .andExpect(status().isForbidden());
    }
}
