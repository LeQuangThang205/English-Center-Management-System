# Use Case Specification

## UC-19: Xem điểm số

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-19 |
| **Tên Use Case** | Xem điểm số |
| **Mục tiêu** | Cho phép người dùng xem điểm số và kết quả học tập dựa trên vai trò. |
| **Actor** | Admin, Teacher, Student |
| **Secondary Actor** | Không |
| **Mô tả** | Người dùng xem điểm số và nhận xét. Student chỉ xem điểm của mình. Teacher xem điểm của học viên trong lớp mình dạy. Admin xem điểm của tất cả học viên. |
| **Tiền điều kiện** | Người dùng đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Điểm số được hiển thị. |
| **Trigger** | Người dùng chọn "Điểm số" / "Kết quả học tập" trên giao diện. |

### Main Flow

1. Người dùng chọn "Điểm số" hoặc "Kết quả học tập".
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và xác định vai trò của người dùng.
4. Hệ thống truy vấn dữ liệu điểm dựa trên vai trò:
   - **Student**: điểm của chính mình theo từng lớp đã tham gia
   - **Teacher**: bảng điểm của học viên trong các lớp được phân công
   - **Admin**: bảng điểm của tất cả học viên
5. Hệ thống hiển thị kết quả bao gồm:
   - **Student**: tên lớp, khóa học, điểm giữa kỳ, điểm cuối kỳ, điểm tổng kết, nhận xét
   - **Teacher và Admin**: danh sách học viên kèm điểm theo từng lớp
6. Người dùng xem điểm số.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Student chọn lớp cụ thể để xem điểm | Student chọn một lớp từ danh sách các lớp đã tham gia. Hệ thống hiển thị chi tiết điểm của lớp đó. |
| A2 | Teacher/Admin chọn lớp cụ thể để xem điểm | Teacher/Admin chọn lớp. Hệ thống hiển thị bảng điểm toàn bộ học viên trong lớp. |
| A3 | Chưa có điểm cho lớp | Hệ thống hiển thị thông báo "Giáo viên chưa nhập điểm cho lớp này". |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Student chỉ xem được điểm của chính mình. |
| BR-02 | Teacher chỉ xem được điểm của học viên trong lớp mình dạy. |
| BR-03 | Admin xem được điểm của tất cả học viên và tất cả lớp. |
| BR-04 | Điểm được hiển thị dưới dạng số thực (0-10) với 1 chữ số thập phân. |
| BR-05 | Điểm tổng kết có thể được đánh dấu "Đạt" hoặc "Không đạt" dựa trên ngưỡng (VD: ≥ 5.0 là Đạt). |
| BR-06 | Chỉ hiển thị điểm đã được Teacher nhập và lưu. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Điểm số do Teacher nhập qua UC-17 (Quản lý điểm).
- Kết quả "Đạt"/"Không đạt" có thể được sử dụng để xét điều kiện lên lớp hoặc cấp chứng chỉ.
