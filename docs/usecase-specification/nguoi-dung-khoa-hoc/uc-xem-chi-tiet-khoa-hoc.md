# Use Case Specification

## UC-13: Xem chi tiết khóa học

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-13 |
| **Tên Use Case** | Xem chi tiết khóa học |
| **Mục tiêu** | Cho phép người dùng xem thông tin chi tiết của một khóa học cụ thể. |
| **Actor** | Admin, Teacher, Student |
| **Secondary Actor** | Không |
| **Mô tả** | Người dùng chọn một khóa học từ danh sách (UC-12) để xem thông tin chi tiết bao gồm mô tả đầy đủ, học phí, cấp độ, thời lượng và các thông tin liên quan. |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. Người dùng đang ở màn hình danh sách khóa học (UC-12). |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Thông tin chi tiết khóa học được hiển thị. |
| **Trigger** | Người dùng chọn một khóa học từ danh sách khóa học (UC-12). |

### Main Flow

1. Người dùng chọn một khóa học từ danh sách khóa học (UC-12).
2. Hệ thống nhận request kèm JWT token và ID khóa học.
3. Hệ thống xác thực token và kiểm tra quyền truy cập.
4. Hệ thống truy vấn thông tin chi tiết khóa học từ cơ sở dữ liệu.
5. Hệ thống hiển thị thông tin chi tiết khóa học bao gồm:
   - Tên khóa học
   - Mô tả đầy đủ
   - Học phí
   - Cấp độ
   - Thời lượng (số buổi)
   - Lịch khai giảng dự kiến (nếu có)
6. Người dùng xem thông tin.
7. Người dùng có thể chọn "Quay lại" để trở về danh sách khóa học (UC-12).

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | — | Không có alternative flow cho Use Case này. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | Không tìm thấy khóa học | Hệ thống thông báo "Không tìm thấy khóa học". Quay lại danh sách khóa học (UC-12). Kết thúc Use Case. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Tất cả người dùng đã đăng nhập (Admin, Teacher, Student) đều có thể xem chi tiết khóa học. |
| BR-02 | Thông tin chi tiết chỉ hiển thị các khóa học đang hoạt động. |
| BR-03 | Lịch khai giảng dự kiến chỉ hiển thị nếu đã được Admin thiết lập. |

### Include

Không.

### Extend

Use Case này mở rộng từ UC-12 (Xem danh sách khóa học). Không có use case nào mở rộng từ UC-13.

### Ghi chú

- Use Case này chỉ hoạt động trong ngữ cảnh người dùng đã chọn một khóa học từ UC-12.
- Student có thể sử dụng thông tin này để quyết định đăng ký khóa học (module Đăng ký khóa học).
