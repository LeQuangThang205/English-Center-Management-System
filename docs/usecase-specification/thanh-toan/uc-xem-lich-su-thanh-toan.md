# Use Case Specification

## UC-27: Xem lịch sử thanh toán

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-27 |
| **Tên Use Case** | Xem lịch sử thanh toán |
| **Mục tiêu** | Cho phép Student và Admin xem lịch sử các giao dịch thanh toán. |
| **Actor** | Student, Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Student xem danh sách các giao dịch thanh toán của mình. Admin xem lịch sử thanh toán của tất cả học viên. |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Danh sách lịch sử thanh toán được hiển thị. |
| **Trigger** | Người dùng chọn "Lịch sử thanh toán" trên giao diện. |

### Main Flow

1. Người dùng chọn "Lịch sử thanh toán".
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và xác định vai trò.
4. Hệ thống truy vấn dữ liệu dựa trên vai trò:
   - **Student**: các giao dịch của chính mình
   - **Admin**: tất cả giao dịch trong hệ thống
5. Hệ thống hiển thị danh sách dạng bảng kèm phân trang, bao gồm:
   - Mã giao dịch
   - Tên khóa học / lớp học
   - Số tiền
   - Ngày thanh toán
   - Phương thức thanh toán
   - Trạng thái
   - (Admin) Tên học viên
6. Người dùng xem danh sách.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Người dùng lọc theo trạng thái | Người dùng chọn bộ lọc (Thành công, Thất bại, Chờ thanh toán, Đã hủy). Hệ thống lọc và hiển thị kết quả. |
| A2 | Người dùng tìm kiếm giao dịch | Người dùng nhập từ khóa (mã giao dịch, tên khóa học). Hệ thống lọc và hiển thị kết quả. |
| A3 | Admin lọc theo học viên | Admin chọn học viên cụ thể. Hệ thống hiển thị lịch sử thanh toán của học viên đó. |
| A4 | Không có giao dịch nào | Hệ thống hiển thị thông báo "Chưa có giao dịch thanh toán nào". |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Student chỉ xem được lịch sử thanh toán của chính mình. |
| BR-02 | Admin xem được lịch sử thanh toán của tất cả học viên. |
| BR-03 | Danh sách hiển thị kèm phân trang, sắp xếp theo ngày thanh toán mới nhất. |
| BR-04 | Không hiển thị thông tin thẻ/tài khoản ngân hàng đầy đủ (bảo mật). |

### Include

Không.

### Extend

Không.

### Ghi chú

- Lịch sử thanh toán khác với nhật ký giao dịch (UC-28). Lịch sử thanh toán hiển thị thông tin giao dịch ở mức nghiệp vụ, phù hợp cho cả Student.
- UC-28 (Xem nhật ký giao dịch) dành cho Admin, hiển thị log kỹ thuật từ Payment Gateway.
