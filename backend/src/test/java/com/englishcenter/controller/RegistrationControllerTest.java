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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth_test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"
})
class RegistrationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    private User teacher;
    private User studentA;
    private User studentB;
    private Course course;
    private CourseClass courseClass;
    private Registration regOfStudentA;
    private Registration regOfStudentB;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        courseRepository.deleteAll();
        courseClassRepository.deleteAll();
        registrationRepository.deleteAll();
        admin = createUser(Role.ADMIN, "admin@example.com");
        teacher = createUser(Role.TEACHER, "teacher@example.com");
        studentA = createUser(Role.STUDENT, "studenta@example.com");
        studentB = createUser(Role.STUDENT, "studentb@example.com");
        course = courseRepository.save(Course.builder()
                .name("English Foundation")
                .tuition(new BigDecimal("1500000.00"))
                .level(CourseLevel.BEGINNER)
                .duration(12)
                .status(CourseStatus.ACTIVE)
                .build());
        courseClass = createClass("Class A", teacher);
        regOfStudentA = createRegistration(studentA, courseClass);
        regOfStudentB = createRegistration(studentB, courseClass);
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

    private CourseClass createClass(String name, User teacher) {
        return courseClassRepository.save(CourseClass.builder()
                .course(course)
                .name(name)
                .teacher(teacher)
                .maxCapacity(20)
                .scheduleDay(ScheduleDay.MON)
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(20, 0))
                .room("Room 101")
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 10, 1))
                .status(ClassStatus.UPCOMING)
                .build());
    }

    private Registration createRegistration(User student, CourseClass courseClass) {
        return registrationRepository.save(Registration.builder()
                .student(student)
                .courseClass(courseClass)
                .status(RegistrationStatus.PENDING)
                .tuitionAtRegistration(course.getTuition())
                .registeredAt(LocalDateTime.now())
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtTokenProvider.generateToken(user);
    }

    private String createBody(Long studentId, Long classId) throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("studentId", studentId);
        body.put("classId", classId);
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("ADMIN — GET /api/registrations trả 200, thấy mọi đơn")
    void adminGetAll() throws Exception {
        mockMvc.perform(get("/api/registrations")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("STUDENT — GET /api/registrations trả 200 (mọi user đã xác thực được xem)")
    void studentGetAll() throws Exception {
        mockMvc.perform(get("/api/registrations")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("TEACHER — GET /api/registrations trả 200 (mọi user đã xác thực được xem)")
    void teacherGetAll() throws Exception {
        mockMvc.perform(get("/api/registrations")
                        .header("Authorization", bearer(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("STUDENT — GET /api/registrations/{id} đơn của mình trả 200")
    void studentGetOwnRegistrationById() throws Exception {
        mockMvc.perform(get("/api/registrations/{id}", regOfStudentA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(regOfStudentA.getId()));
    }

    @Test
    @DisplayName("STUDENT — GET /api/registrations/{id} đơn của người khác trả 200 (GET mở)")
    void studentGetOtherRegistrationById() throws Exception {
        mockMvc.perform(get("/api/registrations/{id}", regOfStudentB.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(regOfStudentB.getId()));
    }

    @Test
    @DisplayName("STUDENT — GET /api/registrations?classId= lọc đúng lớp trả 200")
    void filterByClassId() throws Exception {
        mockMvc.perform(get("/api/registrations")
                        .header("Authorization", bearer(studentA))
                        .param("classId", String.valueOf(courseClass.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("STUDENT — POST đăng ký lớp cho chính mình trả 201")
    void studentCreateOwnRegistration() throws Exception {
        mockMvc.perform(post("/api/registrations")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studentA.getId(), courseClass.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.studentId").value(studentA.getId()));
    }

    @Test
    @DisplayName("STUDENT — POST đăng ký hộ người khác trả 403")
    void studentCreateForOtherForbidden() throws Exception {
        mockMvc.perform(post("/api/registrations")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studentB.getId(), courseClass.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — POST /api/registrations trả 403 (chỉ STUDENT được đăng ký)")
    void adminCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/registrations")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studentB.getId(), courseClass.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — POST /api/registrations trả 403 (chỉ STUDENT được đăng ký)")
    void teacherCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/registrations")
                        .header("Authorization", bearer(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studentB.getId(), courseClass.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — approve trả 200")
    void adminApprove() throws Exception {
        mockMvc.perform(put("/api/registrations/{id}/approve", regOfStudentA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
    }

    @Test
    @DisplayName("STUDENT — approve trả 403")
    void studentApproveForbidden() throws Exception {
        mockMvc.perform(put("/api/registrations/{id}/approve", regOfStudentA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — approve trả 403")
    void teacherApproveForbidden() throws Exception {
        mockMvc.perform(put("/api/registrations/{id}/approve", regOfStudentA.getId())
                        .header("Authorization", bearer(teacher)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — reject trả 200")
    void adminReject() throws Exception {
        mockMvc.perform(put("/api/registrations/{id}/reject", regOfStudentB.getId())
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Class is full\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectionReason").value("Class is full"));
    }

    @Test
    @DisplayName("ADMIN — approve rồi mark-paid trả 200")
    void adminApproveThenMarkPaid() throws Exception {
        mockMvc.perform(put("/api/registrations/{id}/approve", regOfStudentA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
        mockMvc.perform(put("/api/registrations/{id}/mark-paid", regOfStudentA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PAID"));
    }

    @Test
    @DisplayName("STUDENT — mark-paid trả 403")
    void studentMarkPaidForbidden() throws Exception {
        mockMvc.perform(put("/api/registrations/{id}/mark-paid", regOfStudentA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — cancel đơn của mình trả 204")
    void studentCancelOwnRegistration() throws Exception {
        mockMvc.perform(put("/api/registrations/{id}/cancel", regOfStudentA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("STUDENT — cancel đơn của người khác trả 403")
    void studentCancelOtherRegistrationForbidden() throws Exception {
        mockMvc.perform(put("/api/registrations/{id}/cancel", regOfStudentB.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — cancel bất kỳ đơn nào trả 204")
    void adminCancelAnyRegistration() throws Exception {
        mockMvc.perform(put("/api/registrations/{id}/cancel", regOfStudentB.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("TEACHER — cancel trả 403")
    void teacherCancelForbidden() throws Exception {
        mockMvc.perform(put("/api/registrations/{id}/cancel", regOfStudentA.getId())
                        .header("Authorization", bearer(teacher)))
                .andExpect(status().isForbidden());
    }
}
