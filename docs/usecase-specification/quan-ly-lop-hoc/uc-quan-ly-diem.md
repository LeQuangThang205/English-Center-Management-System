# Use Case Specification

## UC-17: Quản lý điểm

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-17 |
| **Tên Use Case** | Quản lý điểm |
| **Mục tiêu** | Cho phép Teacher nhập điểm và nhận xét cho học viên trong lớp phụ trách. |
| **Actor** | Teacher |
| **Secondary Actor** | Không |
| **Mô tả** | Teacher chọn lớp học, chọn học viên và nhập điểm (giữa kỳ, cuối kỳ, tổng kết) cùng nhận xét. Teacher có thể sửa điểm đã nhập. |
| **Tiền điều kiện** | Teacher đã đăng nhập với JWT token hợp lệ. Teacher được phân công phụ trách lớp học (UC-15). Lớp học đang ở trạng thái "Đang học" hoặc "Đã kết thúc". |
| **Hậu điều kiện** | Điểm và nhận xét của học viên được lưu thành công. |
| **Trigger** | Teacher chọn lớp học và chọn "Quản lý điểm". |

### Main Flow

1. Teacher chọn lớp học từ danh sách lớp được phân công.
2. Hệ thống hiển thị bảng điểm của lớp: danh sách học viên kèm các cột điểm (giữa kỳ, cuối kỳ, tổng kết) và nhận xét.
3. Teacher chọn một học viên để nhập điểm.
4. Hệ thống hiển thị form nhập điểm: điểm giữa kỳ, điểm cuối kỳ, điểm tổng kết, nhận xét.
5. Teacher nhập điểm và nhận xét.
6. Hệ thống kiểm tra điểm trong thang điểm hợp lệ.
7. Hệ thống lưu điểm và nhận xét.
8. Hệ thống ghi nhận thao tác vào Audit Log.
9. Hệ thống thông báo "Nhập điểm thành công".
10. Hệ thống cập nhật bảng điểm và hiển thị lại.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Teacher sửa điểm đã nhập | Teacher chọn học viên đã có điểm. Hệ thống hiển thị dữ liệu hiện tại. Teacher sửa và gửi. Hệ thống cập nhật, ghi Audit Log, thông báo thành công. |
| A2 | Teacher nhập điểm hàng loạt | Teacher nhập điểm cho nhiều học viên trên cùng một bảng điểm (không cần mở từng form riêng). Hệ thống kiểm tra và lưu tất cả. |
| A3 | Teacher nhập nhận xét không kèm điểm | Teacher chỉ nhập nhận xét cho học viên, không nhập điểm. Hệ thống lưu nhận xét. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Điểm không nằm trong thang điểm (0-10) | Hệ thống thông báo "Điểm phải từ 0 đến 10". Quay lại bước 5. |
| E2 | Teacher không được phân công lớp này | Hệ thống thông báo "Bạn không được phân công dạy lớp này". Kết thúc Use Case. |
| E3 | Lớp chưa bắt đầu (trạng thái "Sắp khai giảng") | Hệ thống thông báo "Lớp học chưa bắt đầu". Kết thúc Use Case. |
| E4 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Teacher được phân công lớp mới có quyền nhập điểm. |
| BR-02 | Thang điểm là 0-10 (số thực, cho phép 1 chữ số thập phân). |
| BR-03 | Điểm tổng kết có thể được tính tự động dựa trên điểm giữa kỳ và cuối kỳ (tùy cấu hình). |
| BR-04 | Nhận xét là trường văn bản không bắt buộc. |
| BR-05 | Mọi thao tác nhập và sửa điểm phải được ghi vào Audit Log. |
| BR-06 | Teacher có thể nhập và sửa điểm khi lớp đang học hoặc đã kết thúc. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Điểm của học viên được dùng để tính kết quả học tập và hiển thị qua UC-19 (Xem điểm số).
- Công thức tính điểm tổng kết có thể được cấu hình sau (VD: giữa kỳ 40% + cuối kỳ 60%).
