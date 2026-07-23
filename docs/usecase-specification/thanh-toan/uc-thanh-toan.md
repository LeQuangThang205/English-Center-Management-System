# Use Case Specification

## UC-26: Thanh toán

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-26 |
| **Tên Use Case** | Thanh toán |
| **Mục tiêu** | Cho phép Student thanh toán học phí bằng hình thức chuyển khoản ngân hàng qua QR Code tĩnh của trung tâm. Admin kiểm tra giao dịch thực tế và xác nhận. |
| **Actor** | Student, Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Student chọn đăng ký đã được duyệt, xem QR chuyển khoản và thông tin tài khoản ngân hàng của trung tâm. Student chuyển khoản qua ứng dụng ngân hàng, sau đó nhấn "Đã thanh toán" để báo cho hệ thống. Admin kiểm tra giao dịch thực tế trên Internet Banking và xác nhận thanh toán. |
| **Tiền điều kiện** | Student đã đăng nhập với JWT token hợp lệ. Student có ít nhất một đăng ký ở trạng thái "Đã duyệt". |
| **Hậu điều kiện** | Thanh toán thành công: Transaction trạng thái "Thành công", Registration chuyển thành "Đã thanh toán", Student được thêm vào lớp, sĩ số tăng lên 1. Thanh toán thất bại: Transaction trạng thái "Thất bại". |
| **Trigger** | Student chọn "Thanh toán" trên màn hình chi tiết đăng ký. |

### Main Flow

1. Student chọn một đăng ký có trạng thái "Đã duyệt" từ danh sách và chọn "Thanh toán".
2. Hệ thống kiểm tra đăng ký còn ở trạng thái "Đã duyệt".
3. Hệ thống tạo bản ghi giao dịch với trạng thái "Chờ xác nhận".
4. Hệ thống hiển thị mã QR chuyển khoản và thông tin tài khoản ngân hàng của trung tâm (số tài khoản, tên chủ tài khoản, ngân hàng, số tiền, nội dung chuyển khoản).
5. Student thực hiện chuyển khoản qua ứng dụng ngân hàng bằng cách quét mã QR.
6. Sau khi chuyển khoản xong, Student nhấn "Đã thanh toán" trên hệ thống.
7. Hệ thống ghi nhận yêu cầu xác nhận thanh toán và thông báo "Vui lòng chờ Admin xác nhận".
8. Admin xem danh sách giao dịch chờ xác nhận.
9. Admin kiểm tra giao dịch thực tế trên Internet Banking.
10. Nếu giao dịch khớp, Admin nhấn "Xác nhận".
11. Hệ thống cập nhật trạng thái giao dịch thành "Thành công".
12. Hệ thống cập nhật trạng thái đăng ký thành "Đã thanh toán".
13. Hệ thống thêm Student vào lớp học (cập nhật sĩ số).
14. Hệ thống thông báo "Xác nhận thanh toán thành công" cho Admin.
15. Student nhận được thông báo thanh toán thành công.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin kiểm tra và phát hiện giao dịch không khớp | Admin nhấn "Từ chối". Hệ thống cập nhật trạng thái giao dịch thành "Thất bại". Hệ thống thông báo lý do từ chối cho Student. Student có thể liên hệ trực tiếp với trung tâm. |
| A2 | Student hủy thanh toán | Student nhấn "Hủy" trước khi nhấn "Đã thanh toán". Hệ thống hủy giao dịch và quay lại màn hình danh sách đăng ký. |
| A3 | Student không nhấn "Đã thanh toán" | Giao dịch ở trạng thái "Chờ xác nhận" vô thời hạn. Admin có thể chủ động kiểm tra và xác nhận nếu phát hiện giao dịch qua Internet Banking, hoặc hủy giao dịch nếu quá hạn. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Đăng ký không còn ở trạng thái "Đã duyệt" | Hệ thống thông báo "Đăng ký không hợp lệ hoặc đã được xử lý". Kết thúc Use Case. |
| E2 | Giao dịch đã được xử lý trước đó (khi Admin xác nhận) | Hệ thống thông báo "Giao dịch đã được xử lý bởi người dùng khác". Tải lại thông tin. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ thanh toán được cho đăng ký có trạng thái "Đã duyệt". |
| BR-02 | Mỗi đăng ký chỉ được thanh toán một lần thành công. |
| BR-03 | Trạng thái giao dịch gồm: Chờ xác nhận (PENDING_CONFIRMATION), Thành công (SUCCESS), Thất bại (FAILED). |
| BR-04 | QR Code là mã tĩnh của trung tâm (không thay đổi theo từng giao dịch). |
| BR-05 | Nội dung chuyển khoản là mã giao dịch nội bộ để đối chiếu. |
| BR-06 | Sau khi Admin xác nhận, Student được thêm vào lớp và sĩ số được cập nhật. |
| BR-07 | Mọi giao dịch thanh toán phải được ghi vào Audit Log. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Thanh toán được thực hiện thủ công qua chuyển khoản ngân hàng, không qua cổng thanh toán bên thứ ba.
- QR Code là mã tĩnh của trung tâm, hiển thị kèm số tài khoản, tên chủ tài khoản, ngân hàng và số tiền.
- Việc đối chiếu giao dịch do Admin thực hiện thủ công qua Internet Banking.
- Student có thể thực hiện chuyển khoản bất kỳ lúc nào sau khi xem thông tin thanh toán, không cần ở lại trang.
