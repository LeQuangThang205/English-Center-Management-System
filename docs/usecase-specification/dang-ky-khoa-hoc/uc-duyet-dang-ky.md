# Use Case Specification

## UC-23: Duyệt đăng ký

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-23 |
| **Tên Use Case** | Duyệt đăng ký |
| **Mục tiêu** | Cho phép Admin chấp thuận yêu cầu đăng ký khóa học của học viên. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Sau khi xem chi tiết đăng ký (UC-21), Admin duyệt yêu cầu. Hệ thống cập nhật trạng thái thành "Đã duyệt", cho phép học viên tiến hành thanh toán. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. Đăng ký đang ở trạng thái "Chờ duyệt". Admin đã xem chi tiết đăng ký (UC-21). |
| **Hậu điều kiện** | Trạng thái đăng ký được cập nhật thành "Đã duyệt". Học viên có thể tiến hành thanh toán. |
| **Trigger** | Admin chọn "Duyệt" trên màn hình chi tiết đăng ký (UC-21). |

### Main Flow

1. Admin chọn "Duyệt" trên màn hình chi tiết đăng ký.
2. Hệ thống hiển thị hộp thoại xác nhận duyệt đăng ký.
3. Admin xác nhận duyệt.
4. Hệ thống kiểm tra đăng ký vẫn ở trạng thái "Chờ duyệt" (chưa bị xử lý bởi Admin khác).
5. Hệ thống cập nhật trạng thái đăng ký thành "Đã duyệt".
6. Hệ thống ghi nhận thao tác vào Audit Log.
7. Hệ thống thông báo "Duyệt đăng ký thành công".
8. Hệ thống gửi thông báo đến Student: "Yêu cầu đăng ký của bạn đã được duyệt. Vui lòng tiến hành thanh toán."
9. Hệ thống quay lại danh sách đăng ký chờ xử lý.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin hủy duyệt | Admin chọn "Hủy" trên hộp thoại xác nhận. Đóng hộp thoại, không thay đổi dữ liệu. Kết thúc Use Case. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Đăng ký không còn ở trạng thái "Chờ duyệt" (đã bị xử lý) | Hệ thống thông báo "Đăng ký đã được xử lý bởi người dùng khác". Tải lại thông tin. Kết thúc Use Case. |
| E2 | Token không hợp lệ hoặc hết hạn | Hệ thống yêu cầu đăng nhập lại. Kết thúc Use Case. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền duyệt đăng ký. |
| BR-02 | Chỉ duyệt được đăng ký ở trạng thái "Chờ duyệt". |
| BR-03 | Mỗi đăng ký chỉ được duyệt một lần. |
| BR-04 | Sau khi duyệt, học viên có thể tiến hành thanh toán (học viên chưa được thêm vào lớp ngay). |
| BR-05 | Thao tác duyệt phải được ghi vào Audit Log. |

### Include

UC-21 (Xem chi tiết đăng ký) — Admin phải xem chi tiết trước khi duyệt.

### Extend

Use Case này kế thừa từ UC-22 (Xử lý đăng ký) theo quan hệ generalization.

### Ghi chú

- Duyệt đăng ký là bước thứ hai trong quy trình: Đăng ký → Duyệt → Thanh toán → Tham gia lớp.
- Học viên chỉ được thêm vào lớp sau khi thanh toán thành công (module Thanh toán).
- Trong trường hợp Admin duyệt nhưng học viên không thanh toán, đăng ký vẫn giữ trạng thái "Đã duyệt" cho đến khi hết hạn.
