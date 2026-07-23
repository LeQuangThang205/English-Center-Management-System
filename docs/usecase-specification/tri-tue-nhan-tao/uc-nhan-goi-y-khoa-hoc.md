# Use Case Specification

## UC-31: Nhận gợi ý khóa học

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-31 |
| **Tên Use Case** | Nhận gợi ý khóa học |
| **Mục tiêu** | Cho phép Student nhận các gợi ý khóa học được cá nhân hóa dựa trên lịch sử học tập, sở thích và trình độ. |
| **Actor** | Student |
| **Secondary Actor** | AI Service (TBD) |
| **Mô tả** | Hệ thống gửi thông tin hồ sơ học viên và lịch sử học tập đến AI Service. AI Service phân tích và trả về danh sách khóa học gợi ý. Hệ thống hiển thị danh sách gợi ý cho Student. |
| **Tiền điều kiện** | Student đã đăng nhập với JWT token hợp lệ. Student có ít nhất một khóa học đã hoàn thành hoặc đã tham gia. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Danh sách khóa học gợi ý được hiển thị. |
| **Trigger** | Student chọn "Gợi ý khóa học" trên trang chủ hoặc trang danh sách khóa học. |

### Main Flow

1. Student chọn "Gợi ý khóa học".
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và lấy thông tin Student.
4. Hệ thống thu thập dữ liệu đầu vào cho AI Service:
   - Các khóa học Student đã tham gia
   - Điểm số và kết quả học tập
   - Cấp độ hiện tại
   - Sở thích (nếu có)
5. Hệ thống gửi dữ liệu đến AI Service.
6. AI Service phân tích và trả về danh sách khóa học gợi ý kèm điểm tương thích.
7. Hệ thống hiển thị danh sách gợi ý bao gồm:
   - Tên khóa học
   - Cấp độ
   - Học phí
   - Điểm tương thích (%)
   - Lý do gợi ý ngắn gọn
8. Student xem danh sách gợi ý.
9. Student có thể chọn một khóa học để xem chi tiết (UC-13) hoặc đăng ký (UC-20).

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Student chưa có lịch sử học tập | Hệ thống hiển thị danh sách khóa học phổ biến hoặc khóa học dành cho người mới bắt đầu. Không gọi AI Service. |
| A2 | Student làm mới gợi ý | Student chọn "Làm mới". Hệ thống gọi lại AI Service để lấy gợi ý mới (có thể khác do AI). |
| A3 | Student lọc gợi ý theo cấp độ | Student chọn bộ lọc cấp độ. Hệ thống lọc danh sách gợi ý hiện tại và hiển thị kết quả phù hợp. |
| A4 | Không có gợi ý phù hợp | AI Service trả về danh sách rỗng hoặc không đủ dữ liệu. Hệ thống hiển thị thông báo "Hiện chưa có gợi ý phù hợp cho bạn" và gợi ý duyệt tất cả khóa học. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | AI Service không phản hồi hoặc timeout | Hệ thống hiển thị danh sách khóa học phổ biến thay thế (fallback). Ghi log lỗi. Kết thúc Use Case. |
| E2 | AI Service trả về dữ liệu không hợp lệ | Hệ thống thông báo "Không thể tải gợi ý, vui lòng thử lại sau". Ghi log lỗi. Kết thúc Use Case. |
| E3 | Token không hợp lệ hoặc hết hạn | Hệ thống yêu cầu đăng nhập lại. Kết thúc Use Case. |
| E4 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Student mới có quyền nhận gợi ý khóa học. |
| BR-02 | Dữ liệu gửi đến AI Service không bao gồm thông tin nhạy cảm (mật khẩu, thông tin thanh toán). |
| BR-03 | Kết quả gợi ý được lưu cache trong 24 giờ để giảm tải AI Service. |
| BR-04 | Nếu AI Service không khả dụng, hệ thống fallback về danh sách khóa học phổ biến. |
| BR-05 | Điểm tương thích là phần trăm do AI Service tính toán dựa trên dữ liệu đầu vào. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Gợi ý khóa học giúp Student tìm được khóa học phù hợp với năng lực và mục tiêu, tăng tỷ lệ chuyển đổi đăng ký.
- Cache 24 giờ giúp giảm chi phí API AI nếu sử dụng dịch vụ bên thứ ba.
- Có thể mở rộng sau: gợi ý theo mục tiêu học tập (IELTS, TOEIC, giao tiếp), gợi ý lộ trình học.
