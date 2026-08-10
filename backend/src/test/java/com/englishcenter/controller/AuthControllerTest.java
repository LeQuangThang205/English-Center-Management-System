package com.englishcenter.controller;

import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    private static final String PASSWORD = "password123";

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    private void createActiveUser(String email) {
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(PASSWORD))
                .fullName("Nguyen Van A")
                .phone("0123456789")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(user);
    }

    @Test
    @DisplayName("login() — email/mật khẩu đúng trả 200 kèm token")
    void loginSuccess() throws Exception {
        createActiveUser("login-success@example.com");

        String body = objectMapper.writeValueAsString(Map.of(
                "email", "login-success@example.com",
                "password", PASSWORD));

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("login-success@example.com"))
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.path("data").path("token").asText()).isNotBlank();
    }

    @Test
    @DisplayName("login() — sai mật khẩu trả 401")
    void loginFail() throws Exception {
        createActiveUser("login-fail@example.com");

        String body = objectMapper.writeValueAsString(Map.of(
                "email", "login-fail@example.com",
                "password", "wrong-password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("register() — tạo user mới thành công trả 201 kèm token")
    void registerSuccess() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "email", "register-success@example.com",
                "password", PASSWORD,
                "fullName", "Nguyen Van B"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("register-success@example.com"))
                .andExpect(jsonPath("$.data.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.data.user.status").value("ACTIVE"));

        assertThat(userRepository.existsByEmail("register-success@example.com")).isTrue();
    }

    @Test
    @DisplayName("register() — email đã tồn tại trả 409")
    void registerDuplicateEmail() throws Exception {
        createActiveUser("duplicate@example.com");

        String body = objectMapper.writeValueAsString(Map.of(
                "email", "duplicate@example.com",
                "password", PASSWORD,
                "fullName", "Nguyen Van C"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("User already exists with email: duplicate@example.com"));
    }

    @Test
    @DisplayName("register() — dữ liệu không hợp lệ trả 400 kèm message rõ ràng")
    void registerValidationFail() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "email", "",
                "password", PASSWORD,
                "fullName", "Nguyen Van C"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email is required"));
    }
}
