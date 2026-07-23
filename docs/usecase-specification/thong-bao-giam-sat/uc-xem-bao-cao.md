# Use Case Specification

## UC-36: Xem báo cáo

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-36 |
| **Tên Use Case** | Xem báo cáo |
| **Mục tiêu** | Cho phép Admin xem và xuất các báo cáo chi tiết về học viên, giáo viên, lớp học, doanh thu và chuyên cần. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin chọn loại báo cáo, thiết lập bộ lọc (khoảng thời gian, đối tượng) và xem kết quả dạng bảng/biểu đồ. Admin có thể xuất báo cáo ra file. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Báo cáo được hiển thị. |
| **Trigger** | Admin chọn "Báo cáo" trên menu quản trị. |

### Main Flow

1. Admin chọn "Báo cáo" trên menu quản trị.
2. Hệ thống hiển thị danh sách các loại báo cáo có sẵn.
3. Admin chọn một loại báo cáo (VD: Báo cáo doanh thu, Báo cáo học viên, Báo cáo lớp học, Báo cáo chuyên cần).
4. Hệ thống hiển thị bộ lọc: khoảng thời gian (từ ngày - đến ngày), các bộ lọc bổ sung theo loại báo cáo.
5. Admin thiết lập bộ lọc và chọn "Xem báo cáo".
6. Hệ thống truy vấn dữ liệu và hiển thị báo cáo dạng bảng kèm biểu đồ tổng hợp.
7. Admin xem báo cáo.
8. Admin có thể chọn "Xuất báo cáo" để tải file Excel/PDF.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin xem báo cáo doanh thu | Admin chọn "Báo cáo doanh thu". Hệ thống hiển thị: tổng doanh thu theo tháng, doanh thu theo khóa học, doanh thu theo phương thức thanh toán, biểu đồ xu hướng. |
| A2 | Admin xem báo cáo học viên | Admin chọn "Báo cáo học viên". Hệ thống hiển thị: số lượng học viên mới theo tháng, phân bố học viên theo khóa học, tỷ lệ học viên đang học/đã kết thúc. |
| A3 | Admin xem báo cáo lớp học | Admin chọn "Báo cáo lớp học". Hệ thống hiển thị: danh sách lớp kèm sĩ số, tình trạng, giáo viên, tỷ lệ chuyên cần trung bình. |
| A4 | Admin xem báo cáo chuyên cần | Admin chọn "Báo cáo chuyên cần". Hệ thống hiển thị: tỷ lệ chuyên cần theo lớp, theo học viên, danh sách học viên vắng nhiều. |
| A5 | Admin xuất báo cáo | Admin chọn "Xuất báo cáo". Hệ thống tạo file Excel/PDF với dữ liệu hiện tại. Admin tải file về. |
| A6 | Không có dữ liệu trong khoảng thời gian | Hệ thống hiển thị thông báo "Không có dữ liệu trong khoảng thời gian đã chọn". |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống yêu cầu đăng nhập lại. Kết thúc Use Case. |
| E2 | Khoảng thời gian không hợp lệ (từ ngày > đến ngày) | Hệ thống thông báo "Khoảng thời gian không hợp lệ". Yêu cầu Admin nhập lại. Quay lại bước 5. |
| E3 | Lỗi truy vấn dữ liệu | Hệ thống thông báo "Không thể tạo báo cáo, vui lòng thử lại". Ghi log lỗi. Kết thúc Use Case. |
| E4 | Lỗi xuất file | Hệ thống thông báo "Không thể xuất báo cáo, vui lòng thử lại". Ghi log lỗi. Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền xem báo cáo. |
| BR-02 | Báo cáo chỉ hiển thị dữ liệu trong khoảng thời gian đã chọn. |
| BR-03 | Khoảng thời gian mặc định là tháng hiện tại. |
| BR-04 | Khoảng thời gian tối đa cho một báo cáo là 12 tháng. |
| BR-05 | Dữ liệu báo cáo là read-only, không cho phép chỉnh sửa. |
| BR-06 | File xuất báo cáo có dung lượng tối đa 20MB. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Báo cáo khác với Bảng điều khiển (UC-35): Báo cáo chi tiết hơn, có bộ lọc, có thể xuất file.
- Có thể mở rộng sau: báo cáo tự động gửi email định kỳ, báo cáo tuỳ chỉnh.
