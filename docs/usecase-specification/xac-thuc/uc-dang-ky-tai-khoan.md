# Use Case Specification

## UC-01: Đăng ký tài khoản

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-01 |
| **Tên Use Case** | Đăng ký tài khoản |
| **Mục tiêu** | Cho phép Guest tạo tài khoản Student mới trong hệ thống. |
| **Actor** | Guest |
| **Secondary Actor** | Không |
| **Mô tả** | Guest cung cấp thông tin cá nhân để tạo tài khoản. Hệ thống kiểm tra tính hợp lệ và tạo tài khoản mới với vai trò Student. |
| **Tiền điều kiện** | Guest chưa có tài khoản trong hệ thống. |
| **Hậu điều kiện** | Tài khoản Student được tạo thành công. Guest có thể đăng nhập bằng tài khoản vừa tạo. |
| **Trigger** | Guest chọn chức năng "Đăng ký" trên trang đăng nhập. |

### Main Flow

1. Guest chọn chức năng "Đăng ký".
2. Hệ thống hiển thị form đăng ký bao gồm: họ tên, email, số điện thoại, mật khẩu, xác nhận mật khẩu.
3. Guest nhập đầy đủ thông tin và gửi form.
4. Hệ thống kiểm tra định dạng email hợp lệ.
5. Hệ thống kiểm tra email chưa tồn tại trong hệ thống.
6. Hệ thống kiểm tra mật khẩu và xác nhận mật khẩu khớp nhau.
7. Hệ thống kiểm tra mật khẩu đáp ứng yêu cầu độ mạnh.
8. Hệ thống mã hóa mật khẩu bằng bcrypt.
9. Hệ thống tạo tài khoản mới với role Student.
10. Hệ thống thông báo đăng ký thành công.
11. Hệ thống chuyển hướng đến trang đăng nhập.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Email đã tồn tại | Hệ thống thông báo "Email đã được đăng ký". Yêu cầu Guest nhập email khác. Quay lại bước 3. |
| A2 | Mật khẩu không khớp xác nhận | Hệ thống thông báo "Mật khẩu xác nhận không khớp". Yêu cầu Guest nhập lại. Quay lại bước 3. |
| A3 | Mật khẩu không đáp ứng yêu cầu | Hệ thống thông báo yêu cầu độ mạnh mật khẩu. Yêu cầu Guest nhập lại. Quay lại bước 3. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Email không đúng định dạng | Hệ thống thông báo "Email không hợp lệ". Yêu cầu Guest nhập lại. Quay lại bước 3. |
| E2 | Số điện thoại không đúng định dạng | Hệ thống thông báo "Số điện thoại không hợp lệ". Yêu cầu Guest nhập lại. Quay lại bước 3. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Email phải là duy nhất trong hệ thống. |
| BR-02 | Mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số. |
| BR-03 | Mật khẩu được mã hóa bằng bcrypt trước khi lưu. |
| BR-04 | Tài khoản mới tạo mặc định mang role Student. |
| BR-05 | Họ tên không được để trống. |
| BR-06 | Số điện thoại phải đúng định dạng số di động Việt Nam (tùy chọn). |

### Include

Không.

### Extend

Không.

### Ghi chú

- Sau khi đăng ký, Guest trở thành Student và phải đăng nhập để sử dụng các chức năng khác.
- Quy trình này không yêu cầu Admin duyệt tài khoản.
