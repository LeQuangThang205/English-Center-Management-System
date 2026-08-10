package com.englishcenter.controller;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.CourseStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.ScheduleDay;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.CourseClassRepository;
import com.englishcenter.repository.CourseRepository;
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
        "spring.datasource.url=jdbc:h2:mem:auth_test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"
})
class CourseClassControllerTest {

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User admin;
    private User student;
    private User teacherA;
    private User teacherB;
    private Course course;
    private CourseClass classOfTeacherA;
    private CourseClass classOfTeacherB;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        courseRepository.deleteAll();
        courseClassRepository.deleteAll();
        admin = createUser(Role.ADMIN, "admin@example.com");
        student = createUser(Role.STUDENT, "student@example.com");
        teacherA = createUser(Role.TEACHER, "teachera@example.com");
        teacherB = createUser(Role.TEACHER, "teacherb@example.com");
        course = courseRepository.save(Course.builder()
                .name("English Foundation")
                .tuition(new BigDecimal("1500000.00"))
                .level(CourseLevel.BEGINNER)
                .duration(12)
                .status(CourseStatus.ACTIVE)
                .build());
        classOfTeacherA = createClass("Class A", teacherA);
        classOfTeacherB = createClass("Class B", teacherB);
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

    private String bearer(User user) {
        return "Bearer " + jwtTokenProvider.generateToken(user);
    }

    private String createBody(String name) throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("courseId", course.getId());
        body.put("name", name);
        body.put("maxCapacity", 20);
        body.put("scheduleDay", "MON");
        body.put("startTime", "18:00:00");
        body.put("endTime", "20:00:00");
        body.put("room", "Room 101");
        body.put("startDate", "2026-08-01");
        body.put("endDate", "2026-10-01");
        return objectMapper.writeValueAsString(body);
    }

    private String updateBody(String name) throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("maxCapacity", 20);
        body.put("scheduleDay", "MON");
        body.put("startTime", "18:00:00");
        body.put("endTime", "20:00:00");
        body.put("room", "Room 101");
        body.put("startDate", "2026-08-01");
        body.put("endDate", "2026-10-01");
        body.put("status", "UPCOMING");
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("ADMIN — GET /api/classes trả 200")
    void adminGetAll() throws Exception {
        mockMvc.perform(get("/api/classes")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("ADMIN — POST /api/classes trả 201")
    void adminCreate() throws Exception {
        mockMvc.perform(post("/api/classes")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("New Class")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("New Class"));
    }

    @Test
    @DisplayName("ADMIN — PUT /api/classes/{id} trả 200")
    void adminUpdate() throws Exception {
        mockMvc.perform(put("/api/classes/{id}", classOfTeacherA.getId())
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody("Updated Class")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Class"));
    }

    @Test
    @DisplayName("ADMIN — DELETE /api/classes/{id} trả 204")
    void adminDelete() throws Exception {
        mockMvc.perform(delete("/api/classes/{id}", classOfTeacherA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("STUDENT — GET /api/classes trả 200")
    void studentGetAll() throws Exception {
        mockMvc.perform(get("/api/classes")
                        .header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("STUDENT — POST /api/classes trả 403")
    void studentCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/classes")
                        .header("Authorization", bearer(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("Hacked Class")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — PUT /api/classes/{id} trả 403")
    void studentUpdateForbidden() throws Exception {
        mockMvc.perform(put("/api/classes/{id}", classOfTeacherA.getId())
                        .header("Authorization", bearer(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody("Hacked Class")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — DELETE /api/classes/{id} trả 403")
    void studentDeleteForbidden() throws Exception {
        mockMvc.perform(delete("/api/classes/{id}", classOfTeacherA.getId())
                        .header("Authorization", bearer(student)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — POST /api/classes trả 403")
    void teacherCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/classes")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("Hacked Class")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — PUT lớp của chính mình trả 200")
    void teacherUpdateOwnClass() throws Exception {
        mockMvc.perform(put("/api/classes/{id}", classOfTeacherA.getId())
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody("Teacher Updated")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Teacher Updated"));
    }

    @Test
    @DisplayName("TEACHER — PUT lớp của người khác trả 403")
    void teacherUpdateOtherClassForbidden() throws Exception {
        mockMvc.perform(put("/api/classes/{id}", classOfTeacherB.getId())
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody("Hacked Class")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — DELETE lớp của chính mình trả 204")
    void teacherDeleteOwnClass() throws Exception {
        mockMvc.perform(delete("/api/classes/{id}", classOfTeacherA.getId())
                        .header("Authorization", bearer(teacherA)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("TEACHER — DELETE lớp của người khác trả 403")
    void teacherDeleteOtherClassForbidden() throws Exception {
        mockMvc.perform(delete("/api/classes/{id}", classOfTeacherB.getId())
                        .header("Authorization", bearer(teacherA)))
                .andExpect(status().isForbidden());
    }
}
