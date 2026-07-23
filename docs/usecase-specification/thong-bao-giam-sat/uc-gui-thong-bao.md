# Use Case Specification

## UC-34: Gửi thông báo

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-34 |
| **Tên Use Case** | Gửi thông báo |
| **Mục tiêu** | Cho phép Admin gửi thông báo đến Student, Teacher hoặc nhóm người dùng cụ thể qua email và thông báo nội bộ. |
| **Actor** | Admin |
| **Secondary Actor** | Email Service |
| **Mô tả** | Admin tạo thông báo, chọn đối tượng nhận (Student, Teacher, hoặc cá nhân), nhập nội dung và gửi. Hệ thống gửi thông báo nội bộ và email đến người nhận. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Thông báo được gửi đến người nhận qua email và hệ thống nội bộ. |
| **Trigger** | Admin chọn "Gửi thông báo" trên menu quản trị. |

### Main Flow

1. Admin chọn "Gửi thông báo".
2. Hệ thống hiển thị form tạo thông báo bao gồm: tiêu đề, nội dung, đối tượng nhận (tất cả Student / tất cả Teacher / một lớp / cá nhân).
3. Admin nhập thông tin và gửi form.
4. Hệ thống kiểm tra tiêu đề và nội dung không được để trống.
5. Hệ thống kiểm tra đối tượng nhận hợp lệ.
6. Hệ thống tạo bản ghi thông báo trong cơ sở dữ liệu.
7. Hệ thống gửi thông báo nội bộ đến những người dùng thuộc đối tượng nhận.
8. Hệ thống gửi email đến từng người nhận qua Email Service.
9. Hệ thống ghi nhận thao tác vào Audit Log.
10. Hệ thống thông báo "Gửi thông báo thành công".

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin gửi thông báo đến một lớp cụ thể | Admin chọn "Theo lớp". Hệ thống hiển thị danh sách lớp. Admin chọn lớp. Hệ thống gửi thông báo đến tất cả học viên và giáo viên của lớp đó. |
| A2 | Admin gửi thông báo đến cá nhân | Admin chọn "Cá nhân". Hệ thống hiển thị ô tìm kiếm người dùng. Admin tìm và chọn người nhận. Hệ thống gửi thông báo đến người đó. |
| A3 | Admin gửi thông báo có tệp đính kèm | Admin chọn đính kèm file (PDF, hình ảnh). Hệ thống upload file và gửi kèm thông báo. |
| A4 | Email Service không gửi được | Hệ thống ghi log lỗi email. Thông báo nội bộ vẫn được gửi thành công. Hệ thống thông báo "Thông báo nội bộ đã gửi, nhưng email không thể gửi đến một số người nhận". |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Tiêu đề để trống | Hệ thống thông báo "Tiêu đề không được để trống". Quay lại bước 3. |
| E2 | Nội dung để trống | Hệ thống thông báo "Nội dung không được để trống". Quay lại bước 3. |
| E3 | Đối tượng nhận không hợp lệ | Hệ thống thông báo "Vui lòng chọn đối tượng nhận". Quay lại bước 3. |
| E4 | Email Service không phản hồi | Hệ thống ghi log lỗi. Thông báo nội bộ vẫn được gửi. Kết thúc Use Case. |
| E5 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền gửi thông báo. |
| BR-02 | Mỗi thông báo có thể gửi đến nhiều đối tượng (Student, Teacher, hoặc cả hai). |
| BR-03 | Thông báo được lưu trong hệ thống và hiển thị qua UC-38 (Xem thông báo). |
| BR-04 | Email được gửi qua Email Service (SMTP) — nội dung là bản sao của thông báo nội bộ. |
| BR-05 | Mọi thao tác gửi thông báo phải được ghi vào Audit Log. |
| BR-06 | Dung lượng tệp đính kèm tối đa 10MB. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Thông báo được gửi qua 2 kênh: thông báo nội bộ (trong hệ thống) và email.
- Nếu Email Service lỗi, thông báo nội bộ vẫn hoạt động.
- Có thể mở rộng sau: gửi thông báo theo lịch trình, gửi thông báo SMS.
