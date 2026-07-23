# Use Case Specification

## UC-39: Quản lý cài đặt hệ thống

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-39 |
| **Tên Use Case** | Quản lý cài đặt hệ thống |
| **Mục tiêu** | Cho phép Admin quản lý các cấu hình và cài đặt chung của hệ thống. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin xem và chỉnh sửa các cài đặt hệ thống: thông tin trung tâm, cấu hình học phí, cấu hình thanh toán, cấu hình email, và các thiết lập khác. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Cài đặt hệ thống được cập nhật thành công. |
| **Trigger** | Admin chọn "Cài đặt hệ thống" trên menu quản trị. |

### Main Flow

1. Admin chọn "Cài đặt hệ thống" trên menu quản trị.
2. Hệ thống hiển thị trang cài đặt với các nhóm cấu hình.
3. Admin chọn một nhóm cài đặt (VD: Thông tin trung tâm, Học phí, Thanh toán, Email).
4. Hệ thống hiển thị form với các trường cấu hình hiện tại.
5. Admin chỉnh sửa thông tin và lưu.
6. Hệ thống kiểm tra dữ liệu hợp lệ.
7. Hệ thống cập nhật cài đặt vào cơ sở dữ liệu.
8. Hệ thống ghi nhận thao tác vào Audit Log.
9. Hệ thống thông báo "Cập nhật cài đặt thành công".

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin cấu hình thông tin trung tâm | Admin chọn "Thông tin trung tâm". Hệ thống hiển thị form: tên trung tâm, địa chỉ, số điện thoại, email, logo. Admin sửa và lưu. |
| A2 | Admin cấu hình học phí | Admin chọn "Học phí". Hệ thống hiển thị: công thức tính điểm tổng kết (tỷ lệ giữa kỳ / cuối kỳ), ngưỡng điểm "Đạt". Admin sửa và lưu. |
| A3 | Admin cấu hình thanh toán | Admin chọn "Thanh toán". Hệ thống hiển thị: cấu hình Payment Gateway (API key, endpoint), thời gian timeout (phút). Admin sửa và lưu. |
| A4 | Admin cấu hình email | Admin chọn "Email". Hệ thống hiển thị: cấu hình SMTP server, email người gửi mặc định, chữ ký email. Admin sửa và lưu. Admin có thể chọn "Gửi email kiểm tra" để kiểm tra cấu hình. |
| A5 | Admin cấu hình bảo mật | Admin chọn "Bảo mật". Hệ thống hiển thị: chính sách mật khẩu (độ dài tối thiểu, yêu cầu ký tự), số lần đăng nhập sai tối đa, thời gian khóa tài khoản, thời hạn JWT token. Admin sửa và lưu. |
| A6 | Admin khôi phục cài đặt mặc định | Admin chọn "Khôi phục mặc định". Hệ thống hiển thị hộp thoại xác nhận. Admin xác nhận. Hệ thống đưa cài đặt về giá trị mặc định ban đầu, ghi Audit Log. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Dữ liệu không hợp lệ (VD: timeout là số âm) | Hệ thống thông báo lỗi tương ứng. Quay lại bước 5. |
| E2 | Token không hợp lệ hoặc hết hạn | Hệ thống yêu cầu đăng nhập lại. Kết thúc Use Case. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền quản lý cài đặt hệ thống. |
| BR-02 | Cài đặt hệ thống được lưu dưới dạng cặp key-value trong cơ sở dữ liệu. |
| BR-03 | Mọi thay đổi cài đặt phải được ghi vào Audit Log. |
| BR-04 | Một số cài đặt yêu cầu khởi động lại dịch vụ để có hiệu lực (VD: cấu hình email, thanh toán). |
| BR-05 | Cài đặt nhạy cảm (API key, mật khẩu SMTP) phải được mã hóa trước khi lưu. |
| BR-06 | Không cho phép xóa cài đặt — chỉ cho phép sửa đổi hoặc khôi phục mặc định. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Cài đặt hệ thống ảnh hưởng đến toàn bộ hoạt động của hệ thống — cần thận trọng khi thay đổi.
- Một số cài đặt (cấu hình thanh toán, email) được dùng bởi các module khác.
- Có thể mở rộng sau: phân quyền cài đặt (VD: Teacher chỉnh sửa được cài đặt lớp học), cài đặt theo từng khóa học.
