# Use Case Specification

## UC-35: Xem bảng điều khiển

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-35 |
| **Tên Use Case** | Xem bảng điều khiển |
| **Mục tiêu** | Cho phép Admin xem tổng quan hoạt động của trung tâm qua bảng điều khiển (dashboard) với các chỉ số thống kê và biểu đồ. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin truy cập bảng điều khiển để xem các chỉ số tổng quan: tổng số học viên, giáo viên, lớp học, doanh thu, tỷ lệ chuyên cần, và các biểu đồ xu hướng. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Bảng điều khiển được hiển thị. |
| **Trigger** | Admin chọn "Bảng điều khiển" trên menu quản trị hoặc sau khi đăng nhập thành công. |

### Main Flow

1. Admin chọn "Bảng điều khiển".
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và kiểm tra quyền Admin.
4. Hệ thống truy vấn và tổng hợp dữ liệu từ cơ sở dữ liệu.
5. Hệ thống hiển thị bảng điều khiển với các thành phần:
   - **Thẻ chỉ số (Cards)**: tổng học viên đang hoạt động, tổng giáo viên đang hoạt động, tổng lớp đang học, doanh thu tháng hiện tại
   - **Biểu đồ doanh thu**: doanh thu theo tháng (biểu đồ cột hoặc đường)
   - **Biểu đồ học viên mới**: số lượng học viên đăng ký mới theo tháng
   - **Biểu đồ chuyên cần**: tỷ lệ chuyên cần trung bình theo lớp
   - **Danh sách đăng ký chờ duyệt**: các đăng ký gần đây cần xử lý
   - **Thông báo gần đây**: các thông báo đã gửi
6. Admin xem bảng điều khiển.
7. Admin có thể tương tác: hover vào biểu đồ để xem chi tiết, chọn tháng để thay đổi khoảng thời gian.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin chọn khoảng thời gian khác | Admin chọn khoảng thời gian (7 ngày / 30 ngày / 90 ngày / tuỳ chỉnh). Hệ thống cập nhật lại dữ liệu biểu đồ tương ứng. |
| A2 | Admin chọn một chỉ số để xem chi tiết | Admin nhấp vào một thẻ chỉ số. Hệ thống chuyển đến trang danh sách chi tiết tương ứng (VD: nhấp vào "Tổng học viên" → danh sách học viên). |
| A3 | Admin xuất bảng điều khiển | Admin chọn "Xuất báo cáo". Hệ thống tạo file PDF/Excel tổng quan bảng điều khiển. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống yêu cầu đăng nhập lại. Kết thúc Use Case. |
| E2 | Lỗi truy vấn dữ liệu tổng hợp | Hệ thống thông báo "Không thể tải dữ liệu bảng điều khiển". Ghi log lỗi. Kết thúc Use Case. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền xem bảng điều khiển. |
| BR-02 | Dữ liệu trên bảng điều khiển là real-time (truy vấn trực tiếp từ cơ sở dữ liệu). |
| BR-03 | Các chỉ số mặc định hiển thị dữ liệu tháng hiện tại. |
| BR-04 | Biểu đồ doanh thu chỉ hiển thị các giao dịch có trạng thái "Thành công". |
| BR-05 | Dữ liệu được cache tối đa 5 phút để tránh truy vấn nặng. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Bảng điều khiển là trang mặc định sau khi Admin đăng nhập.
- Các biểu đồ sử dụng thư viện frontend (VD: Chart.js, Recharts).
- Có thể mở rộng sau: thêm widget tuỳ chỉnh, so sánh với kỳ trước.
