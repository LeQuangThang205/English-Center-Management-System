# Use Case Specification

## UC-38: Xem thông báo

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-38 |
| **Tên Use Case** | Xem thông báo |
| **Mục tiêu** | Cho phép Student và Teacher xem các thông báo được gửi bởi Admin. |
| **Actor** | Student, Teacher |
| **Secondary Actor** | Không |
| **Mô tả** | Người dùng xem danh sách thông báo, đánh dấu đã đọc, và xem chi tiết từng thông báo. Thông báo bao gồm thông báo chung và thông báo riêng theo lớp. |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu (trừ trạng thái đã đọc nếu người dùng đánh dấu). Danh sách thông báo được hiển thị. |
| **Trigger** | Người dùng chọn "Thông báo" trên giao diện hoặc nhấp vào biểu tượng thông báo. |

### Main Flow

1. Người dùng chọn "Thông báo" hoặc nhấp vào biểu tượng thông báo trên header.
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và xác định vai trò.
4. Hệ thống truy vấn danh sách thông báo dành cho người dùng:
   - **Student**: thông báo chung và thông báo của lớp mình đang học
   - **Teacher**: thông báo chung và thông báo của lớp mình phụ trách
5. Hệ thống hiển thị danh sách thông báo sắp xếp theo thời gian mới nhất, bao gồm:
   - Tiêu đề
   - Tóm tắt nội dung
   - Ngày gửi
   - Trạng thái (chưa đọc / đã đọc)
6. Người dùng chọn một thông báo để xem chi tiết.
7. Hệ thống đánh dấu thông báo là "Đã đọc".
8. Hệ thống hiển thị nội dung đầy đủ của thông báo.
9. Người dùng đọc thông báo và có thể quay lại danh sách.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Người dùng đánh dấu tất cả là đã đọc | Người dùng chọn "Đánh dấu tất cả đã đọc". Hệ thống cập nhật tất cả thông báo chưa đọc thành "Đã đọc". |
| A2 | Người dùng xem thông báo chưa đọc | Người dùng chọn bộ lọc "Chưa đọc". Hệ thống chỉ hiển thị các thông báo chưa đọc. |
| A3 | Người dùng xóa thông báo | Người dùng chọn thông báo và chọn "Xóa". Hệ thống hiển thị hộp thoại xác nhận. Người dùng xác nhận. Hệ thống xóa thông báo khỏi danh sách (ẩn). |
| A4 | Không có thông báo | Hệ thống hiển thị thông báo "Không có thông báo nào". |
| A5 | Có thông báo mới (real-time) | Hệ thống hiển thị badge với số lượng thông báo chưa đọc trên biểu tượng. Khi người dùng nhấp vào, hiển thị dropdown 5 thông báo gần nhất. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống yêu cầu đăng nhập lại. Kết thúc Use Case. |
| E2 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Student chỉ xem được thông báo chung và thông báo của lớp mình đang học. |
| BR-02 | Teacher chỉ xem được thông báo chung và thông báo của lớp mình phụ trách. |
| BR-03 | Thông báo mới có trạng thái "Chưa đọc" — người dùng có thể đánh dấu đã đọc. |
| BR-04 | Thông báo được sắp xếp theo thời gian gửi, mới nhất ở trên cùng. |
| BR-05 | Badge thông báo chưa đọc hiển thị trên header ở tất cả trang khi người dùng đã đăng nhập. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Thông báo được Admin tạo qua UC-34 (Gửi thông báo).
- Có thể mở rộng sau: thông báo đẩy (push notification) qua WebSocket, thông báo qua ứng dụng mobile.
