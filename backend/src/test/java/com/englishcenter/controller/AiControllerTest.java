package com.englishcenter.controller;

import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.AiConversationRepository;
import com.englishcenter.repository.AiMessageRepository;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.security.JwtTokenProvider;
import com.englishcenter.service.AiService;
import com.englishcenter.service.ai.AiChatReply;
import com.englishcenter.service.ai.AiProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:ai_test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"
})
class AiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AiConversationRepository conversationRepository;

    @Autowired
    private AiMessageRepository messageRepository;

    @Autowired
    private AiService aiService;

    @MockBean
    private AiProvider aiProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User studentA;
    private User studentB;
    private User admin;
    private Long conversationOfB;

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        userRepository.deleteAll();
        studentA = createUser(Role.STUDENT, "studenta@example.com");
        studentB = createUser(Role.STUDENT, "studentb@example.com");
        admin = createUser(Role.ADMIN, "admin@example.com");
        when(aiProvider.complete(any())).thenReturn(AiChatReply.builder().text("Mocked reply").build());
        conversationOfB = aiService.chat("hello", null, studentB).getConversationId();
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

    private String chatBody(String message, Long conversationId) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("message", message);
        if (conversationId != null) {
            body.put("conversationId", conversationId);
        }
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("STUDENT — POST /api/ai/chat trả 200 kèm reply và historySaved=true")
    void studentChat() throws Exception {
        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody("Khóa học nào đang tuyển sinh?", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reply").value("Mocked reply"))
                .andExpect(jsonPath("$.data.conversationId").exists())
                .andExpect(jsonPath("$.data.historySaved").value(true));
    }

    @Test
    @DisplayName("POST /api/ai/chat message rỗng trả 400")
    void chatBlankMessage() throws Exception {
        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody("   ", null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("STUDENT — POST với conversationId của người khác trả 404")
    void chatOtherConversationForbidden() throws Exception {
        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody("hello", conversationOfB)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("STUDENT — GET /api/ai/conversations chỉ thấy hội thoại của mình")
    void listScopedToSelf() throws Exception {
        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody("hello", null)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/ai/conversations")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));

        mockMvc.perform(get("/api/ai/conversations")
                        .header("Authorization", bearer(studentB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @DisplayName("STUDENT — GET detail của mình trả 200 kèm messages, của người khác trả 404")
    void detailOwnership() throws Exception {
        mockMvc.perform(get("/api/ai/conversations/{id}", conversationOfB)
                        .header("Authorization", bearer(studentB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.messages").isArray())
                .andExpect(jsonPath("$.data.messages.length()").value(1))
                .andExpect(jsonPath("$.data.messages[0].question").value("hello"));

        mockMvc.perform(get("/api/ai/conversations/{id}", conversationOfB)
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("STUDENT — DELETE của mình trả 204, của người khác trả 404")
    void deleteOwnership() throws Exception {
        mockMvc.perform(delete("/api/ai/conversations/{id}", conversationOfB)
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/ai/conversations/{id}", conversationOfB)
                        .header("Authorization", bearer(studentB)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/ai/conversations/{id}", conversationOfB)
                        .header("Authorization", bearer(studentB)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("ADMIN — POST /api/ai/chat trả 200 (mọi role đã đăng nhập đều dùng được)")
    void adminChat() throws Exception {
        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody("Tổng số học viên?", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reply").value("Mocked reply"));
    }

    @Test
    @DisplayName("POST /api/ai/chat khi provider lỗi trả 400 'AI đang bận'")
    void chatProviderFailure() throws Exception {
        when(aiProvider.complete(any()))
                .thenThrow(new com.englishcenter.exception.AiProviderException("down"));

        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody("hello", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("AI đang bận, vui lòng thử lại sau"));
    }

    @Test
    @DisplayName("GET /api/ai/conversations không token trả 403")
    void noTokenForbidden() throws Exception {
        mockMvc.perform(get("/api/ai/conversations"))
                .andExpect(status().isForbidden());
    }
}
