# Use Case Specification

## UC-18: Xem lịch học

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-18 |
| **Tên Use Case** | Xem lịch học |
| **Mục tiêu** | Cho phép người dùng xem lịch học/lịch dạy dựa trên vai trò của mình. |
| **Actor** | Admin, Teacher, Student |
| **Secondary Actor** | Không |
| **Mô tả** | Người dùng xem lịch học dạng tuần hoặc tháng. Student xem lịch các lớp mình đang học. Teacher xem lịch các lớp mình dạy. Admin xem lịch tất cả lớp. |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Lịch học được hiển thị. |
| **Trigger** | Người dùng chọn "Lịch học" / "Lịch dạy" trên giao diện. |

### Main Flow

1. Người dùng chọn "Lịch học" (Student) hoặc "Lịch dạy" (Teacher) hoặc "Lịch học" (Admin).
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và xác định vai trò của người dùng.
4. Hệ thống truy vấn dữ liệu lịch dựa trên vai trò:
   - **Student**: các lớp đã đăng ký và đang hoạt động
   - **Teacher**: các lớp được phân công và đang hoạt động
   - **Admin**: tất cả các lớp đang hoạt động
5. Hệ thống hiển thị lịch dạng tuần (mặc định) hoặc dạng tháng, bao gồm:
   - Tên lớp
   - Khóa học
   - Thứ, giờ học
   - Phòng học
   - Giáo viên (với Student và Admin)
6. Người dùng xem lịch.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Người dùng chuyển đổi chế độ xem (tuần/tháng) | Người dùng chọn chế độ xem tuần hoặc tháng. Hệ thống hiển thị lại lịch theo chế độ đã chọn. |
| A2 | Người dùng chọn một ngày cụ thể | Người dùng chọn ngày trên lịch. Hệ thống hiển thị chi tiết các buổi học trong ngày đó. |
| A3 | Không có lịch trong khoảng thời gian | Hệ thống hiển thị thông báo "Không có buổi học nào trong khoảng thời gian này". |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Student chỉ xem được lịch của các lớp mình đã đăng ký và đang hoạt động. |
| BR-02 | Teacher chỉ xem được lịch của các lớp mình được phân công. |
| BR-03 | Admin xem được lịch của tất cả lớp trong hệ thống. |
| BR-04 | Lịch chỉ hiển thị các lớp có trạng thái "Đang học". |
| BR-05 | Mặc định hiển thị lịch tuần hiện tại. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Lịch học được tạo tự động dựa trên lịch học của lớp (thứ, giờ bắt đầu, giờ kết thúc) đã thiết lập ở UC-14.
- Giao diện lịch nên hỗ trợ điều hướng qua lại giữa các tuần/tháng.
- Có thể mở rộng sau: xuất lịch ra file, đồng bộ với Google Calendar.
