# Use Case Specification

## UC-16: Điểm danh

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-16 |
| **Tên Use Case** | Điểm danh |
| **Mục tiêu** | Cho phép Teacher điểm danh học viên trong lớp theo từng buổi học. |
| **Actor** | Teacher |
| **Secondary Actor** | Không |
| **Mô tả** | Teacher chọn lớp học, chọn buổi học (ngày), sau đó đánh dấu trạng thái có mặt/vắng/vắng có phép cho từng học viên. Hệ thống lưu kết quả điểm danh. |
| **Tiền điều kiện** | Teacher đã đăng nhập với JWT token hợp lệ. Teacher được phân công phụ trách lớp học (UC-15). Lớp học đang ở trạng thái "Đang học". |
| **Hậu điều kiện** | Kết quả điểm danh cho buổi học được lưu thành công. |
| **Trigger** | Teacher chọn lớp học và chọn "Điểm danh". |

### Main Flow

1. Teacher chọn lớp học từ danh sách lớp được phân công.
2. Teacher chọn ngày/buổi học cần điểm danh.
3. Hệ thống kiểm tra chưa có điểm danh cho buổi học này.
4. Hệ thống hiển thị danh sách học viên trong lớp.
5. Với mỗi học viên, Teacher chọn trạng thái:
   - Có mặt
   - Vắng (không phép)
   - Vắng có phép
6. Teacher gửi kết quả điểm danh.
7. Hệ thống lưu kết quả điểm danh cho từng học viên.
8. Hệ thống thông báo "Điểm danh thành công".

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Teacher sửa điểm danh đã có | Teacher chọn buổi học đã điểm danh. Hệ thống hiển thị kết quả hiện tại. Teacher sửa trạng thái và gửi. Hệ thống cập nhật kết quả, thông báo thành công. |
| A2 | Teacher điểm danh nhanh (tất cả có mặt) | Teacher chọn "Tất cả có mặt". Hệ thống tự động đặt tất cả học viên thành "Có mặt". Teacher có thể sửa từng học viên nếu cần. |
| A3 | Không có học viên nào trong lớp | Hệ thống thông báo "Lớp chưa có học viên". Kết thúc Use Case. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Teacher không được phân công lớp này | Hệ thống thông báo "Bạn không được phân công dạy lớp này". Kết thúc Use Case. |
| E2 | Lớp không ở trạng thái "Đang học" | Hệ thống thông báo "Lớp học chưa bắt đầu hoặc đã kết thúc". Kết thúc Use Case. |
| E3 | Ngày điểm danh không hợp lệ (chưa tới hoặc quá xa) | Hệ thống thông báo "Ngày điểm danh không hợp lệ". Quay lại bước 2. |
| E4 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Teacher được phân công lớp mới có quyền điểm danh. |
| BR-02 | Mỗi buổi học chỉ được điểm danh một lần (có thể sửa sau). |
| BR-03 | Điểm danh chỉ thực hiện được khi lớp ở trạng thái "Đang học". |
| BR-04 | Trạng thái điểm danh gồm: Có mặt, Vắng, Vắng có phép. |
| BR-05 | Teacher chỉ được điểm danh cho ngày hiện tại hoặc ngày trong quá khứ (không điểm danh tương lai). |
| BR-06 | Hệ thống tự động tính tỷ lệ chuyên cần dựa trên kết quả điểm danh. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Kết quả điểm danh được dùng để tính tỷ lệ chuyên cần của học viên.
- Chức năng thống kê tỷ lệ chuyên cần thuộc module Báo cáo & Dashboard.
- Có thể mở rộng sau: điểm danh qua QR code, gửi thông báo vắng học cho phụ huynh qua email.
