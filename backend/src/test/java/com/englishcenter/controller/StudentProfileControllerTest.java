package com.englishcenter.controller;

import com.englishcenter.entity.StudentProfile;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.StudentProfileRepository;
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

import java.time.LocalDate;
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
class StudentProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User admin;
    private User studentA;
    private User studentB;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        studentProfileRepository.deleteAll();
        admin = createUser(Role.ADMIN, "admin@example.com");
        studentA = createUser(Role.STUDENT, "studenta@example.com");
        studentB = createUser(Role.STUDENT, "studentb@example.com");
        createProfile(studentA);
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

    private void createProfile(User student) {
        studentProfileRepository.save(StudentProfile.builder()
                .user(student)
                .dateOfBirth(LocalDate.of(2005, 1, 1))
                .address("Hanoi")
                .enrollmentDate(LocalDate.of(2026, 8, 1))
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtTokenProvider.generateToken(user);
    }

    private String createBody(Long userId) throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("userId", userId);
        body.put("dateOfBirth", "2005-01-01");
        body.put("address", "Hanoi");
        body.put("enrollmentDate", "2026-08-01");
        return objectMapper.writeValueAsString(body);
    }

    private String updateBody() throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("dateOfBirth", "2004-02-02");
        body.put("address", "HCMC");
        body.put("enrollmentDate", "2026-09-01");
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("ADMIN — GET /api/student-profiles trả 200, thấy mọi profile")
    void adminGetAll() throws Exception {
        mockMvc.perform(get("/api/student-profiles")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @DisplayName("ADMIN — POST /api/student-profiles trả 201")
    void adminCreate() throws Exception {
        mockMvc.perform(post("/api/student-profiles")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studentB.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(studentB.getId()));
    }

    @Test
    @DisplayName("ADMIN — PUT /api/student-profiles/{userId} trả 200")
    void adminUpdate() throws Exception {
        mockMvc.perform(put("/api/student-profiles/{userId}", studentA.getId())
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.address").value("HCMC"));
    }

    @Test
    @DisplayName("ADMIN — DELETE /api/student-profiles/{userId} trả 204")
    void adminDelete() throws Exception {
        mockMvc.perform(delete("/api/student-profiles/{userId}", studentA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("STUDENT — GET /api/student-profiles trả 200, chỉ thấy profile của mình")
    void studentGetOwnProfile() throws Exception {
        mockMvc.perform(get("/api/student-profiles")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].userId").value(studentA.getId()));
    }

    @Test
    @DisplayName("STUDENT — GET /api/student-profiles/user/{người khác} trả 403")
    void studentGetOtherProfileForbidden() throws Exception {
        mockMvc.perform(get("/api/student-profiles/user/{userId}", studentB.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — PUT profile của mình trả 200")
    void studentUpdateOwnProfile() throws Exception {
        mockMvc.perform(put("/api/student-profiles/{userId}", studentA.getId())
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.address").value("HCMC"));
    }

    @Test
    @DisplayName("STUDENT — PUT profile của người khác trả 403")
    void studentUpdateOtherProfileForbidden() throws Exception {
        mockMvc.perform(put("/api/student-profiles/{userId}", studentB.getId())
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — POST /api/student-profiles trả 403")
    void studentCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/student-profiles")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studentB.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — DELETE profile của mình trả 403")
    void studentDeleteForbidden() throws Exception {
        mockMvc.perform(delete("/api/student-profiles/{userId}", studentA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }
}
