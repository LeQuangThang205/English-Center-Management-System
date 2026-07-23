# Use Case Specification

## UC-12: Xem danh sách khóa học

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-12 |
| **Tên Use Case** | Xem danh sách khóa học |
| **Mục tiêu** | Cho phép người dùng tra cứu danh sách các khóa học có sẵn trong hệ thống. |
| **Actor** | Admin, Teacher, Student |
| **Secondary Actor** | Không |
| **Mô tả** | Người dùng xem danh sách khóa học dạng bảng/lưới, có thể tìm kiếm và lọc theo cấp độ. Từ danh sách, người dùng có thể chọn một khóa học để xem chi tiết (UC-13). |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Danh sách khóa học được hiển thị. |
| **Trigger** | Người dùng chọn chức năng "Khóa học" hoặc "Danh sách khóa học" trên giao diện. |

### Main Flow

1. Người dùng chọn "Danh sách khóa học".
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và lấy danh sách khóa học từ cơ sở dữ liệu.
4. Hệ thống hiển thị danh sách khóa học dạng lưới/thẻ bao gồm:
   - Tên khóa học
   - Cấp độ
   - Học phí
   - Thời lượng
5. Người dùng xem danh sách.
6. Người dùng có thể chọn một khóa học để xem chi tiết (mở rộng sang UC-13).

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Người dùng tìm kiếm khóa học | Người dùng nhập từ khóa vào ô tìm kiếm. Hệ thống lọc danh sách theo tên khóa học. Hiển thị kết quả phù hợp. |
| A2 | Người dùng lọc theo cấp độ | Người dùng chọn cấp độ (Beginner / Intermediate / Advanced). Hệ thống lọc danh sách theo cấp độ đã chọn. Hiển thị kết quả phù hợp. |
| A3 | Không có khóa học nào | Hệ thống hiển thị thông báo "Hiện chưa có khóa học nào". Kết thúc Use Case. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Tất cả người dùng đã đăng nhập (Admin, Teacher, Student) đều có thể xem danh sách khóa học. |
| BR-02 | Danh sách chỉ hiển thị các khóa học đang hoạt động (không hiển thị khóa học đã xóa). |
| BR-03 | Danh sách hiển thị kèm phân trang để dễ xem. |
| BR-04 | Kết quả tìm kiếm và lọc được thực hiện ở server-side. |

### Include

Không.

### Extend

UC-13 (Xem chi tiết khóa học) — Người dùng có thể chọn một khóa học từ danh sách để xem thông tin chi tiết.

### Ghi chú

- Đây là use case cơ bản cho phép người dùng duyệt qua các khóa học có sẵn.
- Khi người dùng chọn một khóa học cụ thể, hệ thống chuyển sang UC-13 (Xem chi tiết khóa học).
