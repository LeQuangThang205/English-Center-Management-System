package com.englishcenter.controller;

import com.englishcenter.entity.AttendanceSheet;
import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.AttendanceStatus;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.CourseStatus;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.ScheduleDay;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.AttendanceSheetRepository;
import com.englishcenter.repository.CourseClassRepository;
import com.englishcenter.repository.CourseRepository;
import com.englishcenter.repository.RegistrationRepository;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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
class AttendanceControllerTest {

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
    private AttendanceSheetRepository attendanceSheetRepository;

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
    private AttendanceSheet sheetA;
    private AttendanceSheet sheetB;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        courseRepository.deleteAll();
        courseClassRepository.deleteAll();
        registrationRepository.deleteAll();
        attendanceSheetRepository.deleteAll();
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
        sheetA = createSheet(studyingClass, LocalDate.now().minusDays(1), teacherA);
        sheetB = createSheet(teacherBClass, LocalDate.now().minusDays(2), teacherB);
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

    private AttendanceSheet createSheet(CourseClass courseClass, LocalDate date, User createdBy) {
        return attendanceSheetRepository.save(AttendanceSheet.builder()
                .courseClass(courseClass)
                .date(date)
                .createdBy(createdBy)
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtTokenProvider.generateToken(user);
    }

    private String createBody(Long classId, LocalDate date, Long... studentIds) throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("classId", classId);
        body.put("date", date.toString());
        List<Map<String, Object>> records = new ArrayList<>();
        for (Long studentId : studentIds) {
            Map<String, Object> record = new HashMap<>();
            record.put("studentId", studentId);
            record.put("status", AttendanceStatus.PRESENT.name());
            records.add(record);
        }
        body.put("records", records);
        return objectMapper.writeValueAsString(body);
    }

    private String updateBody(Long... studentIds) throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        List<Map<String, Object>> records = new ArrayList<>();
        for (Long studentId : studentIds) {
            Map<String, Object> record = new HashMap<>();
            record.put("studentId", studentId);
            record.put("status", AttendanceStatus.ABSENT.name());
            records.add(record);
        }
        body.put("records", records);
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("TEACHER — POST tạo phiếu điểm danh cho lớp của mình trả 201")
    void teacherCreateOwnClassSheet() throws Exception {
        mockMvc.perform(post("/api/attendance/sheets")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studyingClass.getId(), LocalDate.now().minusDays(3), studentA.getId(), studentB.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.classId").value(studyingClass.getId()))
                .andExpect(jsonPath("$.data.date").value(LocalDate.now().minusDays(3).toString()))
                .andExpect(jsonPath("$.data.records.length()").value(2));
    }

    @Test
    @DisplayName("TEACHER — POST điểm danh lớp không phải của mình trả 403 (E1/BR-01)")
    void teacherCreateOtherClassForbidden() throws Exception {
        mockMvc.perform(post("/api/attendance/sheets")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(teacherBClass.getId(), LocalDate.now().minusDays(1), studentA.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — POST điểm danh lớp chưa STUDYING trả 400 (E2/BR-03)")
    void teacherCreateForClassNotStudying() throws Exception {
        mockMvc.perform(post("/api/attendance/sheets")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(upcomingClass.getId(), LocalDate.now().minusDays(1), studentA.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TEACHER — POST điểm danh ngày tương lai trả 400 (E3/BR-05)")
    void teacherCreateFutureDate() throws Exception {
        mockMvc.perform(post("/api/attendance/sheets")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studyingClass.getId(), LocalDate.now().plusDays(1), studentA.getId(), studentB.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TEACHER — POST phiếu trùng lớp+ngày trả 400 (BR-02)")
    void teacherCreateDuplicateSheet() throws Exception {
        mockMvc.perform(post("/api/attendance/sheets")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studyingClass.getId(), LocalDate.now().minusDays(3), studentA.getId())))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/attendance/sheets")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studyingClass.getId(), LocalDate.now().minusDays(3), studentA.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TEACHER — POST với học viên chưa APPROVED/PAID trả 400")
    void teacherCreateWithNonEnrolledStudent() throws Exception {
        mockMvc.perform(post("/api/attendance/sheets")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studyingClass.getId(), LocalDate.now().minusDays(1), studentA.getId(), studentC.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TEACHER — POST với học viên trùng lặp trong records trả 400")
    void teacherCreateWithDuplicateStudent() throws Exception {
        mockMvc.perform(post("/api/attendance/sheets")
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studyingClass.getId(), LocalDate.now().minusDays(1), studentA.getId(), studentA.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("ADMIN — POST tạo phiếu điểm danh trả 201")
    void adminCreateSheet() throws Exception {
        mockMvc.perform(post("/api/attendance/sheets")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studyingClass.getId(), LocalDate.now().minusDays(3), studentA.getId(), studentB.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.records.length()").value(2));
    }

    @Test
    @DisplayName("STUDENT — POST tạo phiếu điểm danh trả 403")
    void studentCreateForbidden() throws Exception {
        mockMvc.perform(post("/api/attendance/sheets")
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(studyingClass.getId(), LocalDate.now().minusDays(1), studentA.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — GET /api/attendance/sheets trả 200, chỉ thấy phiếu lớp mình")
    void teacherGetOwnSheets() throws Exception {
        mockMvc.perform(get("/api/attendance/sheets")
                        .header("Authorization", bearer(teacherA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].classId").value(studyingClass.getId()));
    }

    @Test
    @DisplayName("TEACHER — GET với classId lớp của giáo viên khác trả 403")
    void teacherGetOtherClassSheetsForbidden() throws Exception {
        mockMvc.perform(get("/api/attendance/sheets")
                        .header("Authorization", bearer(teacherA))
                        .param("classId", String.valueOf(teacherBClass.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — GET /api/attendance/sheets trả 200, thấy mọi phiếu")
    void adminGetAllSheets() throws Exception {
        mockMvc.perform(get("/api/attendance/sheets")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("STUDENT — GET /api/attendance/sheets trả 403")
    void studentGetSheetsForbidden() throws Exception {
        mockMvc.perform(get("/api/attendance/sheets")
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — GET /api/attendance/sheets/{id} phiếu lớp mình trả 200")
    void teacherGetOwnSheetById() throws Exception {
        mockMvc.perform(get("/api/attendance/sheets/{id}", sheetA.getId())
                        .header("Authorization", bearer(teacherA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(sheetA.getId()))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("TEACHER — GET /api/attendance/sheets/{id} phiếu lớp khác trả 403")
    void teacherGetOtherClassSheetByIdForbidden() throws Exception {
        mockMvc.perform(get("/api/attendance/sheets/{id}", sheetB.getId())
                        .header("Authorization", bearer(teacherA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN — GET /api/attendance/sheets/{id} trả 200")
    void adminGetSheetById() throws Exception {
        mockMvc.perform(get("/api/attendance/sheets/{id}", sheetA.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(sheetA.getId()));
    }

    @Test
    @DisplayName("TEACHER — PUT cập nhật phiếu lớp mình trả 200, records được thay thế (A1)")
    void teacherUpdateOwnSheet() throws Exception {
        mockMvc.perform(put("/api/attendance/sheets/{id}", sheetA.getId())
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody(studentA.getId(), studentB.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(sheetA.getId()))
                .andExpect(jsonPath("$.data.records.length()").value(2))
                .andExpect(jsonPath("$.data.records[0].status").value("ABSENT"));
    }

    @Test
    @DisplayName("TEACHER — PUT cập nhật phiếu lớp khác trả 403")
    void teacherUpdateOtherClassSheetForbidden() throws Exception {
        mockMvc.perform(put("/api/attendance/sheets/{id}", sheetB.getId())
                        .header("Authorization", bearer(teacherA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody(studentA.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT — PUT cập nhật phiếu điểm danh trả 403")
    void studentUpdateSheetForbidden() throws Exception {
        mockMvc.perform(put("/api/attendance/sheets/{id}", sheetA.getId())
                        .header("Authorization", bearer(studentA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody(studentA.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEACHER — GET filter theo date trả 200, đúng phiếu của ngày")
    void teacherGetSheetsFilteredByDate() throws Exception {
        mockMvc.perform(get("/api/attendance/sheets")
                        .header("Authorization", bearer(teacherA))
                        .param("date", LocalDate.now().minusDays(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].date").value(LocalDate.now().minusDays(1).toString()));
    }
}
