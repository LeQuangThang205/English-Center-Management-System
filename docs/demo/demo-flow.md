# Demo Flow — Kịch bản trình bày (~10 phút)

> Chuẩn bị: backend + MySQL đã seed, frontend đang chạy.
> Đăng nhập: `admin@example.com` / `teacher1@example.com` / `student4@example.com` (mật khẩu `password123`).
> Dùng `student4` vì em này chưa đăng ký Beginner Class A (tránh trùng đơn PENDING mẫu của `student1/2`).

## 1. STUDENT — đăng ký (2 phút)

1. Login `student4@example.com` → Dashboard học viên (số liệu: khóa học, buổi học tuần, đơn chờ duyệt).
2. Mở **Đăng ký** → thấy 1 đơn PAID (Intermediate Class A).
3. Tạo đăng ký mới vào **Beginner Class A** (UPCOMING) → đơn PENDING.
4. Mở **Lịch học**: lịch lớp Beginner Class B (WED, Room 102).

## 2. ADMIN — duyệt + giao dịch (3 phút)

1. Login `admin@example.com` → Dashboard (stat + Đăng ký chờ duyệt + Thanh toán chờ xác nhận).
2. Mở **Đăng ký** → duyệt (Approve) đơn PENDING của student4 → APPROVED (+1 headcount).
3. STUDENT tạo giao dịch cho đơn APPROVED → **báo đã trả** (PENDING_CONFIRMATION).
4. ADMIN mở **Thanh toán** → **Confirm** → SUCCESS, đăng ký chuyển PAID.
5. STUDENT tải lại **Đăng ký** → thấy PAID.

## 3. TEACHER — điểm danh + điểm (3 phút)

1. Login `teacher1@example.com` → **Lớp của tôi** (Intermediate Class A, STUDYING).
2. **Điểm danh**: mở sheet lớp → tạo/sửa phiếu ngày hôm nay → lưu → mở lại, giá trị mới đã persist.
3. **Bảng điểm**: sửa điểm/comment 1 học viên → tải lại, giá trị mới đã persist.

## 4. STUDENT — kết quả (1 phút)

1. Login lại student → **Bảng điểm**: điểm các lớp đã duyệt/thanh toán.
2. **Thông báo**: danh sách + chi tiết + đánh dấu đã đọc.

## 5. AI Chat UI — mục demo riêng (1 phút)

1. Mở **AI Assistant** ở bất kỳ role nào: trang + lịch sử hội thoại + ô nhập hiển thị đầy đủ.
2. Nhấn gửi khi **chưa có `AI_API_KEY`**: hệ thống trả lỗi thân thiện
   ("AI đang bận, vui lòng thử lại sau"), không crash, không lộ key.
3. **Nói rõ khi demo:** live LLM cần `AI_API_KEY` (backend-only); backend AI + UI + test tự động đã hoàn thành.
