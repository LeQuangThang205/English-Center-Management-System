# Use Case Specification

## UC-33: Quản lý kho FAQ

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-33 |
| **Tên Use Case** | Quản lý kho FAQ |
| **Mục tiêu** | Cho phép Admin quản lý cơ sở tri thức FAQ bao gồm tạo, xem, cập nhật, xóa câu hỏi thường gặp và câu hỏi mẫu cho AI Chatbot và Trợ lý AI. |
| **Actor** | Admin |
| **Secondary Actor** | Không |
| **Mô tả** | Admin quản lý các câu hỏi thường gặp (FAQ) và câu hỏi mẫu dùng cho AI Chatbot (UC-30) và Trợ lý AI (UC-32). FAQ được sử dụng làm nguồn kiến thức cho AI Service và hiển thị trực tiếp cho người dùng. |
| **Tiền điều kiện** | Admin đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | FAQ được tạo, cập nhật hoặc xóa thành công. Dữ liệu FAQ được đồng bộ với AI Service (nếu cần). |
| **Trigger** | Admin chọn "Quản lý FAQ" trên menu quản trị. |

### Main Flow

1. Admin chọn "Quản lý FAQ" trên menu quản trị.
2. Hệ thống hiển thị danh sách FAQ dạng bảng kèm phân trang, bao gồm: câu hỏi, danh mục, trạng thái (hiển thị/ẩn), ngày tạo.
3. Admin chọn "Thêm FAQ".
4. Hệ thống hiển thị form tạo FAQ bao gồm: câu hỏi, câu trả lời, danh mục, từ khóa (tags), trạng thái hiển thị.
5. Admin nhập thông tin và gửi form.
6. Hệ thống kiểm tra câu hỏi và câu trả lời không được để trống.
7. Hệ thống kiểm tra câu hỏi chưa tồn tại trong kho FAQ.
8. Hệ thống tạo bản ghi FAQ mới.
9. Hệ thống ghi nhận thao tác vào Audit Log.
10. Hệ thống thông báo "Thêm FAQ thành công".
11. Hệ thống hiển thị lại danh sách FAQ.

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Admin cập nhật FAQ | Admin chọn FAQ từ danh sách. Hệ thống hiển thị form với dữ liệu hiện tại. Admin sửa thông tin và gửi. Hệ thống kiểm tra dữ liệu hợp lệ, cập nhật, ghi Audit Log, thông báo thành công. |
| A2 | Admin xóa FAQ | Admin chọn FAQ và chọn "Xóa". Hệ thống hiển thị hộp thoại xác nhận. Admin xác nhận. Hệ thống xóa FAQ, ghi Audit Log, thông báo thành công. |
| A3 | Admin tìm kiếm FAQ | Admin nhập từ khóa vào ô tìm kiếm. Hệ thống lọc theo câu hỏi, câu trả lời hoặc từ khóa. Hiển thị kết quả. |
| A4 | Admin lọc theo danh mục | Admin chọn danh mục (VD: Khóa học, Học phí, Lịch học, Kỹ thuật). Hệ thống lọc và hiển thị kết quả. |
| A5 | Admin ẩn/hiện FAQ | Admin chọn FAQ và chuyển đổi trạng thái "Hiển thị"/"Ẩn". FAQ ẩn không xuất hiện trên AI Chatbot và trang FAQ công khai. |
| A6 | Admin xuất danh sách FAQ | Admin chọn "Xuất". Hệ thống xuất file CSV/Excel danh sách FAQ. |
| A7 | Admin import FAQ từ file | Admin chọn "Import" và tải lên file CSV/Excel. Hệ thống đọc file, kiểm tra dữ liệu và thêm hàng loạt FAQ mới. Hiển thị kết quả import (thành công/thất bại). |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Câu hỏi để trống | Hệ thống thông báo "Câu hỏi không được để trống". Quay lại bước 5. |
| E2 | Câu trả lời để trống | Hệ thống thông báo "Câu trả lời không được để trống". Quay lại bước 5. |
| E3 | Câu hỏi đã tồn tại | Hệ thống thông báo "Câu hỏi này đã có trong kho FAQ". Quay lại bước 5. |
| E4 | File import không đúng định dạng | Hệ thống thông báo "Định dạng file không hợp lệ". Yêu cầu Admin chọn file khác. |
| E5 | Lỗi kết nối cơ sở dữ liệu | Hệ thống thông báo "Lỗi hệ thống, vui lòng thử lại". Kết thúc Use Case. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Chỉ Admin mới có quyền quản lý kho FAQ. |
| BR-02 | Câu hỏi và câu trả lời là bắt buộc. |
| BR-03 | Mỗi FAQ thuộc một danh mục (Category) — danh mục do Admin tự định nghĩa. |
| BR-04 | FAQ có trạng thái "Hiển thị" sẽ xuất hiện trên AI Chatbot (UC-30) và Trợ lý AI (UC-32). |
| BR-05 | FAQ có trạng thái "Ẩn" chỉ Admin mới thấy trong danh sách quản lý. |
| BR-06 | Mọi thao tác tạo, cập nhật, xóa FAQ phải được ghi vào Audit Log. |
| BR-07 | Dữ liệu FAQ được sử dụng làm context cho AI Service khi xử lý câu hỏi. |

### Include

Không.

### Extend

Không.

### Ghi chú

- Kho FAQ vừa là cơ sở tri thức cho AI Chatbot, vừa là trang FAQ công khai cho người dùng.
- Khi AI Chatbot nhận được câu hỏi, nó có thể tra cứu FAQ trước khi gọi AI Service để có câu trả lời nhanh và chính xác hơn.
- Có thể mở rộng sau: phân quyền cho Teacher đóng góp FAQ (cần Admin duyệt), đa ngôn ngữ.
