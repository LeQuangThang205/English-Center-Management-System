# Use Case Specification

## UC-04: Quên mật khẩu

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-04 |
| **Tên Use Case** | Quên mật khẩu |
| **Mục tiêu** | Cho phép Guest đặt lại mật khẩu khi quên thông qua email. |
| **Actor** | Guest |
| **Secondary Actor** | Không |
| **Mô tả** | Guest yêu cầu đặt lại mật khẩu. Hệ thống gửi email chứa link đặt lại mật khẩu (chức năng nội bộ). Guest nhấp vào link, xác thực token và tạo mật khẩu mới. |
| **Tiền điều kiện** | Guest đã có tài khoản trong hệ thống. Guest chưa đăng nhập. |
| **Hậu điều kiện** | Mật khẩu mới được cập nhật thành công. Guest có thể đăng nhập bằng mật khẩu mới. |
| **Trigger** | Guest chọn "Quên mật khẩu" trên trang đăng nhập. |

### Main Flow

1. Guest chọn "Quên mật khẩu" trên trang đăng nhập.
2. Hệ thống hiển thị form nhập email.
3. Guest nhập email đã đăng ký.
4. Hệ thống kiểm tra email tồn tại.
5. Hệ thống tạo token đặt lại mật khẩu với thời hạn 15 phút.
6. Hệ thống gửi email chứa link đặt lại mật khẩu (kèm token).
7. Hệ thống thông báo "Vui lòng kiểm tra email để đặt lại mật khẩu".
8. Guest mở email và nhấp vào link đặt lại mật khẩu.
9. Hệ thống xác thực token hợp lệ và chưa hết hạn.
10. Hệ thống hiển thị form tạo mật khẩu mới.
11. Guest nhập mật khẩu mới và xác nhận mật khẩu.
12. Hệ thống kiểm tra mật khẩu hợp lệ.
13. Hệ thống mã hóa mật khẩu mới (bcrypt).
14. Hệ thống cập nhật mật khẩu và vô hiệu hóa token.
15. Hệ thống thông báo "Mật khẩu đã được thay đổi thành công".
16. Hệ thống chuyển hướng đến trang đăng nhập.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Email không tồn tại | Hệ thống thông báo "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu". (Không tiết lộ email có tồn tại hay không). Kết thúc Use Case. |
| A2 | Token hết hạn | Hệ thống thông báo "Link đặt lại mật khẩu đã hết hạn". Yêu cầu Guest thực hiện lại quy trình từ đầu. Quay lại bước 1. |
| A3 | Token không hợp lệ | Hệ thống thông báo "Link đặt lại mật khẩu không hợp lệ". Yêu cầu Guest thực hiện lại quy trình từ đầu. Quay lại bước 1. |
| A4 | Mật khẩu mới không đáp ứng yêu cầu | Hệ thống thông báo yêu cầu độ mạnh mật khẩu. Quay lại bước 11. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Lỗi gửi email (Email Service không phản hồi) | Hệ thống thông báo "Không thể gửi email đặt lại mật khẩu, vui lòng thử lại sau". Ghi log lỗi. Kết thúc Use Case. |
| E2 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Token đặt lại mật khẩu có thời hạn 15 phút. |
| BR-02 | Mỗi token chỉ được sử dụng một lần duy nhất. |
| BR-03 | Không tiết lộ thông tin email có tồn tại hay không (bảo mật). |
| BR-04 | Mật khẩu mới tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số. |
| BR-05 | Mật khẩu mới được mã hóa bằng bcrypt. |
| BR-06 | Email được gửi từ hệ thống, sử dụng chức năng gửi email nội bộ. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Quy trình gồm 2 giai đoạn: (1) Yêu cầu đặt lại mật khẩu qua email, (2) Đặt mật khẩu mới qua link.
- Token đặt lại mật khẩu nên được lưu ở server và liên kết với user ID để đảm bảo an toàn.
- Không yêu cầu người dùng đăng nhập để thực hiện Use Case này.
