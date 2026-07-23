# Use Case Specification

## UC-09: Quản lý khóa học

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-09 |
| **Tên Use Case** | Quản lý khóa học |
| **Mục tiêu** | Cho phép Admin quản lý danh mục khóa học bao gồm tạo, xem, cập nhật và xóa khóa học. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin thực hiện các thao tác quản lý khóa học: tạo khóa học mới, cập nhật thông tin, xóa khóa học, tìm kiếm và xem danh sách. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Khóa học được tạo, cập nhật hoặc xóa thành công. |
| **Trigger** | Admin chọn chức năng "Quản lý khóa học" trên menu quản trị. |

### Main Flow

1. Admin chọn "Thêm khóa học".
2. Hệ thống hiển thị form tạo khóa học bao gồm: tên khóa học, mô tả, học phí, cấp độ, thời lượng (số buổi/tuần).
3. Admin nhập thông tin và gửi form.
4. Hệ thống kiểm tra tên khóa học không được để trống.
5. Hệ thống kiểm tra học phí là số dương.
6. Hệ thống kiểm tra cấp độ thuộc danh sách hợp lệ.
7. Hệ thống tạo khóa học mới trong cơ sở dữ liệu.
8. Hệ thống ghi nhận thao tác vào Audit Log.
9. Hệ thống thông báo "Tạo khóa học thành công".
10. Hệ thống hiển thị lại danh sách khóa học.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin cập nhật thông tin khóa học | Admin chọn khóa học từ danh sách. Hệ thống hiển thị form với dữ liệu hiện tại. Admin sửa thông tin và gửi. Hệ thống kiểm tra dữ liệu hợp lệ, cập nhật vào cơ sở dữ liệu, ghi Audit Log, thông báo thành công. |
| A2 | Admin xóa khóa học | Admin chọn khóa học và chọn "Xóa". Hệ thống kiểm tra khóa học không có lớp học đang hoạt động. Nếu không có lớp, hệ thống hiển thị hộp thoại xác nhận. Admin xác nhận. Hệ thống xóa khóa học, ghi Audit Log, thông báo thành công. |
| A3 | Admin tìm kiếm khóa học | Admin nhập từ khóa (tên khóa học, cấp độ) vào ô tìm kiếm. Hệ thống lọc danh sách theo từ khóa và hiển thị kết quả. |
| A4 | Admin xem danh sách khóa học | Admin chọn "Quản lý khóa học". Hệ thống hiển thị danh sách khóa học dạng bảng kèm phân trang: tên khóa học, cấp độ, học phí, thời lượng, trạng thái. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Học phí không hợp lệ (≤ 0) | Hệ thống thông báo "Học phí phải lớn hơn 0". Yêu cầu Admin nhập lại. Quay lại bước 3. |
| E2 | Tên khóa học để trống | Hệ thống thông báo "Tên khóa học không được để trống". Yêu cầu Admin nhập lại. Quay lại bước 3. |
| E3 | Cấp độ không hợp lệ | Hệ thống thông báo "Cấp độ không hợp lệ". Yêu cầu Admin chọn lại. Quay lại bước 3. |
| E4 | Khóa học đang có lớp học hoạt động (khi xóa) | Hệ thống thông báo "Không thể xóa khóa học vì đang có lớp học hoạt động". Kết thúc Use Case. |
| E5 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Tên khóa học không được để trống. |
| BR-02 | Học phí phải là số dương. |
| BR-03 | Cấp độ khóa học thuộc một trong các giá trị: Beginner, Intermediate, Advanced. |
| BR-04 | Khóa học chỉ bị xóa nếu không có lớp học nào đang hoạt động. |
| BR-05 | Mọi thao tác tạo, cập nhật, xóa khóa học phải được ghi vào Audit Log. |
| BR-06 | Thời lượng là số buổi học của khóa học (số nguyên dương). |

### Include

Không.

### Extend

Không.

### Ghi chú

- Khóa học là danh mục tổng quát. Lớp học (Class) là một thực thể riêng được tạo dựa trên khóa học (module Quản lý lớp học).
- Cấp độ có thể mở rộng thêm trong tương lai (VD: Pre-intermediate, Upper-intermediate).
