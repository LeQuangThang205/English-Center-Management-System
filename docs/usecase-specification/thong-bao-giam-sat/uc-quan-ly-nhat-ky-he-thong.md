# Use Case Specification

## UC-37: Quản lý nhật ký hệ thống

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-37 |
| **Tên Use Case** | Quản lý nhật ký hệ thống |
| **Mục tiêu** | Cho phép Admin xem, tìm kiếm và lọc nhật ký hệ thống (Audit Log) để theo dõi hoạt động và phục vụ kiểm tra. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin xem danh sách nhật ký hệ thống ghi lại tất cả các thao tác quan trọng (tạo, cập nhật, xóa, duyệt, từ chối, thanh toán). Admin có thể tìm kiếm, lọc và xem chi tiết từng bản ghi. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu. Danh sách nhật ký được hiển thị. |
| **Trigger** | Admin chọn "Nhật ký hệ thống" trên menu quản trị. |

### Main Flow

1. Admin chọn "Nhật ký hệ thống" trên menu quản trị.
2. Hệ thống nhận request kèm JWT token.
3. Hệ thống xác thực token và kiểm tra quyền Admin.
4. Hệ thống truy vấn danh sách nhật ký từ bảng Audit Log.
5. Hệ thống hiển thị danh sách dạng bảng kèm phân trang, bao gồm:
   - Thời gian
   - Người thực hiện (email/ID)
   - Hành động (CREATE / UPDATE / DELETE / APPROVE / REJECT / PAYMENT)
   - Đối tượng (tên bảng + ID)
   - Mô tả tóm tắt
   - Địa chỉ IP
6. Admin xem danh sách.
7. Admin chọn một bản ghi để xem chi tiết.
8. Hệ thống hiển thị chi tiết bao gồm: dữ liệu cũ (nếu có), dữ liệu mới, thông tin đầy đủ.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin tìm kiếm nhật ký | Admin nhập từ khóa (email, hành động, đối tượng). Hệ thống lọc danh sách. |
| A2 | Admin lọc theo khoảng thời gian | Admin chọn từ ngày - đến ngày. Hệ thống lọc nhật ký trong khoảng thời gian. |
| A3 | Admin lọc theo hành động | Admin chọn loại hành động (CREATE / UPDATE / DELETE / ...). Hệ thống lọc theo hành động. |
| A4 | Admin lọc theo người thực hiện | Admin chọn người dùng cụ thể. Hệ thống lọc nhật ký của người dùng đó. |
| A5 | Admin xuất nhật ký | Admin chọn "Xuất". Hệ thống xuất file CSV/Excel danh sách nhật ký hiện tại. |
| A6 | Không có nhật ký | Hệ thống hiển thị thông báo "Không có nhật ký nào". |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống yêu cầu đăng nhập lại. Kết thúc Use Case. |
| E2 | Lỗi truy vấn dữ liệu | Hệ thống thông báo "Không thể tải nhật ký hệ thống". Ghi log lỗi. Kết thúc Use Case. |
| E3 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền xem nhật ký hệ thống. |
| BR-02 | Nhật ký là dữ liệu chỉ đọc (read-only) — không cho phép chỉnh sửa hoặc xóa. |
| BR-03 | Các hành động được ghi nhận bao gồm: CREATE, UPDATE, DELETE, APPROVE, REJECT, PAYMENT, LOGIN, LOGOUT. |
| BR-04 | Nhật ký cũ hơn 12 tháng có thể được nén hoặc lưu trữ riêng (theo chính sách lưu trữ). |
| BR-05 | Mỗi bản ghi nhật ký phải bao gồm: thời gian, người thực hiện, hành động, đối tượng, dữ liệu thay đổi, địa chỉ IP. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Đây là trung tâm quản lý Audit Log — dữ liệu được ghi tự động bởi các use case khác theo quy tắc BR đã thống nhất.
- Nhật ký phục vụ kiểm tra (audit) và truy vết khi có sự cố.
- Có thể mở rộng sau: cảnh báo khi phát hiện hành động bất thường.
