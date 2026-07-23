# Use Case Specification

## UC-14: Quản lý lớp học

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-14 |
| **Tên Use Case** | Quản lý lớp học |
| **Mục tiêu** | Cho phép Admin quản lý các lớp học bao gồm tạo, cập nhật, hủy lớp, quản lý sĩ số và xem danh sách lớp. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin tạo lớp học mới dựa trên khóa học có sẵn, thiết lập lịch học, phòng học, sĩ số tối đa. Admin cũng có thể cập nhật thông tin, hủy lớp hoặc thêm/xóa học viên khỏi lớp. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. Khóa học (UC-09) đã tồn tại trong hệ thống. |
| **Hậu điều kiện** | Lớp học được tạo, cập nhật hoặc hủy thành công. |
| **Trigger** | Admin chọn chức năng "Quản lý lớp học" trên menu quản trị. |

### Main Flow

1. Admin chọn "Thêm lớp học".
2. Hệ thống hiển thị form tạo lớp học bao gồm: tên lớp, khóa học (dropdown), sĩ số tối đa, lịch học (thứ, giờ bắt đầu, giờ kết thúc), phòng học, ngày bắt đầu, ngày kết thúc.
3. Admin nhập thông tin và gửi form.
4. Hệ thống kiểm tra tên lớp không được để trống.
5. Hệ thống kiểm tra khóa học được chọn đang hoạt động.
6. Hệ thống kiểm tra sĩ số tối đa là số nguyên dương.
7. Hệ thống kiểm tra ngày bắt đầu nhỏ hơn ngày kết thúc.
8. Hệ thống tạo lớp học mới với trạng thái "Sắp khai giảng".
9. Hệ thống ghi nhận thao tác vào Audit Log.
10. Hệ thống thông báo "Tạo lớp học thành công".
11. Hệ thống hiển thị lại danh sách lớp học.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin cập nhật thông tin lớp học | Admin chọn lớp từ danh sách. Hệ thống hiển thị form với dữ liệu hiện tại. Admin sửa thông tin và gửi. Hệ thống kiểm tra dữ liệu hợp lệ, cập nhật, ghi Audit Log, thông báo thành công. |
| A2 | Admin hủy lớp học | Admin chọn lớp và chọn "Hủy lớp". Hệ thống hiển thị hộp thoại xác nhận. Admin xác nhận. Hệ thống chuyển trạng thái lớp thành "Đã hủy", ghi Audit Log, thông báo thành công. |
| A3 | Admin thêm học viên vào lớp | Admin chọn lớp và chọn "Thêm học viên". Hệ thống hiển thị danh sách học viên chưa trong lớp. Admin chọn học viên và xác nhận. Hệ thống kiểm tra sĩ số hiện tại chưa vượt quá sĩ số tối đa, thêm học viên vào lớp, thông báo thành công. |
| A4 | Admin xóa học viên khỏi lớp | Admin chọn lớp, chọn học viên và chọn "Xóa khỏi lớp". Hệ thống hiển thị hộp thoại xác nhận. Admin xác nhận. Hệ thống xóa học viên khỏi lớp, thông báo thành công. |
| A5 | Admin xem danh sách lớp học | Admin chọn "Quản lý lớp học". Hệ thống hiển thị danh sách lớp dạng bảng kèm phân trang: tên lớp, khóa học, giáo viên (nếu đã phân công), sĩ số, lịch học, trạng thái. |
| A6 | Admin tìm kiếm lớp học | Admin nhập từ khóa (tên lớp, tên khóa học). Hệ thống lọc danh sách và hiển thị kết quả. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Tên lớp để trống | Hệ thống thông báo "Tên lớp không được để trống". Quay lại bước 3. |
| E2 | Khóa học không tồn tại hoặc không hoạt động | Hệ thống thông báo "Khóa học không hợp lệ". Quay lại bước 3. |
| E3 | Sĩ số tối đa không hợp lệ (≤ 0) | Hệ thống thông báo "Sĩ số tối đa phải lớn hơn 0". Quay lại bước 3. |
| E4 | Ngày bắt đầu lớn hơn hoặc bằng ngày kết thúc | Hệ thống thông báo "Ngày bắt đầu phải trước ngày kết thúc". Quay lại bước 3. |
| E5 | Sĩ số lớp đã đầy (khi thêm học viên) | Hệ thống thông báo "Lớp đã đạt sĩ số tối đa". Kết thúc Use Case. |
| E6 | Học viên đã tồn tại trong lớp (khi thêm) | Hệ thống thông báo "Học viên đã có trong lớp". Kết thúc Use Case. |
| E7 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Mỗi lớp học phải thuộc về một khóa học đang hoạt động. |
| BR-02 | Tên lớp không được để trống và nên phản ánh khóa học + thời gian (VD: "Tiếng Anh Giao tiếp Sáng T2-T4"). |
| BR-03 | Sĩ số tối đa phải là số nguyên dương. |
| BR-04 | Ngày bắt đầu phải trước ngày kết thúc. |
| BR-05 | Lớp học không bị xóa cứng — chỉ chuyển trạng thái "Đã hủy" (soft delete). |
| BR-06 | Một học viên chỉ được thêm vào lớp nếu sĩ số hiện tại < sĩ số tối đa. |
| BR-07 | Một học viên không thể bị thêm trùng vào cùng một lớp. |
| BR-08 | Trạng thái lớp học gồm: Sắp khai giảng, Đang học, Đã kết thúc, Đã hủy. |
| BR-09 | Mọi thao tác tạo, cập nhật, hủy lớp học phải được ghi vào Audit Log. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Phân công giáo viên cho lớp là use case riêng (UC-15).
- Thêm học viên vào lớp chỉ thực hiện được nếu học viên đã có tài khoản trong hệ thống.
- Sau khi lớp đạt trạng thái "Đã kết thúc", không thể thay đổi thông tin lớp hoặc thêm/xóa học viên.
