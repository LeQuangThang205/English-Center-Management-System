# Use Case Specification

## UC-24: Từ chối đăng ký

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-24 |
| **Tên Use Case** | Từ chối đăng ký |
| **Mục tiêu** | Cho phép Admin từ chối yêu cầu đăng ký khóa học của học viên kèm lý do. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Sau khi xem chi tiết đăng ký (UC-21), Admin từ chối yêu cầu và cung cấp lý do. Hệ thống cập nhật trạng thái thành "Từ chối" và thông báo cho học viên. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. Đăng ký đang ở trạng thái "Chờ duyệt". Admin đã xem chi tiết đăng ký (UC-21). |
| **Hậu điều kiện** | Trạng thái đăng ký được cập nhật thành "Từ chối". Học viên nhận được thông báo kèm lý do từ chối. |
| **Trigger** | Admin chọn "Từ chối" trên màn hình chi tiết đăng ký (UC-21). |

### Main Flow

1. Admin chọn "Từ chối" trên màn hình chi tiết đăng ký.
2. Hệ thống hiển thị hộp thoại yêu cầu nhập lý do từ chối.
3. Admin nhập lý do từ chối (bắt buộc).
4. Admin xác nhận từ chối.
5. Hệ thống kiểm tra đăng ký vẫn ở trạng thái "Chờ duyệt" (chưa bị xử lý bởi Admin khác).
6. Hệ thống cập nhật trạng thái đăng ký thành "Từ chối", kèm lý do từ chối.
7. Hệ thống ghi nhận thao tác vào Audit Log.
8. Hệ thống thông báo "Từ chối đăng ký thành công".
9. Hệ thống gửi thông báo đến Student: "Yêu cầu đăng ký của bạn đã bị từ chối. Lý do: [lý do]".
10. Hệ thống quay lại danh sách đăng ký chờ xử lý.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin hủy thao tác từ chối | Admin chọn "Hủy" trên hộp thoại. Đóng hộp thoại, không thay đổi dữ liệu. Kết thúc Use Case. |
| A2 | Admin không nhập lý do từ chối (bỏ trống) | Hệ thống yêu cầu nhập lý do trước khi xác nhận. Quay lại bước 3. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Đăng ký không còn ở trạng thái "Chờ duyệt" (đã bị xử lý) | Hệ thống thông báo "Đăng ký đã được xử lý bởi người dùng khác". Tải lại thông tin. Kết thúc Use Case. |
| E2 | Token không hợp lệ hoặc hết hạn | Hệ thống yêu cầu đăng nhập lại. Kết thúc Use Case. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền từ chối đăng ký. |
| BR-02 | Chỉ từ chối được đăng ký ở trạng thái "Chờ duyệt". |
| BR-03 | Mỗi đăng ký chỉ được từ chối một lần. |
| BR-04 | Lý do từ chối là bắt buộc. |
| BR-05 | Thao tác từ chối phải được ghi vào Audit Log. |

### Include

UC-21 (Xem chi tiết đăng ký) — Admin phải xem chi tiết trước khi từ chối.

### Extend

Use Case này kế thừa từ UC-22 (Xử lý đăng ký) theo quan hệ generalization.

### Ghi chú

- Lý do từ chối là bắt buộc để học viên hiểu tại sao đăng ký không được chấp nhận (VD: lớp đã đầy, thông tin không hợp lệ, v.v.).
- Học viên có thể đăng ký lại lớp khác sau khi bị từ chối.
