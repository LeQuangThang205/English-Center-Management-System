# Use Case Specification

## UC-10: Xem hồ sơ học viên

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-10 |
| **Tên Use Case** | Xem hồ sơ học viên |
| **Mục tiêu** | Cho phép Admin và Teacher xem thông tin chi tiết hồ sơ của một học viên. |
| **Actor** | Admin, Teacher |
| **Secondary Actor** | Không |
| **Mô tả** | Admin hoặc Teacher chọn một học viên từ danh sách để xem thông tin chi tiết hồ sơ. Thông tin chỉ hiển thị, không chỉnh sửa. |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. Người dùng có quyền truy cập (Admin hoặc Teacher). |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Thông tin hồ sơ học viên được hiển thị. |
| **Trigger** | Người dùng chọn một học viên từ danh sách và chọn "Xem hồ sơ". |

### Main Flow

1. Người dùng chọn một học viên từ danh sách học viên.
2. Hệ thống nhận request kèm JWT token và ID học viên.
3. Hệ thống xác thực token và kiểm tra quyền truy cập.
4. Hệ thống truy vấn thông tin hồ sơ học viên từ cơ sở dữ liệu.
5. Hệ thống hiển thị thông tin hồ sơ học viên bao gồm:
   - Họ tên
   - Email
   - Số điện thoại
   - Ngày sinh
   - Địa chỉ
   - Ngày tham gia
   - Trạng thái tài khoản
6. Người dùng xem thông tin.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | — | Không có alternative flow cho Use Case này. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | Không tìm thấy học viên | Hệ thống thông báo "Không tìm thấy học viên". Ghi log lỗi. Kết thúc Use Case. |
| E3 | Người dùng không có quyền truy cập | Hệ thống thông báo "Bạn không có quyền truy cập". Kết thúc Use Case. |
| E4 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Admin có thể xem hồ sơ của tất cả học viên. |
| BR-02 | Teacher chỉ xem được hồ sơ học viên trong lớp mình phụ trách. |
| BR-03 | Không hiển thị mật khẩu dưới bất kỳ hình thức nào. |
| BR-04 | Thông tin hồ sơ ở chế độ read-only — không cho phép chỉnh sửa từ Use Case này. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Use Case này chỉ hiển thị thông tin. Nếu cần cập nhật, Admin sử dụng UC-07 (Quản lý học viên).
- Teacher bị giới hạn chỉ xem được học viên thuộc lớp mình dạy.
