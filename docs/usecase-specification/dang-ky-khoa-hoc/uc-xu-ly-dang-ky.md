# Use Case Specification

## UC-22: Xử lý đăng ký

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-22 |
| **Tên Use Case** | Xử lý đăng ký |
| **Mục tiêu** | Cho phép Admin xem danh sách đăng ký chờ xử lý và thực hiện duyệt hoặc từ chối. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin truy cập danh sách các yêu cầu đăng ký đang chờ xử lý, chọn một đăng ký để xem chi tiết, sau đó quyết định duyệt (UC-23) hoặc từ chối (UC-24). |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. Có ít nhất một đăng ký ở trạng thái "Chờ duyệt". |
| **Hậu điều kiện** | Đăng ký được duyệt hoặc từ chối thành công (tùy theo quyết định của Admin). |
| **Trigger** | Admin chọn chức năng "Xử lý đăng ký" trên menu quản trị. |

### Main Flow

1. Admin chọn "Xử lý đăng ký".
2. Hệ thống hiển thị danh sách các yêu cầu đăng ký có trạng thái "Chờ duyệt", bao gồm: tên học viên, tên khóa học, tên lớp, ngày đăng ký.
3. Admin chọn một đăng ký từ danh sách.
4. Hệ thống hiển thị chi tiết đăng ký (UC-21).
5. Admin quyết định hành động:
   - Chọn "Duyệt" → chuyển sang UC-23 (Duyệt đăng ký).
   - Chọn "Từ chối" → chuyển sang UC-24 (Từ chối đăng ký).

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin tìm kiếm đăng ký | Admin nhập từ khóa (tên học viên, tên lớp). Hệ thống lọc danh sách và hiển thị kết quả. |
| A2 | Admin lọc theo trạng thái | Admin chọn bộ lọc trạng thái (Chờ duyệt, Đã duyệt, Từ chối). Hệ thống hiển thị danh sách tương ứng. |
| A3 | Không có đăng ký nào chờ xử lý | Hệ thống thông báo "Không có yêu cầu đăng ký nào cần xử lý". Kết thúc Use Case. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Token không hợp lệ hoặc hết hạn | Hệ thống yêu cầu đăng nhập lại. Kết thúc Use Case. |
| E2 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền xử lý đăng ký. |
| BR-02 | Admin chỉ xử lý được các đăng ký ở trạng thái "Chờ duyệt". |
| BR-03 | Mỗi đăng ký chỉ được xử lý một lần (duyệt hoặc từ chối). |

### Include

Không.

### Extend

Use Case này là use case tổng quát (generalization). Các use case cụ thể bao gồm:
- UC-23 (Duyệt đăng ký) — kế thừa từ UC-22.
- UC-24 (Từ chối đăng ký) — kế thừa từ UC-22.

### Ghi chú

- Đây là use case tổng quát theo mô hình generalization trên Use Case Diagram. Trong thực tế, Admin luôn thực hiện một trong hai hành động cụ thể: duyệt hoặc từ chối.
- Danh sách chờ xử lý mặc định chỉ hiển thị các đăng ký "Chờ duyệt". Admin có thể xem lịch sử qua bộ lọc.
