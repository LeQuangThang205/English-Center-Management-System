# Use Case Specification

## UC-05: Đổi mật khẩu

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-05 |
| **Tên Use Case** | Đổi mật khẩu |
| **Mục tiêu** | Cho phép người dùng đã đăng nhập thay đổi mật khẩu hiện tại. |
| **Actor** | Student, Teacher, Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Người dùng nhập mật khẩu cũ và mật khẩu mới để thay đổi mật khẩu. Hệ thống xác thực mật khẩu cũ và cập nhật mật khẩu mới. |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Mật khẩu được cập nhật thành công. Token hiện tại vẫn còn hiệu lực (hoặc yêu cầu đăng nhập lại — tùy chính sách). |
| **Trigger** | Người dùng chọn "Đổi mật khẩu" trong trang thông tin cá nhân hoặc cài đặt tài khoản. |

### Main Flow

1. Người dùng chọn chức năng "Đổi mật khẩu".
2. Hệ thống hiển thị form đổi mật khẩu: mật khẩu cũ, mật khẩu mới, xác nhận mật khẩu mới.
3. Người dùng nhập đầy đủ thông tin và gửi form.
4. Hệ thống kiểm tra mật khẩu cũ khớp với mật khẩu hiện tại.
5. Hệ thống kiểm tra mật khẩu mới khớp với xác nhận mật khẩu.
6. Hệ thống kiểm tra mật khẩu mới đáp ứng yêu cầu độ mạnh.
7. Hệ thống kiểm tra mật khẩu mới khác với mật khẩu cũ.
8. Hệ thống mã hóa mật khẩu mới bằng bcrypt.
9. Hệ thống cập nhật mật khẩu mới vào cơ sở dữ liệu.
10. Hệ thống thông báo "Đổi mật khẩu thành công".

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Mật khẩu cũ không đúng | Hệ thống thông báo "Mật khẩu cũ không đúng". Yêu cầu nhập lại. Quay lại bước 3. |
| A2 | Mật khẩu mới không khớp xác nhận | Hệ thống thông báo "Mật khẩu xác nhận không khớp". Yêu cầu nhập lại. Quay lại bước 3. |
| A3 | Mật khẩu mới trùng mật khẩu cũ | Hệ thống thông báo "Mật khẩu mới phải khác mật khẩu cũ". Yêu cầu nhập lại. Quay lại bước 3. |
| A4 | Mật khẩu mới không đáp ứng yêu cầu | Hệ thống thông báo yêu cầu độ mạnh mật khẩu. Quay lại bước 3. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |
| E2 | Token không hợp lệ hoặc hết hạn | Hệ thống yêu cầu đăng nhập lại. Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Mật khẩu mới tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số. |
| BR-02 | Mật khẩu mới phải khác mật khẩu cũ. |
| BR-03 | Mật khẩu mới được mã hóa bằng bcrypt trước khi lưu. |
| BR-04 | Sau khi đổi mật khẩu, có thể giữ nguyên phiên đăng nhập hoặc yêu cầu đăng nhập lại (tùy chính sách bảo mật). |
| BR-05 | Hành động đổi mật khẩu được ghi vào Audit Log. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Use Case này khác với UC-04 (Quên mật khẩu). UC-05 dành cho người dùng **đã đăng nhập** muốn đổi mật khẩu chủ động. UC-04 dành cho Guest **chưa đăng nhập** và quên mật khẩu.
- Nên hỗ trợ đăng nhập lại bằng mật khẩu mới ngay sau khi đổi (hoặc giữ nguyên phiên hiện tại).
