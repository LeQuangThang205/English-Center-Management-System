# Use Case Specification

## UC-02: Đăng nhập

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-02 |
| **Tên Use Case** | Đăng nhập |
| **Mục tiêu** | Cho phép người dùng (Student, Teacher, Admin) xác thực và truy cập vào hệ thống. Guest cũng có thể đăng nhập sau khi đã đăng ký tài khoản. |
| **Actor** | Guest, Student, Teacher, Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Người dùng nhập email và mật khẩu. Hệ thống xác thực thông tin và cấp JWT token để duy trì phiên làm việc. |
| **Tiền điều kiện** | Người dùng đã có tài khoản trong hệ thống. Người dùng chưa đăng nhập. |
| **Hậu điều kiện** | Người dùng được cấp token xác thực và chuyển hướng đến giao diện tương ứng với role. |
| **Trigger** | Người dùng mở trang đăng nhập hoặc được chuyển hướng đến trang đăng nhập. |

### Main Flow

1. Hệ thống hiển thị form đăng nhập (email, mật khẩu).
2. Người dùng nhập email và mật khẩu.
3. Người dùng gửi form đăng nhập.
4. Hệ thống kiểm tra email tồn tại trong hệ thống.
5. Hệ thống kiểm tra mật khẩu khớp với mật khẩu đã mã hóa.
6. Hệ thống lấy thông tin role của người dùng.
7. Hệ thống tạo JWT token chứa thông tin user ID, role, thời hạn.
8. Hệ thống trả token về client.
9. Hệ thống chuyển hướng đến trang chủ tương ứng với role.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Email không tồn tại | Hệ thống thông báo "Email hoặc mật khẩu không đúng". Quay lại bước 2. (Không tiết lộ email có tồn tại hay không) |
| A2 | Mật khẩu không đúng | Hệ thống thông báo "Email hoặc mật khẩu không đúng". Quay lại bước 2. |
| A3 | Tài khoản bị vô hiệu hóa | Hệ thống thông báo "Tài khoản đã bị vô hiệu hóa". Kết thúc Use Case. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |
| E2 | Lỗi tạo JWT token | Hệ thống thông báo "Lỗi xác thực, vui lòng thử lại". Ghi log lỗi. Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | JWT token có thời hạn tối đa 24 giờ. |
| BR-02 | Mật khẩu được kiểm tra bằng bcrypt. |
| BR-03 | Không tiết lộ thông tin email có tồn tại hay không khi đăng nhập thất bại (bảo mật). |
| BR-04 | Sau 5 lần đăng nhập sai liên tiếp, tài khoản bị khóa tạm thời trong 15 phút. |
| BR-05 | API endpoints yêu cầu JWT token hợp lệ trong header Authorization. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Guest chỉ có thể đăng nhập sau khi đã đăng ký tài khoản thành công (UC-01).
- Sau khi đăng nhập, role của người dùng quyết định giao diện và quyền truy cập.
- JWT token được lưu ở client (localStorage hoặc cookie) và gửi kèm mỗi request API.
