package com.englishcenter.controller;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.Transaction;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.CourseStatus;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.ScheduleDay;
import com.englishcenter.entity.enums.TransactionStatus;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.CourseClassRepository;
import com.englishcenter.repository.CourseRepository;
import com.englishcenter.repository.RegistrationRepository;
import com.englishcenter.repository.TransactionRepository;
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
class TransactionControllerTest {

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
    private TransactionRepository transactionRepository;

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
    private Registration regApprovedA;
    private Registration regApprovedB;
    private Registration regPendingA;
    private Transaction txA;
    private Transaction txB;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        courseRepository.deleteAll();
        courseClassRepository.deleteAll();
        registrationRepository.deleteAll();
        transactionRepository.deleteAll();
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
        regApprovedA = createRegistration(studentA, RegistrationStatus.APPROVED);
        regApprovedB = createRegistration(studentB, RegistrationStatus.APPROVED);
        regPendingA = createRegistration(studentA, RegistrationStatus.PENDING);
        txA = createTransaction(regApprovedA);
        txB = createTransaction(regApprovedB);
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

    private Registration createRegistration(User student, RegistrationStatus status) {
        return registrationRepository.save(Registration.builder()
                .student(student)
                .courseClass(courseClass)
                .status(status)
                .tuitionAtRegistration(course.getTuition())
                .registeredAt(LocalDateTime.now())
                .approvedAt(status == RegistrationStatus.APPROVED ? LocalDateTime.now() : null)
                .build());
    }

    private Transaction createTransaction(Registration registration) {
        return transactionRepository.save(Transaction.builder()
                .registration(registration)
                .amount(registration.getTuitionAtRegistration())
                .transactionCode("TXN" + System.currentTimeMillis() + registration.getId())
                .status(TransactionStatus.PENDING_CONFIRMATION)
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtTokenProvider.generateToken(user);
    }

    private String createBody(Long registrationId) throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("registrationId", registrationId);
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("ADMIN — GET /api/transactions trả 200, thấy mọi giao dịch")
    void adminGetAll() throws Exception {
        mockMvc.perform(get("/api/transactions")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("STUDENT — GET /api/transactions trả 200, chỉ thấy giao dịch của mình")
    void studentGetOwnTransactions() throws Exception {
        mockMvc.perform(get("/api/transactions")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].studentId").value(studentA.getId()));
    }

    @Test
    @DisplayName("TEACHER — GET /api/transactions trả 403 (chỉ Student/Admin)")
    void teacherGetForbidden() throws Exception {
        mockMvc.perform(get("/api/transactions")
                        .header("Authorization", bearer(teacher)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — GET với studentId của người khác trả 403")
    void studentGetOtherStudentFilterForbidden() throws Exception {
        mockMvc.perform(get("/api/transactions")
                        .header("Authorization", bearer(studentA))
                        .param("studentId", String.valueOf(studentB.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — GET /api/transactions/{id} trả 200")
    void adminGetById() throws Exception {
        mockMvc.perform(get("/api/transactions/{id}", txA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(txA.getId()))
                .andExpect(jsonPath("$.data.transactionCode").value(txA.getTransactionCode()));
    }

    @Test
    @DisplayName("STUDENT — GET /api/transactions/{id} giao dịch của mình trả 200")
    void studentGetOwnTransactionById() throws Exception {
        mockMvc.perform(get("/api/transactions/{id}", txA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(txA.getId()));
    }

    @Test
    @DisplayName("STUDENT — GET /api/transactions/{id} giao dịch của người khác trả 403")
    void studentGetOtherTransactionForbidden() throws Exception {
        mockMvc.perform(get("/api/transactions/{id}", txB.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — POST tạo giao dịch cho đăng ký APPROVED của mình trả 201")
    void studentCreateOwnTransaction() throws Exception {
        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(regApprovedA.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.registrationId").value(regApprovedA.getId()))
                .andExpect(jsonPath("$.data.status").value("PENDING_CONFIRMATION"))
                .andExpect(jsonPath("$.data.amount").value(1500000.00));
    }

    @Test
    @DisplayName("STUDENT — POST tạo giao dịch cho đăng ký của người khác trả 403")
    void studentCreateForOtherRegistrationForbidden() throws Exception {
        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(regApprovedB.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — POST tạo giao dịch trả 403 (chỉ Student khởi tạo thanh toán)")
    void adminCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(regApprovedB.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — POST tạo giao dịch trả 403")
    void teacherCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", bearer(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(regApprovedB.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — POST tạo giao dịch cho đăng ký chưa APPROVED trả 400")
    void studentCreateForNonApprovedRegistration() throws Exception {
        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(regPendingA.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("STUDENT — PUT report-paid giao dịch của mình trả 200")
    void studentReportPaidOwnTransaction() throws Exception {
        mockMvc.perform(put("/api/transactions/{id}/report-paid", txA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(txA.getId()))
                .andExpect(jsonPath("$.data.paidAt").exists());
    }

    @Test
    @DisplayName("STUDENT — PUT report-paid giao dịch của người khác trả 403")
    void studentReportPaidOtherTransactionForbidden() throws Exception {
        mockMvc.perform(put("/api/transactions/{id}/report-paid", txB.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — PUT confirm trả 200, giao dịch SUCCESS và đăng ký PAID")
    void adminConfirmTransaction() throws Exception {
        mockMvc.perform(put("/api/transactions/{id}/confirm", txA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.confirmedAt").exists());
        mockMvc.perform(get("/api/registrations/{id}", regApprovedA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PAID"));
    }

    @Test
    @DisplayName("STUDENT — PUT confirm trả 403")
    void studentConfirmForbidden() throws Exception {
        mockMvc.perform(put("/api/transactions/{id}/confirm", txA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — PUT confirm trả 403")
    void teacherConfirmForbidden() throws Exception {
        mockMvc.perform(put("/api/transactions/{id}/confirm", txA.getId())
                        .header("Authorization", bearer(teacher)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — PUT confirm giao dịch đã SUCCESS trả 400")
    void adminConfirmAlreadyConfirmed() throws Exception {
        mockMvc.perform(put("/api/transactions/{id}/confirm", txA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/transactions/{id}/confirm", txA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("STUDENT — POST tạo giao dịch sau khi đã PAID trả 400")
    void studentCreateAfterPaid() throws Exception {
        mockMvc.perform(put("/api/transactions/{id}/confirm", txA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(regApprovedA.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("ADMIN — PUT reject trả 200, giao dịch FAILED")
    void adminRejectTransaction() throws Exception {
        mockMvc.perform(put("/api/transactions/{id}/reject", txA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("FAILED"));
    }

    @Test
    @DisplayName("STUDENT — PUT reject trả 403")
    void studentRejectForbidden() throws Exception {
        mockMvc.perform(put("/api/transactions/{id}/reject", txA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }
}
