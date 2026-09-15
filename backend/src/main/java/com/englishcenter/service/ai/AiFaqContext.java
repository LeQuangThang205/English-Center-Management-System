package com.englishcenter.service.ai;

import java.util.List;

/**
 * Kho FAQ tĩnh của trung tâm — nguồn kiến thức chung cho AI.
 *
 * Giữ ở mức hằng số backend (không entity/migration) để scope S12 gọn.
 * Nội dung song ngữ Việt — ưu tiên tiếng Việt.
 */
public final class AiFaqContext {

    private AiFaqContext() {
    }

    public record Faq(String question, String answer) {
    }

    public static final List<Faq> FAQS = List.of(
            new Faq("Cách đăng ký khóa học?",
                    "Học viên chọn lớp học đang tuyển sinh (Sắp khai giảng hoặc Đang học) và gửi yêu cầu đăng ký. "
                            + "Yêu cầu ở trạng thái Chờ duyệt cho đến khi Admin duyệt."),
            new Faq("Quy trình đăng ký gồm những bước nào?",
                    "Đăng ký (Chờ duyệt) → Admin duyệt (Đã duyệt) → Học viên tạo giao dịch và chuyển khoản → "
                            + "Học viên báo đã thanh toán → Admin xác nhận (Thành công) → Đăng ký chuyển Đã thanh toán."),
            new Faq("Thanh toán học phí như thế nào?",
                    "Học phí thanh toán bằng chuyển khoản ngân hàng. Sau khi đăng ký được duyệt, học viên tạo giao dịch, "
                            + "chuyển khoản theo mã giao dịch, rồi nhấn Báo đã thanh toán và chờ Admin xác nhận."),
            new Faq("Vì sao đăng ký bị từ chối?",
                    "Admin từ chối kèm lý do (ví dụ lớp đã đầy). Học viên xem lý do trong chi tiết đăng ký và có thể đăng ký lớp khác."),
            new Faq("Hủy đăng ký được không?",
                    "Được hủy đăng ký ở trạng thái Chờ duyệt, Đã duyệt hoặc Từ chối. Đăng ký đã thanh toán không thể hủy."),
            new Faq("Điểm danh gồm những trạng thái nào?",
                    "Có mặt, Vắng, Vắng có phép. Giáo viên điểm danh từng buổi học cho lớp đang học."),
            new Faq("Xem lịch học ở đâu?",
                    "Học viên xem lịch học trong tuần tại trang Lịch học. Giáo viên xem lịch dạy tại trang Lịch dạy."),
            new Faq("Quên mật khẩu phải làm sao?",
                    "Liên hệ Admin của trung tâm để được hỗ trợ đặt lại mật khẩu.")
    );

    public static String render() {
        StringBuilder sb = new StringBuilder("CÂU HỎI THƯỜNG GẶP:\n");
        for (Faq faq : FAQS) {
            sb.append("- Hỏi: ").append(faq.question()).append("\n");
            sb.append("  Đáp: ").append(faq.answer()).append("\n");
        }
        return sb.toString();
    }
}
