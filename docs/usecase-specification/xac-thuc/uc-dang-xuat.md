# Use Case Specification

## UC-03: Đăng xuất

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-03 |
| **Tên Use Case** | Đăng xuất |
| **Mục tiêu** | Cho phép người dùng kết thúc phiên làm việc và hủy token xác thực. |
| **Actor** | Student, Teacher, Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Người dùng chọn đăng xuất. Hệ thống vô hiệu hóa token hiện tại và chuyển hướng về trang đăng nhập. |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Token bị vô hiệu hóa. Người dùng chuyển về trạng thái Guest và cần đăng nhập lại để sử dụng hệ thống. |
| **Trigger** | Người dùng chọn "Đăng xuất" trên giao diện. |

### Main Flow

1. Người dùng chọn "Đăng xuất".
2. Hệ thống hiển thị hộp thoại xác nhận đăng xuất.
3. Người dùng xác nhận đăng xuất.
4. Hệ thống thêm token hiện tại vào danh sách đen (blacklist).
5. Hệ thống xóa thông tin phiên làm việc ở server.
6. Client xóa token khỏi bộ nhớ (localStorage/cookie).
7. Hệ thống chuyển hướng đến trang đăng nhập.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Người dùng hủy xác nhận | Đóng hộp thoại, giữ nguyên phiên làm việc. Kết thúc Use Case. |
| A2 | Token đã hết hạn | Hệ thống vẫn xóa phiên làm việc và chuyển hướng về trang đăng nhập. |
| A3 | Hết thời gian chờ (session timeout) | Hệ thống tự động đăng xuất và chuyển hướng đến trang đăng nhập với thông báo "Phiên làm việc đã hết hạn". |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Lỗi khi thêm token vào blacklist | Hệ thống vẫn xóa phiên ở client và ghi log lỗi. Người dùng vẫn đăng xuất thành công. |
| E2 | Lỗi kết nối | Client tự động xóa token cục bộ và chuyển hướng. Thông báo lỗi hệ thống nếu cần. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Token bị vô hiệu hóa phải được thêm vào blacklist để không thể tái sử dụng. |
| BR-02 | Blacklist token có thể được dọn dẹp định kỳ (các token đã hết hạn). |
| BR-03 | Session timeout tự động sau 30 phút không hoạt động. |
| BR-04 | Client phải xóa token khỏi bộ nhớ cục bộ sau khi đăng xuất. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Đăng xuất nên được thực hiện cả ở client (xóa token) và server (blacklist token) để đảm bảo an toàn.
- Nếu chỉ xóa token ở client mà không blacklist ở server, token cũ vẫn có thể được dùng nếu bị đánh cắp.
