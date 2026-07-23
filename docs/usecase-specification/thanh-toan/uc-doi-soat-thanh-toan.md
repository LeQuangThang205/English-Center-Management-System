# Use Case Specification

## UC-29: Đối soát thanh toán

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-29 |
| **Tên Use Case** | Đối soát thanh toán |
| **Mục tiêu** | Cho phép Admin đối soát các giao dịch thanh toán giữa hệ thống và báo cáo từ Payment Gateway để phát hiện sai lệch. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin xem báo cáo đối soát các giao dịch thanh toán, so sánh dữ liệu trong hệ thống với báo cáo từ Payment Gateway, và xử lý các giao dịch không khớp. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Các giao dịch sai lệch được ghi nhận và (nếu cần) được Admin điều chỉnh. |
| **Trigger** | Admin chọn "Đối soát thanh toán" trên menu quản trị. |

### Main Flow

1. Admin chọn "Đối soát thanh toán".
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và kiểm tra quyền Admin.
4. Hệ thống hiển thị bảng đối soát tổng quan bao gồm:
   - Tổng số giao dịch trong kỳ
   - Tổng số tiền trong hệ thống
   - Số giao dịch khớp / không khớp
5. Admin chọn khoảng thời gian cần đối soát.
6. Hệ thống truy vấn danh sách giao dịch trong khoảng thời gian và so sánh với dữ liệu từ Payment Gateway (nếu có báo cáo đối soát).
7. Hệ thống hiển thị danh sách giao dịch kèm trạng thái đối soát:
   - Khớp
   - Không khớp (chênh lệch số tiền)
   - Thiếu trong hệ thống (có trên Payment Gateway nhưng không có trong hệ thống)
   - Thiếu trên Payment Gateway (có trong hệ thống nhưng không có trên cổng)
8. Admin xem danh sách và ghi chú các giao dịch sai lệch.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin xuất báo cáo đối soát | Admin chọn "Xuất báo cáo". Hệ thống xuất file CSV/Excel chứa kết quả đối soát. |
| A2 | Admin điều chỉnh giao dịch sai lệch | Admin chọn giao dịch không khớp và thực hiện điều chỉnh thủ công (VD: cập nhật trạng thái, hủy giao dịch). Hệ thống ghi nhận thay đổi vào Audit Log. |
| A3 | Import báo cáo đối soát từ Payment Gateway | Admin tải lên file báo cáo từ Payment Gateway. Hệ thống phân tích và so sánh tự động. |
| A4 | Không có sai lệch | Hệ thống hiển thị thông báo "Tất cả giao dịch khớp. Không phát hiện sai lệch." |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | File báo cáo import không đúng định dạng | Hệ thống thông báo "Định dạng file không hợp lệ". Yêu cầu Admin chọn file khác. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền đối soát thanh toán. |
| BR-02 | Đối soát được thực hiện theo khoảng thời gian (ngày/tuần/tháng). |
| BR-03 | Giao dịch được coi là "Khớp" nếu mã giao dịch, số tiền và trạng thái trùng khớp giữa hệ thống và Payment Gateway. |
| BR-04 | Mọi điều chỉnh thủ công phải được ghi vào Audit Log. |
| BR-05 | Dữ liệu đối soát là read-only, ngoại trừ khi Admin thực hiện điều chỉnh thủ công. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Đối soát thanh toán giúp phát hiện các giao dịch bị thất thoát hoặc sai sót do lỗi kỹ thuật.
- Trong giai đoạn đầu, đối soát có thể được thực hiện thủ công qua import file báo cáo.
- Sau này có thể tự động hóa bằng API đối soát từ Payment Gateway.
- Use Case này không yêu cầu kết nối real-time đến Payment Gateway.
