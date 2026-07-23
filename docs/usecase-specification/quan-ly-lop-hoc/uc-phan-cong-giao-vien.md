# Use Case Specification

## UC-15: Phân công giáo viên

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-15 |
| **Tên Use Case** | Phân công giáo viên |
| **Mục tiêu** | Cho phép Admin phân công giáo viên phụ trách một lớp học hoặc thay đổi/hủy phân công hiện tại. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin chọn lớp học và phân công một giáo viên phụ trách. Admin cũng có thể thay đổi giáo viên khác hoặc hủy phân công. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. Lớp học (UC-14) và giáo viên (UC-08) đã tồn tại trong hệ thống. |
| **Hậu điều kiện** | Giáo viên được phân công/thay đổi/hủy phân công cho lớp thành công. |
| **Trigger** | Admin chọn lớp học và chọn "Phân công giáo viên". |

### Main Flow

1. Admin chọn một lớp học từ danh sách lớp.
2. Admin chọn "Phân công giáo viên".
3. Hệ thống hiển thị danh sách giáo viên đang hoạt động (chưa bị vô hiệu hóa) dạng dropdown hoặc danh sách chọn.
4. Hệ thống hiển thị giáo viên hiện tại (nếu đã có phân công).
5. Admin chọn giáo viên từ danh sách.
6. Hệ thống kiểm tra giáo viên không bị trùng lịch với lớp khác (cảnh báo nếu có xung đột).
7. Hệ thống gán giáo viên cho lớp học.
8. Hệ thống ghi nhận thao tác vào Audit Log.
9. Hệ thống thông báo "Phân công giáo viên thành công".

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin thay đổi giáo viên cho lớp | Admin chọn lớp đã có giáo viên. Hệ thống hiển thị giáo viên hiện tại. Admin chọn giáo viên mới. Hệ thống cập nhật, ghi Audit Log, thông báo thành công. |
| A2 | Admin hủy phân công giáo viên | Admin chọn lớp và chọn "Hủy phân công". Hệ thống hiển thị hộp thoại xác nhận. Admin xác nhận. Hệ thống xóa phân công, ghi Audit Log, thông báo thành công. |
| A3 | Giáo viên bị trùng lịch | Hệ thống hiển thị cảnh báo xung đột lịch. Admin có thể xác nhận tiếp tục hoặc chọn giáo viên khác. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Lớp học không tồn tại hoặc đã bị hủy | Hệ thống thông báo "Lớp học không hợp lệ". Kết thúc Use Case. |
| E2 | Giáo viên không tồn tại hoặc đã bị vô hiệu hóa | Hệ thống thông báo "Giáo viên không hợp lệ". Quay lại bước 5. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền phân công giáo viên. |
| BR-02 | Một lớp học chỉ có một giáo viên phụ trách chính. |
| BR-03 | Một giáo viên có thể được phân công nhiều lớp, nhưng không được trùng lịch. |
| BR-04 | Chỉ phân công được giáo viên đang hoạt động (active). |
| BR-05 | Mọi thao tác phân công, thay đổi, hủy phân công phải được ghi vào Audit Log. |
| BR-06 | Không thể phân công giáo viên cho lớp đã ở trạng thái "Đã hủy" hoặc "Đã kết thúc". |

### Include

Không.

### Extend

Không.

### Ghi chú

- Phân công giáo viên là use case độc lập với UC-14 (Quản lý lớp học) — Admin có thể tạo lớp trước rồi phân công giáo viên sau.
- Kiểm tra trùng lịch là cảnh báo (warning), không phải chặn cứng (block), để linh hoạt cho Admin.
- Nếu cần, có thể mở rộng sau để hỗ trợ nhiều giáo viên cho một lớp.
