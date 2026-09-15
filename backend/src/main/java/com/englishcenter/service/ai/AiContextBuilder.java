package com.englishcenter.service.ai;

import com.englishcenter.config.AiProperties;
import com.englishcenter.entity.AttendanceSheet;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.Transaction;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.service.AttendanceService;
import com.englishcenter.service.CourseClassService;
import com.englishcenter.service.RegistrationService;
import com.englishcenter.service.TransactionService;
import com.englishcenter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Xây dựng context dữ liệu trong phạm vi role cho AI.
 *
 * Nguyên tắc bảo vệ dữ liệu:
 * - Chỉ đưa dữ liệu thuộc phạm vi của chính currentUser (của mình / lớp mình dạy / tổng hợp ẩn danh cho admin).
 * - KHÔNG BAO GIỜ đưa: passwordHash, thông tin thẻ/tài khoản ngân hàng, dữ liệu của user khác.
 * - Context bị cắt ở maxContextChars của AiProperties.
 */
@Service
@RequiredArgsConstructor
public class AiContextBuilder {

    private static final String SYSTEM_RULES = """
            Bạn là trợ lý AI của English Center Management System. Trả lời bằng tiếng Việt, ngắn gọn.
            Chỉ trả lời dựa trên DỮ LIỆU và CÂU HỎI THƯỜNG GẶP được cấp dưới đây.
            Không được tiết lộ dữ liệu ngoài phạm vi đã cấp. Nếu người dùng hỏi dữ liệu của người khác \
            hoặc thông tin bạn không có, hãy từ chối lịch sự và gợi ý liên hệ Admin.\
            """;

    private final AiProperties properties;
    private final RegistrationService registrationService;
    private final TransactionService transactionService;
    private final CourseClassService courseClassService;
    private final AttendanceService attendanceService;
    private final UserService userService;

    public String buildSystemPrompt(User currentUser) {
        StringBuilder sb = new StringBuilder(SYSTEM_RULES);
        sb.append("\nVAI TRÒ: ").append(currentUser.getRole()).append("\n");
        if (currentUser.getRole() == Role.STUDENT) {
            appendStudentContext(sb, currentUser);
        } else if (currentUser.getRole() == Role.TEACHER) {
            appendTeacherContext(sb, currentUser);
        } else {
            appendAdminContext(sb);
        }
        sb.append("\n").append(AiFaqContext.render());
        String full = sb.toString();
        int max = properties.getMaxContextChars();
        if (full.length() > max) {
            return full.substring(0, max);
        }
        return full;
    }

    private void appendStudentContext(StringBuilder sb, User student) {
        sb.append("DỮ LIỆU CỦA BẠN:\n");
        List<Registration> registrations = registrationService.findAllByStudentId(student.getId());
        for (Registration r : registrations) {
            sb.append(String.format("- Đăng ký #%d: lớp %s (%s), trạng thái %s, học phí %s, ngày đăng ký %s%n",
                    r.getId(),
                    r.getCourseClass().getName(),
                    r.getCourseClass().getCourse().getName(),
                    r.getStatus(),
                    r.getTuitionAtRegistration(),
                    r.getRegisteredAt()));
        }
        List<Transaction> transactions = transactionService.findAll(null, null, null, student);
        for (Transaction t : transactions) {
            sb.append(String.format("- Giao dịch %s: đăng ký #%d, số tiền %s, trạng thái %s%n",
                    t.getTransactionCode(),
                    t.getRegistration().getId(),
                    t.getAmount(),
                    t.getStatus()));
        }
        appendEnrollableClasses(sb);
    }

    private void appendTeacherContext(StringBuilder sb, User teacher) {
        sb.append("LỚP BẠN DẠY:\n");
        List<CourseClass> classes = courseClassService.findAllByTeacherId(teacher.getId());
        for (CourseClass cls : classes) {
            sb.append(String.format("- Lớp %s (%s), trạng thái %s, sĩ số %d/%d%n",
                    cls.getName(),
                    cls.getCourse().getName(),
                    cls.getStatus(),
                    cls.getCurrentHeadcount(),
                    cls.getMaxCapacity()));
            List<AttendanceSheet> sheets = attendanceService.findAll(cls.getId(), null, teacher);
            sb.append(String.format("  Số buổi đã điểm danh: %d%n", sheets.size()));
        }
    }

    private void appendAdminContext(StringBuilder sb) {
        long students = userService.findAllByRole(Role.STUDENT).size();
        long teachers = userService.findAllByRole(Role.TEACHER).size();
        List<CourseClass> classes = courseClassService.findAll();
        long pendingRegistrations = registrationService.findAllByStatus(
                com.englishcenter.entity.enums.RegistrationStatus.PENDING).size();
        long pendingTransactions = transactionService.findAll(
                com.englishcenter.entity.enums.TransactionStatus.PENDING_CONFIRMATION,
                null, null, adminScope()).size();
        sb.append("TỔNG HỢP HỆ THỐNG:\n");
        sb.append(String.format("- Học viên: %d, Giáo viên: %d, Tổng lớp: %d%n", students, teachers, classes.size()));
        for (CourseClass cls : classes) {
            sb.append(String.format("- Lớp %s, trạng thái %s, sĩ số %d/%d%n",
                    cls.getName(), cls.getStatus(), cls.getCurrentHeadcount(), cls.getMaxCapacity()));
        }
        sb.append(String.format("- Đăng ký chờ duyệt: %d, Giao dịch chờ xác nhận: %d%n",
                pendingRegistrations, pendingTransactions));
    }

    private User adminScope() {
        return User.builder().role(Role.ADMIN).build();
    }

    private void appendEnrollableClasses(StringBuilder sb) {
        sb.append("LỚP ĐANG TUYỂN SINH:\n");
        for (CourseClass cls : courseClassService.findAll()) {
            if (cls.getStatus() == com.englishcenter.entity.enums.ClassStatus.UPCOMING
                    || cls.getStatus() == com.englishcenter.entity.enums.ClassStatus.STUDYING) {
                sb.append(String.format("- Lớp %s (%s), trạng thái %s, sĩ số %d/%d, lịch %s %s-%s%n",
                        cls.getName(),
                        cls.getCourse().getName(),
                        cls.getStatus(),
                        cls.getCurrentHeadcount(),
                        cls.getMaxCapacity(),
                        cls.getScheduleDay(),
                        cls.getStartTime(),
                        cls.getEndTime()));
            }
        }
    }
}
