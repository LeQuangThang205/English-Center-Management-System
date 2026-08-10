package com.englishcenter.controller;

import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.security.JwtTokenProvider;
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

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User admin;
    private User student;
    private User otherStudent;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        admin = createUser(Role.ADMIN, "admin@example.com", "Admin User");
        student = createUser(Role.STUDENT, "student@example.com", "Student User");
        otherStudent = createUser(Role.STUDENT, "other@example.com", "Other Student");
    }

    private User createUser(Role role, String email, String fullName) {
        return userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName(fullName)
                .phone("0123456789")
                .role(role)
                .status(UserStatus.ACTIVE)
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtTokenProvider.generateToken(user);
    }

    @Test
    @DisplayName("ADMIN — GET /api/users trả 200 danh sách tất cả user")
    void adminGetAll() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(3));
    }

    @Test
    @DisplayName("ADMIN — GET /api/users/{id} trả 200")
    void adminGetById() throws Exception {
        mockMvc.perform(get("/api/users/{id}", otherStudent.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("other@example.com"));
    }

    @Test
    @DisplayName("ADMIN — PUT /api/users/{id} trả 200")
    void adminUpdate() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "email", "other@example.com",
                "fullName", "Updated Other",
                "phone", "0987654321",
                "role", "STUDENT",
                "status", "ACTIVE"));

        mockMvc.perform(put("/api/users/{id}", otherStudent.getId())
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Updated Other"));
    }

    @Test
    @DisplayName("ADMIN — DELETE /api/users/{id} trả 204")
    void adminDelete() throws Exception {
        mockMvc.perform(delete("/api/users/{id}", otherStudent.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("STUDENT — GET /api/users/{id} chính mình trả 200")
    void studentGetSelf() throws Exception {
        mockMvc.perform(get("/api/users/{id}", student.getId())
                        .header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("student@example.com"));
    }

    @Test
    @DisplayName("STUDENT — GET /api/users/{id} người khác trả 403")
    void studentGetOtherForbidden() throws Exception {
        mockMvc.perform(get("/api/users/{id}", otherStudent.getId())
                        .header("Authorization", bearer(student)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — PUT /api/users/{id} chính mình trả 200")
    void studentUpdateSelf() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "email", "student@example.com",
                "fullName", "Updated Student",
                "phone", "0987654321",
                "role", "STUDENT",
                "status", "ACTIVE"));

        mockMvc.perform(put("/api/users/{id}", student.getId())
                        .header("Authorization", bearer(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Updated Student"));
    }

    @Test
    @DisplayName("STUDENT — PUT /api/users/{id} người khác trả 403")
    void studentUpdateOtherForbidden() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "email", "other@example.com",
                "fullName", "Hacked Name",
                "phone", "0987654321",
                "role", "STUDENT",
                "status", "ACTIVE"));

        mockMvc.perform(put("/api/users/{id}", otherStudent.getId())
                        .header("Authorization", bearer(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — DELETE /api/users/{id} trả 403")
    void studentDeleteForbidden() throws Exception {
        mockMvc.perform(delete("/api/users/{id}", otherStudent.getId())
                        .header("Authorization", bearer(student)))
                .andExpect(status().isForbidden());
    }
}
