# Use Case Specification

## UC-07: Quản lý học viên

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-07 |
| **Tên Use Case** | Quản lý học viên |
| **Mục tiêu** | Cho phép Admin quản lý hồ sơ học viên bao gồm tạo, xem, cập nhật và vô hiệu hóa tài khoản học viên. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin thực hiện các thao tác quản lý hồ sơ học viên: tạo học viên mới (kèm tài khoản), cập nhật thông tin, vô hiệu hóa/kích hoạt tài khoản, tìm kiếm và xem danh sách. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Thông tin học viên được tạo, cập nhật hoặc trạng thái tài khoản thay đổi thành công. |
| **Trigger** | Admin chọn chức năng "Quản lý học viên" trên menu quản trị. |

### Main Flow

1. Admin chọn "Thêm học viên".
2. Hệ thống hiển thị form tạo học viên bao gồm: họ tên, email, số điện thoại, ngày sinh, địa chỉ.
3. Admin nhập thông tin và gửi form.
4. Hệ thống kiểm tra email chưa tồn tại trong hệ thống.
5. Hệ thống kiểm tra định dạng email và số điện thoại hợp lệ.
6. Hệ thống tạo tài khoản người dùng mới với role Student (mật khẩu mặc định do hệ thống sinh).
7. Hệ thống tạo hồ sơ học viên liên kết với tài khoản.
8. Hệ thống ghi nhận thao tác vào Audit Log.
9. Hệ thống thông báo "Tạo học viên thành công".
10. Hệ thống hiển thị lại danh sách học viên.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin cập nhật thông tin học viên | Admin chọn học viên từ danh sách. Hệ thống hiển thị form với dữ liệu hiện tại. Admin sửa thông tin và gửi. Hệ thống kiểm tra dữ liệu hợp lệ, cập nhật vào cơ sở dữ liệu, ghi Audit Log, thông báo thành công. |
| A2 | Admin vô hiệu hóa tài khoản học viên | Admin chọn học viên và chọn "Vô hiệu hóa". Hệ thống hiển thị hộp thoại xác nhận. Admin xác nhận. Hệ thống chuyển trạng thái tài khoản thành inactive, ghi Audit Log, thông báo thành công. |
| A3 | Admin kích hoạt lại tài khoản học viên | Admin chọn học viên đang bị vô hiệu hóa và chọn "Kích hoạt". Hệ thống hiển thị hộp thoại xác nhận. Admin xác nhận. Hệ thống chuyển trạng thái tài khoản thành active, ghi Audit Log, thông báo thành công. |
| A4 | Admin tìm kiếm học viên | Admin nhập từ khóa (họ tên, email, số điện thoại) vào ô tìm kiếm. Hệ thống lọc danh sách theo từ khóa và hiển thị kết quả. |
| A5 | Admin xem danh sách học viên | Admin chọn "Quản lý học viên". Hệ thống hiển thị danh sách học viên dạng bảng kèm phân trang: họ tên, email, số điện thoại, trạng thái, ngày tham gia. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Email đã tồn tại trong hệ thống | Hệ thống thông báo "Email đã được sử dụng". Yêu cầu Admin nhập email khác. Quay lại bước 3. |
| E2 | Email không đúng định dạng | Hệ thống thông báo "Email không hợp lệ". Yêu cầu Admin nhập lại. Quay lại bước 3. |
| E3 | Số điện thoại không đúng định dạng | Hệ thống thông báo "Số điện thoại không hợp lệ". Yêu cầu Admin nhập lại. Quay lại bước 3. |
| E4 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Email phải là duy nhất trong hệ thống. |
| BR-02 | Mật khẩu mặc định do hệ thống sinh, yêu cầu đổi sau lần đăng nhập đầu tiên. |
| BR-03 | Học viên không bị xóa cứng (hard delete) mà chỉ bị vô hiệu hóa (soft delete — inactive). |
| BR-04 | Mọi thao tác tạo, cập nhật, vô hiệu hóa học viên phải được ghi vào Audit Log. |
| BR-05 | Họ tên không được để trống. |
| BR-06 | Số điện thoại phải đúng định dạng số di động Việt Nam (tùy chọn). |
| BR-07 | Admin chỉ quản lý được học viên — không thể thay đổi role của tài khoản. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Khi Admin tạo học viên mới, hệ thống tự động tạo cả tài khoản (User) và hồ sơ học viên (Student Profile).
- Học viên đã có tài khoản (tự đăng ký qua UC-01) vẫn có thể được Admin cập nhật hồ sơ qua UC-07.
- Chức năng xem lịch sử đăng ký và kết quả học tập thuộc module khác.
