# Use Case Specification

## UC-30: Trò chuyện với AI

| Mục | Nội dung |
|------|---------|
| **Use Case ID** | UC-30 |
| **Tên Use Case** | Trò chuyện với AI |
| **Mục tiêu** | Cho phép Guest và Student đặt câu hỏi và nhận phản hồi từ AI Chatbot về các vấn đề liên quan đến trung tâm, khóa học, lịch học. |
| **Actor** | Guest, Student |
| **Secondary Actor** | AI Service (TBD) |
| **Mô tả** | Người dùng mở giao diện chat, nhập câu hỏi. Hệ thống gửi câu hỏi đến AI Service, nhận phản hồi và hiển thị cho người dùng. Lịch sử hội thoại được lưu lại để người dùng xem lại. |
| **Tiền điều kiện** | Guest: không cần đăng nhập. Student: đã đăng nhập với JWT token hợp lệ. |
| **Hậu điều kiện** | Câu trả lời từ AI được hiển thị. Hội thoại được lưu vào lịch sử chat. |
| **Trigger** | Người dùng mở giao diện AI Chatbot và nhập tin nhắn. |

### Main Flow

1. Người dùng mở giao diện AI Chatbot.
2. Hệ thống hiển thị khung chat, bao gồm lịch sử hội thoại gần nhất (nếu có).
3. Người dùng nhập câu hỏi vào ô chat và gửi.
4. Hệ thống kiểm tra nội dung câu hỏi không được để trống.
5. Hệ thống gửi câu hỏi đến AI Service kèm ngữ cảnh hội thoại (nếu có).
6. AI Service xử lý và trả về phản hồi.
7. Hệ thống lưu câu hỏi và phản hồi vào lịch sử chat.
8. Hệ thống hiển thị phản hồi của AI trong khung chat.
9. Người dùng đọc phản hồi và có thể tiếp tục đặt câu hỏi (quay lại bước 3).

### Alternative Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| A1 | Guest muốn đặt câu hỏi yêu cầu thông tin cá nhân | Hệ thống thông báo "Vui lòng đăng nhập để được hỗ trợ chi tiết hơn". Gợi ý Guest đăng nhập hoặc đăng ký. Guest tiếp tục hỏi các câu hỏi khác (không yêu cầu thông tin cá nhân). |
| A2 | Người dùng xem lịch sử chat | Người dùng chọn "Lịch sử chat". Hệ thống hiển thị danh sách các hội thoại trước đó. Người dùng chọn một hội thoại để xem lại. |
| A3 | Người dùng xóa hội thoại | Người dùng chọn một hội thoại và chọn "Xóa". Hệ thống hiển thị hộp thoại xác nhận. Người dùng xác nhận. Hệ thống xóa hội thoại. |
| A4 | AI không thể trả lời | AI Service trả về phản hồi "Tôi không thể trả lời câu hỏi này. Vui lòng liên hệ Admin để được hỗ trợ thêm." Hệ thống hiển thị phản hồi và gợi ý các câu hỏi thường gặp. |

### Exception Flow

| ID | Điều kiện | Hành động |
|----|-----------|-----------|
| E1 | Câu hỏi để trống | Hệ thống thông báo "Vui lòng nhập câu hỏi". Quay lại bước 3. |
| E2 | AI Service không phản hồi hoặc timeout | Hệ thống thông báo "AI đang bận, vui lòng thử lại sau". Ghi log lỗi. Kết thúc Use Case. |
| E3 | AI Service trả về lỗi | Hệ thống thông báo "Có lỗi xảy ra, vui lòng thử lại". Ghi log lỗi. Kết thúc Use Case. |
| E4 | Lỗi kết nối cơ sở dữ liệu (khi lưu lịch sử) | Hệ thống thông báo "Không thể lưu lịch sử chat". Vẫn hiển thị phản hồi AI cho người dùng. Ghi log lỗi. |

### Business Rules

| ID | Quy tắc |
|----|---------|
| BR-01 | Guest có thể chat mà không cần đăng nhập, nhưng bị giới hạn tính năng (không lưu lịch sử, không hỏi thông tin cá nhân). |
| BR-02 | Student đã đăng nhập có lịch sử chat được lưu vĩnh viễn. |
| BR-03 | Câu hỏi gửi đến AI Service phải kèm context: user role, các câu hỏi trước trong cùng hội thoại. |
| BR-04 | Lịch sử chat được sắp xếp theo thời gian mới nhất. |
| BR-05 | Mỗi hội thoại có thể chứa nhiều lượt hỏi-đáp. |
| BR-06 | AI Service được gọi bất đồng bộ — hiển thị trạng thái "đang nhập..." trong khi chờ phản hồi. |

### Include

Không.

### Extend

Không.

### Ghi chú

- AI Service là secondary actor, sẽ được xác định sau (có thể là OpenAI, Gemini, hoặc service nội bộ).
- Guest không cần đăng nhập để sử dụng tính năng này, phù hợp với mục đích tiếp cận khách hàng tiềm năng.
- Có thể mở rộng sau: chat voice, gửi file ảnh, gợi ý câu hỏi thông minh.
