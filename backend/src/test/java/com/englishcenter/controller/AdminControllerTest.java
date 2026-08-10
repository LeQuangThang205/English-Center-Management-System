package com.englishcenter.controller;

import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    private String tokenFor(Role role) {
        User user = User.builder()
                .email(role.name().toLowerCase() + "@example.com")
                .passwordHash("hashedPassword")
                .fullName("Test User")
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();
        return jwtTokenProvider.generateToken(userRepository.save(user));
    }

    @Test
    @DisplayName("GET /api/admin/test — user thường (STUDENT) bị chặn trả 403")
    void studentForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/test")
                        .header("Authorization", "Bearer " + tokenFor(Role.STUDENT)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/test — ADMIN truy cập thành công trả 200")
    void adminAllowed() throws Exception {
        mockMvc.perform(get("/api/admin/test")
                        .header("Authorization", "Bearer " + tokenFor(Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(content().string("Admin API is working"));
    }
}
