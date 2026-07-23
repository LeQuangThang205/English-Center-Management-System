# Use Case Specification

## UC-20: Đăng ký khóa học

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-20 |
| **Tên Use Case** | Đăng ký khóa học |
| **Mục tiêu** | Cho phép Student đăng ký tham gia một lớp học cụ thể. |
| **Actor** | Student |
| **Secondary Actor** | Không |
| **Mô tả** | Student chọn một lớp học từ danh sách khóa học, xem thông tin và gửi yêu cầu đăng ký. Hệ thống tạo bản ghi đăng ký với trạng thái chờ Admin duyệt. |
| **Tiền điều kiện** | Student đã đăng nhập với JWT token hợp lệ. Lớp học (UC-14) đang ở trạng thái "Sắp khai giảng". |
| **Hậu điều kiện** | Yêu cầu đăng ký được tạo với trạng thái "Chờ duyệt". |
| **Trigger** | Student chọn "Đăng ký" trên trang chi tiết khóa học hoặc chi tiết lớp học. |

### Main Flow

1. Student chọn một khóa học và xem danh sách lớp học khả dụng (từ UC-12/UC-13).
2. Student chọn một lớp học cụ thể.
3. Hệ thống kiểm tra lớp học còn chỗ trống (sĩ số hiện tại < sĩ số tối đa).
4. Hệ thống kiểm tra Student chưa đăng ký lớp học này trước đó.
5. Hệ thống hiển thị thông tin xác nhận đăng ký bao gồm: tên khóa học, tên lớp, lịch học, học phí.
6. Student xác nhận đăng ký.
7. Hệ thống tạo bản ghi đăng ký với trạng thái "Chờ duyệt".
8. Hệ thống thông báo "Đăng ký thành công, vui lòng chờ Admin duyệt".
9. Hệ thống gửi thông báo đến Admin về yêu cầu đăng ký mới.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Lớp học đã đầy sĩ số | Hệ thống thông báo "Lớp học đã đạt sĩ số tối đa". Gợi ý các lớp khác cùng khóa học (nếu có). Kết thúc Use Case. |
| A2 | Student đã đăng ký lớp này trước đó | Hệ thống thông báo "Bạn đã đăng ký lớp học này". Hiển thị trạng thái đăng ký hiện tại. Kết thúc Use Case. |
| A3 | Student hủy đăng ký trước khi xác nhận | Student chọn "Hủy" trên màn hình xác nhận. Hệ thống quay lại danh sách lớp học. Kết thúc Use Case. |
| A4 | Lớp học không ở trạng thái "Sắp khai giảng" | Hệ thống thông báo "Lớp học không nhận đăng ký". Kết thúc Use Case. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống yêu cầu đăng nhập lại. Kết thúc Use Case. |
| E2 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Student có tài khoản active mới được đăng ký. |
| BR-02 | Mỗi Student chỉ được đăng ký một lớp một lần (không trùng lặp). |
| BR-03 | Chỉ đăng ký được lớp có trạng thái "Sắp khai giảng" và còn chỗ trống. |
| BR-04 | Trạng thái đăng ký gồm: Chờ duyệt, Đã duyệt, Từ chối, Đã hủy, Đã thanh toán. |
| BR-05 | Sau khi đăng ký, Student chờ Admin duyệt trước khi tiến hành thanh toán. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Đăng ký thành công tạo bản ghi ở trạng thái "Chờ duyệt" — chưa thêm Student vào lớp ngay.
- Sau khi Admin duyệt (UC-23), Student tiến hành thanh toán (module Thanh toán).
- Sau khi thanh toán thành công, Student chính thức được thêm vào lớp.
