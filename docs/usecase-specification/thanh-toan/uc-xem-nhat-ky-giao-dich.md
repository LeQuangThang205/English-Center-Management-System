# Use Case Specification

## UC-28: Xem nhật ký giao dịch

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-28 |
| **Tên Use Case** | Xem nhật ký giao dịch |
| **Mục tiêu** | Cho phép Admin xem nhật ký chi tiết các giao dịch thanh toán từ Payment Gateway phục vụ kiểm tra và truy vết lỗi. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin xem danh sách nhật ký giao dịch bao gồm thông tin request/response từ Payment Gateway, mã lỗi, thời gian và trạng thái xử lý. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Nhật ký giao dịch được hiển thị. |
| **Trigger** | Admin chọn "Nhật ký giao dịch" trên menu quản trị. |

### Main Flow

1. Admin chọn "Nhật ký giao dịch".
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và kiểm tra quyền Admin.
4. Hệ thống truy vấn dữ liệu nhật ký giao dịch từ cơ sở dữ liệu.
5. Hệ thống hiển thị danh sách nhật ký dạng bảng kèm phân trang, bao gồm:
   - Mã giao dịch
   - Mã tham chiếu từ Payment Gateway
   - Số tiền
   - Thời gian tạo
   - Thời gian callback
   - Trạng thái
   - Mã lỗi (nếu có)
6. Admin chọn một bản ghi để xem chi tiết.
7. Hệ thống hiển thị thông tin chi tiết bao gồm:
   - Toàn bộ thông tin giao dịch
   - Request payload gửi đến Payment Gateway
   - Response payload từ Payment Gateway
   - Callback payload nhận được
   - Kết quả xác thực chữ ký

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin lọc nhật ký | Admin lọc theo khoảng thời gian, trạng thái, hoặc mã giao dịch. Hệ thống lọc và hiển thị kết quả. |
| A2 | Admin xuất nhật ký | Admin chọn "Xuất báo cáo". Hệ thống xuất file CSV/Excel danh sách nhật ký. |
| A3 | Không có nhật ký | Hệ thống hiển thị thông báo "Không có nhật ký giao dịch nào". |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống thông báo "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại". Chuyển hướng đến trang đăng nhập. Kết thúc Use Case. |
| E2 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền xem nhật ký giao dịch. |
| BR-02 | Nhật ký giao dịch là dữ liệu chỉ đọc (read-only), không cho phép chỉnh sửa. |
| BR-03 | Payload request/response được lưu dưới dạng JSON text. |
| BR-04 | Nhật ký cũ hơn 90 ngày có thể được nén hoặc xóa (theo chính sách lưu trữ). |

### Include

Không.

### Extend

Không.

### Ghi chú

- Đây là use case kỹ thuật dành cho Admin — không phải use case nghiệp vụ cho Student.
- Nhật ký giao dịch lưu toàn bộ dữ liệu request/response để phục vụ debug và đối soát.
- Không lưu thông tin nhạy cảm (số thẻ, CVV) từ Payment Gateway.
