# English Center Management System — Software Requirements Specification

## 1. Giới thiệu dự án

### 1.1. Tổng quan

English Center Management System (ECMS) là hệ thống quản lý trung tâm ngoại ngữ được xây dựng trong khuôn khổ đồ án tốt nghiệp. Hệ thống nhằm số hóa các quy trình vận hành chính của một trung tâm ngoại ngữ: quản lý học viên, giáo viên, khóa học, lớp học, đăng ký, thanh toán và thông báo.

Hệ thống tích hợp AI với vai trò là tính năng hỗ trợ — bao gồm chatbot tư vấn, gợi ý khóa học và trợ lý phân tích dữ liệu cho Admin.

### 1.2. Công nghệ

- **Backend:** Java Spring Boot (Monolithic)
- **Frontend:** React
- **Cơ sở dữ liệu:** MySQL
- **Kiến trúc:** Monolithic — toàn bộ ứng dụng được đóng gói và triển khai như một khối duy nhất.

### 1.3. Nền tảng

Hệ thống là Web Application. Không phát triển Mobile App.

---

## 2. Mục tiêu

### 2.1. Mục tiêu đồ án

- Xây dựng một hệ thống quản lý trung tâm ngoại ngữ hoàn chỉnh, có đầy đủ các chức năng nghiệp vụ cốt lõi.
- Áp dụng AI để nâng cao trải nghiệm người dùng: chatbot hỗ trợ, gợi ý khóa học, trợ lý phân tích dữ liệu.
- Tích hợp thanh toán trực tuyến cho phép học viên đóng học phí qua cổng thanh toán bên thứ ba.
- Minh họa khả năng phát triển full-stack với Spring Boot + React + MySQL theo kiến trúc Monolithic.

### 2.2. Mục tiêu hệ thống

- Cung cấp giao diện web cho 3 nhóm người dùng: Admin, Teacher, Student.
- Đảm bảo phân quyền truy cập rõ ràng giữa các vai trò.
- Tích hợp ít nhất một cổng thanh toán trực tuyến.
- Hỗ trợ gửi thông báo qua email hoặc in-app.
- Cung cấp dashboard trực quan và báo cáo thống kê.

### 2.3. Phi mục tiêu

- Hệ thống không phải nền tảng dạy học trực tuyến (livestream, video bài giảng).
- Hệ thống không bao gồm Mobile App.
- Hệ thống không xử lý quản lý nhân sự, CRM hay ERP.
- AI không thay thế giáo viên, không chấm bài tự luận, không đánh giá đầu vào hay xếp lớp tự động.

---

## 3. Đối tượng sử dụng

Hệ thống có 3 vai trò chính:

### 3.1. Admin

- Quản lý tài khoản và phân quyền cho Teacher và Student.
- Quản lý danh mục khóa học, lớp học.
- Quản lý thông tin học viên và giáo viên.
- Theo dõi và đối soát giao dịch thanh toán.
- Xem báo cáo và dashboard tổng quan.
- Sử dụng AI Dashboard Assistant để phân tích dữ liệu.

### 3.2. Teacher

- Xem danh sách lớp được phân công.
- Xem thông tin học viên trong lớp.
- Điểm danh học viên.
- Nhập điểm và nhận xét học viên.
- Xem lịch dạy.

### 3.3. Student

- Đăng ký tài khoản và tra cứu thông tin cá nhân.
- Tra cứu danh sách khóa học và lịch khai giảng.
- Đăng ký khóa học trực tuyến.
- Thanh toán học phí qua cổng thanh toán trực tuyến.
- Xem lịch học, điểm số, kết quả học tập.
- Sử dụng AI Chatbot để đặt câu hỏi về khóa học, học phí, lịch học, chính sách.

---

## 4. Phạm vi dự án

### 4.1. Trong phạm vi

| STT | Module | Mô tả |
|-----|--------|-------|
| 1 | Authentication & Authorization | Đăng ký, đăng nhập, quên mật khẩu; phân quyền theo 3 role (Admin, Teacher, Student). |
| 2 | Quản lý học viên | CRUD hồ sơ học viên, xem lịch sử đăng ký và kết quả học tập. |
| 3 | Quản lý giáo viên | CRUD hồ sơ giáo viên, phân công giảng dạy, xem lịch dạy. |
| 4 | Quản lý khóa học | Tạo, sửa, xóa khóa học; thiết lập học phí, cấp độ, mô tả khóa học. |
| 5 | Quản lý lớp học | Tạo lớp học theo khóa, xếp giáo viên, quản lý sĩ số, lịch học. |
| 6 | Đăng ký khóa học | Học viên đăng ký khóa học trực tuyến → Admin duyệt → Học viên thanh toán → Tham gia lớp học. |
| 7 | Điểm danh (Attendance) | Teacher điểm danh học viên theo buổi học; thống kê tỷ lệ chuyên cần. |
| 8 | Quản lý điểm (Score Management) | Teacher nhập điểm, nhận xét; Student xem kết quả học tập; quản lý bảng điểm. |
| 9 | Thanh toán | Học viên thanh toán học phí trực tuyến; Admin theo dõi lịch sử giao dịch; tích hợp ít nhất một cổng thanh toán trực tuyến. |
| 10 | Thông báo | Gửi thông báo qua email và/hoặc in-app về lịch học, học phí, kết quả học tập. |
| 11 | Báo cáo & Dashboard | Thống kê doanh thu, số lượng học viên, tỷ lệ duy trì, khóa học phổ biến; dashboard cho Admin. |
| 12 | AI Chatbot | Chatbot trả lời câu hỏi về khóa học, học phí, lịch học, chính sách và FAQ dựa trên dữ liệu từ FAQ Knowledge Base. |
| 13 | FAQ Knowledge Base | Cơ sở dữ liệu các câu hỏi và câu trả lời mẫu, là nguồn dữ liệu cho AI Chatbot. |
| 14 | AI Chat History | Lưu trữ lịch sử hội thoại giữa người dùng và AI Chatbot để tra cứu và phân tích. |
| 15 | AI Dashboard Assistant | Trợ lý AI hỗ trợ Admin phân tích dữ liệu (doanh thu, số lượng học viên, khóa học phổ biến) thông qua giao diện hội thoại — không thay thế Dashboard thống kê. |
| 16 | Audit Log | Ghi nhận và lưu trữ các thao tác quan trọng của Admin và Teacher (tạo/sửa/xóa dữ liệu, phân quyền, v.v.) phục vụ kiểm tra và truy vết. |

### 4.2. Ngoài phạm vi

- Livestream / dạy học trực tuyến
- Video bài giảng / nội dung học tập số
- Mobile App
- Quản lý nhân sự (tuyển dụng, hợp đồng, lương)
- CRM, ERP
- Machine Learning Training (huấn luyện mô hình)
- Chấm bài tự luận, xếp lớp tự động, đánh giá đầu vào bằng AI

---

## 5. Yêu cầu phi chức năng

### 5.1. Bảo mật

- Mật khẩu được mã hóa (bcrypt hoặc tương đương).
- Phân quyền truy cập theo role (RBAC) — Admin, Teacher, Student chỉ truy cập được tài nguyên được phép.
- Bảo vệ API endpoints bằng xác thực token (JWT).
- Audit Log ghi lại mọi thao tác quan trọng của Admin và Teacher.

### 5.2. Hiệu năng

- Thời gian phản hồi API trung bình dưới 2 giây cho các tác vụ thông thường.
- Hỗ trợ ít nhất 50 người dùng đồng thời.
- Chatbot AI phản hồi trong vòng 5 giây.

### 5.3. Khả năng mở rộng

- Kiến trúc Monolithic cho phép dễ dàng nâng cấp lên Microservices trong tương lai nếu cần.
- Mã nguồn có cấu trúc rõ ràng, dễ bảo trì và thêm tính năng mới.

### 5.4. Sao lưu dữ liệu

- Cơ sở dữ liệu được sao lưu định kỳ (tối thiểu 1 lần/ngày).
- Hỗ trợ khôi phục dữ liệu từ bản sao lưu gần nhất.
