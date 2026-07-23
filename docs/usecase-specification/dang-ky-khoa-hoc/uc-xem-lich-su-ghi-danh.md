# Use Case Specification

## UC-25: Xem lịch sử ghi danh

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-25 |
| **Tên Use Case** | Xem lịch sử ghi danh |
| **Mục tiêu** | Cho phép Student và Admin xem lịch sử các đăng ký khóa học. |
| **Actor** | Student, Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Student xem danh sách tất cả các đăng ký đã thực hiện (tất cả trạng thái). Admin xem lịch sử ghi danh của tất cả học viên. |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Danh sách lịch sử ghi danh được hiển thị. |
| **Trigger** | Người dùng chọn "Lịch sử ghi danh" hoặc "Đăng ký của tôi" trên giao diện. |

### Main Flow

1. Người dùng chọn "Lịch sử ghi danh".
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và xác định vai trò.
4. Hệ thống truy vấn dữ liệu dựa trên vai trò:
   - **Student**: tất cả đăng ký của chính mình
   - **Admin**: tất cả đăng ký trong hệ thống
5. Hệ thống hiển thị danh sách dạng bảng kèm phân trang, bao gồm:
   - Mã đăng ký
   - Tên khóa học
   - Tên lớp học
   - Ngày đăng ký
   - Trạng thái
   - Học phí
   - (Admin) Tên học viên
6. Người dùng có thể chọn một bản ghi để xem chi tiết (chuyển sang UC-21).

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Người dùng lọc theo trạng thái | Người dùng chọn bộ lọc trạng thái (Chờ duyệt, Đã duyệt, Từ chối, Đã hủy, Đã thanh toán). Hệ thống lọc và hiển thị kết quả. |
| A2 | Người dùng tìm kiếm | Người dùng nhập từ khóa (tên khóa học, tên lớp). Hệ thống lọc danh sách. |
| A3 | Admin lọc theo học viên | Admin chọn học viên cụ thể. Hệ thống hiển thị lịch sử ghi danh của học viên đó. |
| A4 | Không có lịch sử ghi danh | Hệ thống hiển thị thông báo "Bạn chưa đăng ký khóa học nào" (Student) hoặc "Chưa có ghi danh nào" (Admin). |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Student chỉ xem được lịch sử ghi danh của chính mình. |
| BR-02 | Admin xem được lịch sử ghi danh của tất cả học viên. |
| BR-03 | Danh sách hiển thị tất cả trạng thái — không lọc mặc định (có thể lọc thủ công). |
| BR-04 | Danh sách hiển thị kèm phân trang, sắp xếp theo ngày đăng ký mới nhất. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Lịch sử ghi danh bao gồm tất cả các đăng ký ở mọi trạng thái, không chỉ các đăng ký đang hoạt động.
- Student có thể dùng lịch sử này để theo dõi tiến trình đăng ký và thanh toán của mình.
