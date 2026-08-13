package com.englishcenter.controller;

import com.englishcenter.dto.request.CreateNotificationRequest;
import com.englishcenter.entity.Notification;
import com.englishcenter.entity.NotificationRecipient;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.NotificationTargetType;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.NotificationRecipientRepository;
import com.englishcenter.repository.NotificationRepository;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.security.JwtTokenProvider;
import com.englishcenter.service.NotificationService;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationRecipientRepository notificationRecipientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private NotificationService notificationService;

    private User admin;
    private User teacherA;
    private User teacherB;
    private User studentA;
    private User studentB;

    @BeforeEach
    void setUp() {
        admin = createUser(Role.ADMIN, "admin@example.com");
        teacherA = createUser(Role.TEACHER, "teachera@example.com");
        teacherB = createUser(Role.TEACHER, "teacherb@example.com");
        studentA = createUser(Role.STUDENT, "studenta@example.com");
        studentB = createUser(Role.STUDENT, "studentb@example.com");
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

    private Notification createNotification(User recipient, NotificationTargetType targetType) {
        CreateNotificationRequest request = new CreateNotificationRequest(
                "Tieu de", "Noi dung", targetType, recipient.getId(), null);
        return notificationService.create(request, admin);
    }

    private String createBody(String title, String content, String targetType, Long targetId) throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        body.put("content", content);
        body.put("targetType", targetType);
        body.put("targetId", targetId);
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("ADMIN — POST tạo thông báo trả 201")
    void adminCreateNotification() throws Exception {
        mockMvc.perform(post("/api/notifications")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("Tieu de", "Noi dung", "SPECIFIC_USER", studentA.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Tieu de"))
                .andExpect(jsonPath("$.data.targetType").value("SPECIFIC_USER"));
    }

    @Test
    @DisplayName("STUDENT — POST tạo thông báo trả 403")
    void studentCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/notifications")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("Tieu de", "Noi dung", "SPECIFIC_USER", studentA.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — POST tạo thông báo trả 403")
    void teacherCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/notifications")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("Tieu de", "Noi dung", "SPECIFIC_USER", studentA.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST với title rỗng trả 400 (validation)")
    void createValidationError() throws Exception {
        mockMvc.perform(post("/api/notifications")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("", "Noi dung", "SPECIFIC_USER", studentA.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST với targetType thiếu trả 400 (validation)")
    void createMissingTargetType() throws Exception {
        mockMvc.perform(post("/api/notifications")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("Tieu de", "Noi dung", null, studentA.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("ADMIN — POST ALL_STUDENTS gửi cho mọi học viên ACTIVE trả 201")
    void adminCreateAllStudents() throws Exception {
        mockMvc.perform(post("/api/notifications")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("Thong bao", "Noi dung", "ALL_STUDENTS", null)))
                .andExpect(status().isCreated());
        List<NotificationRecipient> recipients = notificationRecipientRepository.findByUser_IdOrderByNotification_CreatedAtDesc(studentA.getId());
        org.assertj.core.api.Assertions.assertThat(recipients).hasSize(1);
    }

    @Test
    @DisplayName("GET /api/notifications trả 200, chỉ thấy thông báo của chính mình")
    void getOwnNotifications() throws Exception {
        createNotification(studentA, NotificationTargetType.SPECIFIC_USER);
        createNotification(studentB, NotificationTargetType.SPECIFIC_USER);

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].title").value("Tieu de"));
    }

    @Test
    @DisplayName("GET /api/notifications/unread trả 200, chỉ thấy thông báo chưa đọc")
    void getUnreadNotifications() throws Exception {
        createNotification(studentA, NotificationTargetType.SPECIFIC_USER);
        Notification read = createNotification(studentA, NotificationTargetType.SPECIFIC_USER);
        notificationService.findDetail(read.getId(), studentA);

        mockMvc.perform(get("/api/notifications/unread")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].isRead").value(false));
    }

    @Test
    @DisplayName("GET /api/notifications/unread/count trả 200 với số đúng")
    void countUnread() throws Exception {
        createNotification(studentA, NotificationTargetType.SPECIFIC_USER);
        createNotification(studentA, NotificationTargetType.SPECIFIC_USER);

        mockMvc.perform(get("/api/notifications/unread/count")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(2));
    }

    @Test
    @DisplayName("GET /api/notifications/{id} trả 200 và tự đánh dấu đã đọc")
    void getDetailMarksRead() throws Exception {
        Notification notification = createNotification(studentA, NotificationTargetType.SPECIFIC_USER);

        mockMvc.perform(get("/api/notifications/{id}", notification.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.notificationId").value(notification.getId()))
                .andExpect(jsonPath("$.data.isRead").value(true));
    }

    @Test
    @DisplayName("GET /api/notifications/{id} thông báo của người khác trả 404")
    void getOtherUserNotificationNotFound() throws Exception {
        Notification notification = createNotification(studentB, NotificationTargetType.SPECIFIC_USER);

        mockMvc.perform(get("/api/notifications/{id}", notification.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/notifications/{id} không tồn tại trả 404")
    void getNonExistentNotificationNotFound() throws Exception {
        mockMvc.perform(get("/api/notifications/{id}", 9999L)
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /api/notifications/read-all trả 200, đánh dấu tất cả đã đọc")
    void readAllMarksAllRead() throws Exception {
        createNotification(studentA, NotificationTargetType.SPECIFIC_USER);
        createNotification(studentA, NotificationTargetType.SPECIFIC_USER);

        mockMvc.perform(put("/api/notifications/read-all")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(2));

        mockMvc.perform(get("/api/notifications/unread/count")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(0));
    }

    @Test
    @DisplayName("DELETE /api/notifications/{id} trả 204 và xóa thông báo của mình")
    void deleteOwnNotification() throws Exception {
        Notification notification = createNotification(studentA, NotificationTargetType.SPECIFIC_USER);

        mockMvc.perform(delete("/api/notifications/{id}", notification.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    @DisplayName("DELETE /api/notifications/{id} thông báo của người khác trả 404")
    void deleteOtherUserNotificationNotFound() throws Exception {
        Notification notification = createNotification(studentB, NotificationTargetType.SPECIFIC_USER);

        mockMvc.perform(delete("/api/notifications/{id}", notification.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isNotFound());
    }
}
