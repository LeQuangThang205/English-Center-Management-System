# Use Case Specification

## UC-32: Sử dụng trợ lý AI

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-32 |
| **Tên Use Case** | Sử dụng trợ lý AI |
| **Mục tiêu** | Cho phép Admin sử dụng trợ lý AI để hỗ trợ quản trị: phân tích dữ liệu, tạo báo cáo nhanh, trả lời câu hỏi về hệ thống. |
| **Actor** | Admin |
| **Secondary Actor** | AI Service (TBD) |
| **Mô tả** | Admin mở giao diện trợ lý AI, đặt câu hỏi hoặc yêu cầu phân tích dữ liệu. Hệ thống gửi yêu cầu kèm ngữ cảnh dữ liệu hệ thống đến AI Service, nhận phản hồi và hiển thị cho Admin. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Phản hồi từ AI được hiển thị. Hội thoại được lưu vào lịch sử trợ lý AI. |
| **Trigger** | Admin chọn "Trợ lý AI" trên menu quản trị. |

### Main Flow

1. Admin chọn "Trợ lý AI" trên menu quản trị.
2. Hệ thống hiển thị giao diện trợ lý AI với khung chat và các gợi ý câu hỏi mẫu.
3. Admin nhập câu hỏi hoặc yêu cầu (VD: "Tổng số học viên đang hoạt động", "Lớp nào có tỷ lệ vắng cao nhất").
4. Hệ thống kiểm tra nội dung không được để trống.
5. Hệ thống phân loại yêu cầu:
   - **Truy vấn dữ liệu**: Hệ thống truy vấn cơ sở dữ liệu, đóng gói kết quả và gửi đến AI Service để diễn giải.
   - **Câu hỏi thông thường**: Hệ thống gửi trực tiếp đến AI Service.
6. Hệ thống gửi yêu cầu đến AI Service kèm ngữ cảnh (dữ liệu truy vấn, vai trò Admin).
7. AI Service xử lý và trả về phản hồi.
8. Hệ thống lưu yêu cầu và phản hồi vào lịch sử.
9. Hệ thống hiển thị phản hồi trong khung chat.
10. Admin đọc phản hồi và có thể đặt câu hỏi tiếp theo (quay lại bước 3).

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin chọn câu hỏi mẫu | Admin chọn một câu hỏi từ danh sách gợi ý. Hệ thống tự động điền câu hỏi vào ô chat. Chuyển sang bước 4. |
| A2 | Admin yêu cầu xuất dữ liệu | Admin yêu cầu AI tạo báo cáo dạng bảng. AI Service trả về dữ liệu có cấu trúc. Hệ thống hiển thị kèm nút "Xuất Excel/CSV". Admin chọn xuất file. |
| A3 | Admin yêu cầu phân tích xu hướng | Admin yêu cầu phân tích (VD: "So sánh sĩ số các lớp trong tháng"). Hệ thống truy vấn dữ liệu theo thời gian, gửi đến AI Service, hiển thị kết quả kèm biểu đồ gợi ý. |
| A4 | Admin xem lịch sử trợ lý AI | Admin chọn "Lịch sử". Hệ thống hiển thị danh sách các hội thoại trước đó. Admin chọn một hội thoại để xem lại. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | AI Service không phản hồi hoặc timeout | Hệ thống thông báo "Trợ lý AI đang bận, vui lòng thử lại sau". Ghi log lỗi. Kết thúc Use Case. |
| E2 | Truy vấn dữ liệu thất bại (khi Admin hỏi về dữ liệu) | Hệ thống thông báo "Không thể truy xuất dữ liệu, vui lòng thử lại". Ghi log lỗi. Kết thúc Use Case. |
| E3 | AI Service trả về phản hồi không an toàn | Hệ thống phát hiện nội dung nhạy cảm, không hiển thị. Thông báo "Phản hồi không khả dụng". Ghi log cảnh báo bảo mật. |
| E4 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền sử dụng trợ lý AI. |
| BR-02 | Admin có thể hỏi về dữ liệu toàn hệ thống (không bị giới hạn phạm vi như Teacher). |
| BR-03 | Dữ liệu nhạy cảm (mật khẩu, thông tin thanh toán chi tiết) không được gửi đến AI Service. |
| BR-04 | Lịch sử trợ lý AI được lưu và chỉ Admin mới xem được. |
| BR-05 | Mọi yêu cầu và phản hồi từ trợ lý AI phải được ghi vào Audit Log. |
| BR-06 | Câu hỏi mẫu được Admin cấu hình trong UC-33 (Quản lý kho FAQ). |

### Include

Không.

### Extend

Không.

### Ghi chú

- Trợ lý AI dành cho Admin khác với AI Chatbot (UC-30) ở chỗ: có quyền truy cập dữ liệu hệ thống, hỗ trợ truy vấn và phân tích.
- Dữ liệu gửi đến AI Service cần được sanitize để loại bỏ thông tin nhạy cảm.
- Có thể mở rộng sau: trợ lý AI đề xuất hành động (VD: "Phát hiện 3 học viên vắng nhiều, bạn có muốn gửi email nhắc nhở?").
