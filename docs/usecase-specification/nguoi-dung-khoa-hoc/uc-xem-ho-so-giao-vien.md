# Use Case Specification

## UC-11: Xem hồ sơ giáo viên

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-11 |
| **Tên Use Case** | Xem hồ sơ giáo viên |
| **Mục tiêu** | Cho phép Admin xem thông tin chi tiết hồ sơ của một giáo viên. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin chọn một giáo viên từ danh sách để xem thông tin chi tiết hồ sơ. Thông tin chỉ hiển thị, không chỉnh sửa. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Thông tin hồ sơ giáo viên được hiển thị. |
| **Trigger** | Admin chọn một giáo viên từ danh sách và chọn "Xem hồ sơ". |

### Main Flow

1. Admin chọn một giáo viên từ danh sách giáo viên.
2. Hệ thống nhận request kèm JWT token và ID giáo viên.
3. Hệ thống xác thực token và kiểm tra quyền truy cập.
4. Hệ thống truy vấn thông tin hồ sơ giáo viên từ cơ sở dữ liệu.
5. Hệ thống hiển thị thông tin hồ sơ giáo viên bao gồm:
   - Họ tên
   - Email
   - Số điện thoại
   - Chuyên môn
   - Ngày tham gia
   - Trạng thái tài khoản
6. Admin xem thông tin.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | — | Không có alternative flow cho Use Case này. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | Không tìm thấy giáo viên | Hệ thống thông báo "Không tìm thấy giáo viên". Ghi log lỗi. Kết thúc Use Case. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền xem hồ sơ giáo viên. |
| BR-02 | Không hiển thị mật khẩu dưới bất kỳ hình thức nào. |
| BR-03 | Thông tin hồ sơ ở chế độ read-only — không cho phép chỉnh sửa từ Use Case này. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Use Case này chỉ hiển thị thông tin. Nếu cần cập nhật, Admin sử dụng UC-08 (Quản lý giáo viên).
- Teacher không có quyền xem hồ sơ của giáo viên khác.
