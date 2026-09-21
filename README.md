# English Center Management System

Hệ thống quản lý trung tâm tiếng Anh full-stack: quản lý học viên, giáo viên, khóa học, lớp học,
đăng ký học, thanh toán học phí (chuyển khoản thủ công, không payment gateway), điểm danh, điểm số,
lịch học, thông báo và trợ lý AI. Ba vai trò: **ADMIN / TEACHER / STUDENT**.

> Đồ án mức intern — code dễ đọc, vertical slice hoàn chỉnh, test bao phủ hành vi, demo được.

## Tính năng chính

| Vai trò | Chức năng                                                                                                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| STUDENT | Dashboard, khóa học của tôi, lịch học tuần, bảng điểm, đăng ký/hủy khóa học, tạo giao dịch, báo đã chuyển khoản, thông báo, AI Chat                                        |
| TEACHER | Dashboard, lớp của tôi, lịch dạy, điểm danh (tạo/sửa phiếu lớp STUDYING mình dạy), quản lý điểm, thông báo, AI Chat                                                        |
| ADMIN   | Dashboard + biểu đồ, quản lý học viên/giáo viên/khóa học/lớp học, duyệt-từ chối-hủy-mark-paid đăng ký, confirm/reject giao dịch, xem điểm danh/điểm số, thông báo, AI Chat |

## Luồng nghiệp vụ chính

```
STUDENT đăng ký (PENDING)
  → ADMIN duyệt (APPROVED, +1 headcount) / từ chối (REJECTED)
  → STUDENT tạo giao dịch + báo đã trả (PENDING_CONFIRMATION)
  → ADMIN xác nhận (SUCCESS, đăng ký → PAID)
  → TEACHER điểm danh + chấm điểm
  → STUDENT xem điểm/trạng thái
```

## Phạm vi AI Assistant

- Backend AI (`/api/ai/*`: chat, lịch sử hội thoại, xóa hội thoại) và Frontend AI Chat 3 role đã implemented.
- Test tự động cho AI đều pass (backend + frontend).
- **Cuộc gọi live tới LLM bên ngoài hiện CHƯA được kiểm chứng (deferred) vì chưa có `AI_API_KEY`.**
  Không dùng `VITE_AI_API_KEY` — key chỉ tồn tại ở backend.

## Công nghệ

| Layer    | Technology                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------- |
| Backend  | Spring Boot 3.2.5, Java 17, Gradle 8.7, Spring Data JPA, Spring Security (JWT, không refresh token) |
| Database | MySQL 8.0 (`ddl-auto: validate`)                                                                    |
| Frontend | React 18 + Vite 5 + TypeScript 5, react-router-dom 6, lucide-react                                  |
| Test BE  | JUnit 5 + MockMvc + H2 — **344/344 PASS**                                                           |
| Test FE  | Vitest + Testing Library + jsdom — **395/395 PASS**                                                 |

## Kiến trúc tổng quan

- Backend monolith REST `/api/*` + frontend SPA. Không microservices, không realtime.
- Phân quyền ở **service layer** (`AccessDeniedException`), không phụ thuộc URL matcher.
- Frontend gọi API có sẵn rồi tổng hợp ở client (client-side aggregation), envelope chung
  `ApiResponse<T> { success, data, message, timestamp }`.

## Cơ sở dữ liệu / ERD

- 20 bảng MySQL 8.0, đầy đủ quan hệ xem `docs/database-design/erd.md` (kèm `erd.puml`).
- Đã bao gồm `chat_conversations` + `chat_messages` (AI Chat) — xem migration
  `database/migration/001_ai_chat.sql`.
- Schema khởi tạo: `database/schema.sql`. **App không tự tạo bảng** (`validate`).

## Cấu trúc project

```
backend/    — Spring Boot (controller/service/entity/dto/repository/security/config/seed)
frontend/   — React + Vite (pages/features/services-api/types/routes/layouts)
database/   — schema.sql, migration/, docs/
docs/       — architecture, api, database-design, usecase, demo/, project/, handoff/
scripts/    — automation (non-application)
```

## Yêu cầu môi trường

- Java 17, Gradle wrapper có sẵn (`backend/gradlew.bat`)
- Node.js 20+ (frontend)
- MySQL 8.0 + database `english_center_db` (tạo thủ công, collation `utf8mb4`)

## Thiết lập MySQL

```sql
CREATE DATABASE english_center_db CHARACTER SET utf8mb4;
-- chạy database/schema.sql, sau đó database/migration/001_ai_chat.sql
```

Kết nối backend cấu hình trong `backend/src/main/resources/application.yml`
(url/username/password — không commit secret thật, dùng biến môi trường khi deploy).

## Chạy backend

```bash
cd backend
.\gradlew.bat bootRun        # http://localhost:8080, cần DB + schema đã tạo
```

Seed dữ liệu demo (lần đầu, idempotent):

```bash
.\gradlew.bat bootRun --args="--spring.profiles.active=seed"
```

## Chạy frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173, proxy /api → http://localhost:8080
```

Biến môi trường frontend xem `frontend/.env.example` (`VITE_API_BASE_URL=/api`).

## Cấu hình AI_API_KEY

Key **chỉ ở backend** (prefix `app.ai` trong `application.yml`):

| Biến          | Mặc định                    | Mô tả                                                                     |
| ------------- | --------------------------- | ------------------------------------------------------------------------- |
| `AI_API_KEY`  | _(rỗng)_                    | Key provider OpenAI-compatible. Rỗng = AI trả lỗi thân thiện, không crash |
| `AI_BASE_URL` | `https://api.openai.com/v1` | Base URL provider                                                         |
| `AI_MODEL`    | `gpt-4o-mini`               | Tên model                                                                 |

```bash
# Windows PowerShell — chỉ dùng khi đã có key thật, không commit key
$env:AI_API_KEY="<key>"
cd backend; .\gradlew.bat bootRun
```

## Tài khoản demo (sau khi seed)

Mật khẩu chung: `password123`

| Role    | Email                                           |
| ------- | ----------------------------------------------- |
| ADMIN   | `admin@example.com`                             |
| TEACHER | `teacher1@example.com`, `teacher2@example.com`  |
| STUDENT | `student1@example.com` … `student5@example.com` |

Seed gồm: 3 khóa học, 6 lớp (UPCOMING/STUDYING/FINISHED/CANCELLED), đăng ký PENDING mẫu
(`student1`, `student2` → Beginner Class A) để demo duyệt, điểm danh/điểm mẫu, 6 thông báo.

## Kiểm thử

```bash
cd backend
.\gradlew.bat test --console=plain        # 344/344 (JUnit + MockMvc + H2)

cd ../frontend
npm run test -- --run                     # 395/395 (Vitest)
npm run lint
npm run build
```

## Demo flow

Kịch bản demo ~10 phút: xem `docs/demo/demo-flow.md`.
Checklist ảnh showcase: xem `docs/demo/screenshots.md`.

## Hạn chế đã biết (không phải regression)

- `POST /api/users` lưu raw password (thiếu BCrypt) → UI tạo học viên/giáo viên đã descoped có chủ ý.
- Live LLM chưa kiểm chứng (cần `AI_API_KEY`); UI + backend AI + test tự động đã xong.
- Audit Log / Settings trên nav là `comingSoon` (chưa backend).
- Một số list endpoint chỉ áp dụng 1 filter (XOR): xem `docs/project/PROJECT_CONTEXT.md` §10.
- Không payment gateway, không realtime, không refresh token.

## Tài liệu thêm

- `docs/project/PROJECT_CONTEXT.md` — context kỹ thuật chi tiết
- `docs/project/ROADMAP.md` — roadmap và checkpoint
- `docs/database-design/` — domain model, ERD, DDL review
- `docs/usecase-specification/` — đặc tả use case (UC-01→UC-38)
- `DEVELOPMENT.md`, `CONTRIBUTING.md`, `CODE_STYLE.md`

## License

Nội bộ / đồ án học thuật.
