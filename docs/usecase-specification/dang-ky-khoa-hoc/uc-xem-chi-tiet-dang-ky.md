# Use Case Specification

## UC-21: Xem chi tiết đăng ký

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-21 |
| **Tên Use Case** | Xem chi tiết đăng ký |
| **Mục tiêu** | Cho phép Student và Admin xem thông tin chi tiết của một yêu cầu đăng ký. |
| **Actor** | Student, Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Student xem chi tiết đăng ký của chính mình. Admin xem chi tiết bất kỳ đăng ký nào để xử lý. Use Case này được include bởi UC-23 (Duyệt đăng ký) và UC-24 (Từ chối đăng ký). |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. Bản ghi đăng ký tồn tại. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Thông tin chi tiết đăng ký được hiển thị. |
| **Trigger** | Student chọn một đăng ký từ lịch sử. Admin chọn một đăng ký từ danh sách chờ xử lý. |

### Main Flow

1. Người dùng chọn một bản ghi đăng ký.
2. Hệ thống nhận request kèm JWT token và ID đăng ký.
3. Hệ thống xác thực token và kiểm tra quyền truy cập.
4. Hệ thống truy vấn thông tin đăng ký từ cơ sở dữ liệu.
5. Hệ thống hiển thị thông tin chi tiết bao gồm:
   - Mã đăng ký
   - Tên học viên
   - Tên khóa học
   - Tên lớp học
   - Lịch học
   - Học phí
   - Ngày đăng ký
   - Trạng thái hiện tại
   - Lý do từ chối (nếu trạng thái là "Từ chối")
6. Người dùng xem thông tin.
7. **Nếu là Admin** và trạng thái là "Chờ duyệt": hiển thị các nút "Duyệt" và "Từ chối".

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | — | Không có alternative flow cho Use Case này. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | Không tìm thấy đăng ký | Hệ thống thông báo "Không tìm thấy đăng ký". Kết thúc Use Case. |
| E3 | Student xem đăng ký của người khác | Hệ thống thông báo "Bạn không có quyền xem đăng ký này". Kết thúc Use Case. |
| E4 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Student chỉ xem được đăng ký của chính mình. |
| BR-02 | Admin xem được tất cả đăng ký. |
| BR-03 | Thông tin thanh toán không hiển thị trong Use Case này (thuộc module Thanh toán). |

### Include

Không.

### Extend

Use Case này được include bởi UC-23 (Duyệt đăng ký) và UC-24 (Từ chối đăng ký).

### Ghi chú

- Use Case này được thiết kế để phục vụ cả mục đích xem thông tin độc lập và làm bước bắt buộc trước khi Admin duyệt/từ chối (theo quan hệ include trên diagram).
- Khi được include từ UC-23 hoặc UC-24, bước 7 (hiển thị nút Duyệt/Từ chối) luôn xuất hiện.
