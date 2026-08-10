package com.englishcenter.controller;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.CourseStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
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
class CourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User admin;
    private User student;
    private Course course;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        courseRepository.deleteAll();
        admin = createUser(Role.ADMIN, "admin@example.com");
        student = createUser(Role.STUDENT, "student@example.com");
        course = courseRepository.save(Course.builder()
                .name("English Foundation")
                .description("Basic English course")
                .tuition(new BigDecimal("1500000.00"))
                .level(CourseLevel.BEGINNER)
                .duration(12)
                .status(CourseStatus.ACTIVE)
                .build());
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

    private String bearer(User user) {
        return "Bearer " + jwtTokenProvider.generateToken(user);
    }

    private String courseBody(String name) throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("tuition", 1500000);
        body.put("level", "BEGINNER");
        body.put("duration", 12);
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("ADMIN — GET /api/courses trả 200")
    void adminGetAll() throws Exception {
        mockMvc.perform(get("/api/courses")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("ADMIN — POST /api/courses trả 201")
    void adminCreate() throws Exception {
        mockMvc.perform(post("/api/courses")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(courseBody("New Course")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("New Course"));
    }

    @Test
    @DisplayName("ADMIN — PUT /api/courses/{id} trả 200")
    void adminUpdate() throws Exception {
        mockMvc.perform(put("/api/courses/{id}", course.getId())
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(courseBody("Updated Course")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Course"));
    }

    @Test
    @DisplayName("ADMIN — DELETE /api/courses/{id} trả 204")
    void adminDelete() throws Exception {
        mockMvc.perform(delete("/api/courses/{id}", course.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("STUDENT — GET /api/courses trả 200")
    void studentGetAll() throws Exception {
        mockMvc.perform(get("/api/courses")
                        .header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("STUDENT — POST /api/courses trả 403")
    void studentCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/courses")
                        .header("Authorization", bearer(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(courseBody("Hacked Course")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — PUT /api/courses/{id} trả 403")
    void studentUpdateForbidden() throws Exception {
        mockMvc.perform(put("/api/courses/{id}", course.getId())
                        .header("Authorization", bearer(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(courseBody("Hacked Course")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — DELETE /api/courses/{id} trả 403")
    void studentDeleteForbidden() throws Exception {
        mockMvc.perform(delete("/api/courses/{id}", course.getId())
                        .header("Authorization", bearer(student)))
                .andExpect(status().isForbidden());
    }
}
