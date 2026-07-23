# Use Case Specification

## UC-06: Xem thông tin cá nhân

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-06 |
| **Tên Use Case** | Xem thông tin cá nhân |
| **Mục tiêu** | Cho phép người dùng xem thông tin hồ sơ cá nhân của mình. |
| **Actor** | Student, Teacher, Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Người dùng xem thông tin cá nhân bao gồm họ tên, email, số điện thoại, vai trò và ngày tham gia. Thông tin chỉ hiển thị, không chỉnh sửa. |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Thông tin cá nhân được hiển thị cho người dùng. |
| **Trigger** | Người dùng chọn "Thông tin cá nhân" hoặc nhấp vào tên/avatar trên giao diện. |

### Main Flow

1. Người dùng chọn "Thông tin cá nhân".
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và lấy user ID.
4. Hệ thống truy vấn thông tin người dùng từ cơ sở dữ liệu.
5. Hệ thống hiển thị thông tin cá nhân bao gồm:
   - Họ tên
   - Email
   - Số điện thoại
   - Vai trò (Student / Teacher / Admin)
   - Ngày tham gia
6. Người dùng xem thông tin.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | — | Không có alternative flow cho Use Case này. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | Không tìm thấy thông tin người dùng | Hệ thống thông báo "Không tìm thấy thông tin người dùng". Ghi log lỗi. Kết thúc Use Case. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Người dùng chỉ xem được thông tin của chính mình. |
| BR-02 | Thông tin cá nhân được lấy dựa trên user ID từ JWT token. |
| BR-03 | Không hiển thị mật khẩu dưới bất kỳ hình thức nào. |
| BR-04 | API trả về thông tin phải che giấu dữ liệu nhạy cảm (nếu có). |

### Include

Không.

### Extend

Không.

### Ghi chú

- Use Case này chỉ hiển thị thông tin — không cho phép chỉnh sửa. Nếu cần cập nhật thông tin, có thể thêm UC "Cập nhật thông tin cá nhân" sau này.
- Giao diện hiển thị có thể khác nhau giữa các role (VD: Admin thấy thêm thông tin quyền hạn), nhưng dữ liệu cốt lõi giống nhau.
