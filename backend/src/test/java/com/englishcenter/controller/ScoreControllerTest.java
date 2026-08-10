package com.englishcenter.controller;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.Score;
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
import com.englishcenter.repository.ScoreRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:score_test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"
})
class ScoreControllerTest {

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
    private ScoreRepository scoreRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User admin;
    private User teacherA;
    private User teacherB;
    private User studentA;
    private User studentB;
    private User studentC;
    private Course course;
    private CourseClass studyingClass;
    private CourseClass upcomingClass;
    private CourseClass teacherBClass;
    private Score scoreA;
    private Score scoreB;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        courseRepository.deleteAll();
        courseClassRepository.deleteAll();
        registrationRepository.deleteAll();
        scoreRepository.deleteAll();
        admin = createUser(Role.ADMIN, "admin@example.com");
        teacherA = createUser(Role.TEACHER, "teachera@example.com");
        teacherB = createUser(Role.TEACHER, "teacherb@example.com");
        studentA = createUser(Role.STUDENT, "studenta@example.com");
        studentB = createUser(Role.STUDENT, "studentb@example.com");
        studentC = createUser(Role.STUDENT, "studentc@example.com");
        course = courseRepository.save(Course.builder()
                .name("English Foundation")
                .tuition(new BigDecimal("1500000.00"))
                .level(CourseLevel.BEGINNER)
                .duration(12)
                .status(CourseStatus.ACTIVE)
                .build());
        studyingClass = createClass("Class A", teacherA, ClassStatus.STUDYING);
        upcomingClass = createClass("Class B", teacherA, ClassStatus.UPCOMING);
        teacherBClass = createClass("Class C", teacherB, ClassStatus.STUDYING);
        createRegistration(studentA, RegistrationStatus.APPROVED, studyingClass);
        createRegistration(studentB, RegistrationStatus.PAID, studyingClass);
        createRegistration(studentC, RegistrationStatus.PENDING, studyingClass);
        createRegistration(studentB, RegistrationStatus.APPROVED, teacherBClass);
        scoreA = createScore(studentA, studyingClass, teacherA,
                new BigDecimal("8.0"), new BigDecimal("9.0"), "Good");
        scoreB = createScore(studentB, teacherBClass, teacherB,
                new BigDecimal("7.0"), new BigDecimal("6.0"), null);
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

    private CourseClass createClass(String name, User teacher, ClassStatus status) {
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

    private Score createScore(User student, CourseClass courseClass, User createdBy,
                              BigDecimal midterm, BigDecimal fin, String comment) {
        return scoreRepository.save(Score.builder()
                .student(student)
                .courseClass(courseClass)
                .midtermScore(midterm)
                .finalScore(fin)
                .totalScore(midterm != null && fin != null
                        ? midterm.multiply(new BigDecimal("0.4")).add(fin.multiply(new BigDecimal("0.6"))).setScale(1)
                        : null)
                .comment(comment)
                .createdBy(createdBy)
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtTokenProvider.generateToken(user);
    }

    private String scoreBody(Long studentId, Long classId, Double midterm, Double fin, String comment)
            throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("studentId", studentId);
        body.put("classId", classId);
        body.put("midtermScore", midterm);
        body.put("finalScore", fin);
        body.put("comment", comment);
        return objectMapper.writeValueAsString(body);
    }

    private String updateBody(Double midterm, Double fin, String comment) throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("midtermScore", midterm);
        body.put("finalScore", fin);
        body.put("comment", comment);
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("TEACHER — POST nhập điểm cho lớp mình trả 201, total_score tự tính (E1/BR-02/BR-03)")
    void teacherCreateScoreOwnClass() throws Exception {
        mockMvc.perform(post("/api/scores")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scoreBody(studentA.getId(), studyingClass.getId(), 8.0, 9.0, "Good")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.studentId").value(studentA.getId()))
                .andExpect(jsonPath("$.data.classId").value(studyingClass.getId()))
                .andExpect(jsonPath("$.data.midtermScore").value(8.0))
                .andExpect(jsonPath("$.data.finalScore").value(9.0))
                .andExpect(jsonPath("$.data.totalScore").value(8.6));
    }

    @Test
    @DisplayName("TEACHER — POST upsert: cặp student+class đã có điểm thì cập nhật và tính lại total")
    void teacherCreateUpsertExistingScore() throws Exception {
        mockMvc.perform(post("/api/scores")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scoreBody(studentA.getId(), studyingClass.getId(), 6.0, 4.0, "Updated")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(scoreA.getId()))
                .andExpect(jsonPath("$.data.midtermScore").value(6.0))
                .andExpect(jsonPath("$.data.totalScore").value(4.8))
                .andExpect(jsonPath("$.data.comment").value("Updated"));
    }

    @Test
    @DisplayName("TEACHER — POST nhập điểm lớp không phải của mình trả 403 (E2/BR-01)")
    void teacherCreateOtherClassForbidden() throws Exception {
        mockMvc.perform(post("/api/scores")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scoreBody(studentB.getId(), teacherBClass.getId(), 8.0, 9.0, null)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — POST nhập điểm lớp UPCOMING trả 400 (E3/BR-06)")
    void teacherCreateClassUpcoming() throws Exception {
        mockMvc.perform(post("/api/scores")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scoreBody(studentA.getId(), upcomingClass.getId(), 8.0, 9.0, null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TEACHER — POST với học viên chưa APPROVED/PAID trả 400")
    void teacherCreateNonEnrolledStudent() throws Exception {
        mockMvc.perform(post("/api/scores")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scoreBody(studentC.getId(), studyingClass.getId(), 8.0, 9.0, null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("ADMIN — POST nhập điểm cho bất kỳ lớp nào trả 201")
    void adminCreateScore() throws Exception {
        mockMvc.perform(post("/api/scores")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scoreBody(studentB.getId(), studyingClass.getId(), 5.0, 5.0, null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.totalScore").value(5.0));
    }

    @Test
    @DisplayName("STUDENT — POST nhập điểm trả 403")
    void studentCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/scores")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scoreBody(studentA.getId(), studyingClass.getId(), 8.0, 9.0, null)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — POST điểm ngoài thang 0-10 trả 400 (E1/BR-02)")
    void teacherCreateScoreOutOfRange() throws Exception {
        mockMvc.perform(post("/api/scores")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scoreBody(studentA.getId(), studyingClass.getId(), 11.0, 9.0, null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TEACHER — POST thiếu studentId trả 400")
    void teacherCreateMissingStudentId() throws Exception {
        mockMvc.perform(post("/api/scores")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scoreBody(null, studyingClass.getId(), 8.0, 9.0, null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TEACHER — GET /api/scores trả 200, chỉ thấy điểm lớp mình (BR-02)")
    void teacherGetOwnScores() throws Exception {
        mockMvc.perform(get("/api/scores")
                        .header("Authorization", bearer(teacherA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].classId").value(studyingClass.getId()));
    }

    @Test
    @DisplayName("TEACHER — GET với classId lớp của giáo viên khác trả 403")
    void teacherGetOtherClassScoresForbidden() throws Exception {
        mockMvc.perform(get("/api/scores")
                        .header("Authorization", bearer(teacherA))
                        .param("classId", String.valueOf(teacherBClass.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — GET /api/scores trả 200, thấy mọi điểm (BR-03)")
    void adminGetAllScores() throws Exception {
        mockMvc.perform(get("/api/scores")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("STUDENT — GET /api/scores trả 200, chỉ thấy điểm của mình (BR-01)")
    void studentGetOwnScores() throws Exception {
        mockMvc.perform(get("/api/scores")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].studentId").value(studentA.getId()));
    }

    @Test
    @DisplayName("STUDENT — GET với studentId của người khác trả 403")
    void studentGetOtherScoresForbidden() throws Exception {
        mockMvc.perform(get("/api/scores")
                        .header("Authorization", bearer(studentA))
                        .param("studentId", String.valueOf(studentB.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — GET /api/scores/{id} điểm lớp mình trả 200")
    void teacherGetOwnScoreById() throws Exception {
        mockMvc.perform(get("/api/scores/{id}", scoreA.getId())
                        .header("Authorization", bearer(teacherA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(scoreA.getId()))
                .andExpect(jsonPath("$.data.totalScore").value(8.6));
    }

    @Test
    @DisplayName("TEACHER — GET /api/scores/{id} điểm lớp khác trả 403")
    void teacherGetOtherClassScoreByIdForbidden() throws Exception {
        mockMvc.perform(get("/api/scores/{id}", scoreB.getId())
                        .header("Authorization", bearer(teacherA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — GET /api/scores/{id} điểm của mình trả 200")
    void studentGetOwnScoreById() throws Exception {
        mockMvc.perform(get("/api/scores/{id}", scoreA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(scoreA.getId()));
    }

    @Test
    @DisplayName("STUDENT — GET /api/scores/{id} điểm của người khác trả 403")
    void studentGetOtherScoreByIdForbidden() throws Exception {
        mockMvc.perform(get("/api/scores/{id}", scoreB.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — GET /api/scores/{id} trả 200")
    void adminGetScoreById() throws Exception {
        mockMvc.perform(get("/api/scores/{id}", scoreA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(scoreA.getId()));
    }

    @Test
    @DisplayName("TEACHER — PUT sửa điểm lớp mình trả 200, total_score tính lại (A1)")
    void teacherUpdateOwnScore() throws Exception {
        mockMvc.perform(put("/api/scores/{id}", scoreA.getId())
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody(10.0, 10.0, "Excellent")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(scoreA.getId()))
                .andExpect(jsonPath("$.data.totalScore").value(10.0))
                .andExpect(jsonPath("$.data.comment").value("Excellent"));
    }

    @Test
    @DisplayName("TEACHER — PUT sửa điểm lớp khác trả 403")
    void teacherUpdateOtherClassScoreForbidden() throws Exception {
        mockMvc.perform(put("/api/scores/{id}", scoreB.getId())
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody(10.0, 10.0, null)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — PUT sửa điểm trả 403")
    void studentUpdateScoreForbidden() throws Exception {
        mockMvc.perform(put("/api/scores/{id}", scoreA.getId())
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody(10.0, 10.0, null)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — DELETE xoá điểm lớp mình trả 204")
    void teacherDeleteOwnScore() throws Exception {
        mockMvc.perform(delete("/api/scores/{id}", scoreA.getId())
                        .header("Authorization", bearer(teacherA)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("TEACHER — DELETE xoá điểm lớp khác trả 403")
    void teacherDeleteOtherClassScoreForbidden() throws Exception {
        mockMvc.perform(delete("/api/scores/{id}", scoreB.getId())
                        .header("Authorization", bearer(teacherA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — DELETE xoá điểm trả 403")
    void studentDeleteScoreForbidden() throws Exception {
        mockMvc.perform(delete("/api/scores/{id}", scoreA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }
}
