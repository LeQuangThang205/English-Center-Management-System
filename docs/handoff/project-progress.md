# Project Progress — Intern Scope

> Checkpoint TẠM DỪNG dự án. Đọc file này trước khi tiếp tục.
> Cập nhật cuối: Step 16.4 — Notification Controller/API (Notification module hoàn thành).

## Current checkpoint

- Đã hoàn thành đến **Step 16.4** (Notification module hoàn chỉnh: Entity → Repository → Service → Controller → Test).
- **Step 14: Score API** (`scores` table, UC-17/UC-19).
- **Step 15: Schedule API / UC-18** (read-only trên bảng `classes`).
- **Step 16: Notification module** (UC-34 Gửi thông báo, UC-37/UC-38 Xem thông báo).
- Đây là checkpoint **TẠM DỪNG dự án** — không triển khai thêm AI Chat, Seed Data, Frontend hay bất kỳ feature mới nào cho đến khi người dùng xác nhận tiếp tục.

## Repository context

- Backend: Spring Boot 3.2.5, Java 17, Gradle 8.7, MySQL 8.0 (`ddl-auto: validate`), JWT (không refresh token).
- Frontend (`frontend/`) trống — chưa triển khai.
- Script chạy test: `.\gradlew.bat clean test --console=plain` (trong `backend/`).

## Git status hiện tại (xác nhận từ repository)

- **HEAD:** `9795291 feat: add notification controller and API (Step 16.4)`
- Working tree **clean** (không có thay đổi chưa commit).
- Branch: `main`.

### Commit log Notification (mới nhất → cũ)

```
9795291 feat: add notification controller and API (Step 16.4)
4904139 feat: implement notification delete (Step 16.3.8)
dc3d02b feat: implement mark all notifications as read (Step 16.3.7)
4a0567c feat: implement notification unread count (Step 16.3.6)
e87470d feat: implement notification detail and auto-read (Step 16.3.5)
0dc29e4 feat: implement notification list and unread queries (Step 16.3.4)
f4d1ba7 feat: implement notification creation and recipient resolution (Step 16.3.3)
5c6b313 feat: add notification service contract (Step 16.3.2)
12107fa feat: add notification repositories (Step 16.2)
1d8c804 feat: add notification entities and target type (Step 16.1)
92fa427 docs: add project progress handoff at Step 15
```

## Completed (theo thứ tự)

1. Analysis + Database Design (`8ba600f`)
2. Phase 2 Backend — JWT auth + 7 business APIs (Users, StudentProfiles, Courses, Classes, Registrations, Transactions, Attendance) (`eb308fd`)
3. Score API — Step 14 (`48d2401`)
4. Schedule API — Step 15 (`48d2401`)
5. Notification module — Step 16.1 → 16.4 (`1d8c804` → `9795291`)

## Current test status (xác nhận từ test-results)

- Tổng **308 tests**, **0 failures**, **0 errors**.
- Trước Step 16.4: 293 tests. Sau Step 16.4: 308 tests (+15 NotificationControllerTest).
- `NotificationServiceTest`: 28 tests.
- `NotificationControllerTest`: 15 tests.

## Notification module — architecture

Files (xác nhận tồn tại trong repo):

| Thành phần | Path |
|---|---|
| Entity | `entity/Notification.java`, `entity/NotificationRecipient.java` |
| Enum | `entity/enums/NotificationTargetType.java` |
| Repository | `repository/NotificationRepository.java`, `repository/NotificationRecipientRepository.java` |
| Service contract | `service/NotificationService.java` |
| Service impl | `service/impl/NotificationServiceImpl.java` |
| Request DTO | `dto/request/CreateNotificationRequest.java` |
| Response DTO | `dto/response/NotificationResponse.java`, `dto/response/NotificationRecipientResponse.java` |
| Controller | `controller/NotificationController.java` |
| Tests | `test/.../service/NotificationServiceTest.java`, `test/.../controller/NotificationControllerTest.java` |

### NotificationService contract — CHỈ 7 method (ĐÃ CHỐT)

```java
Notification create(CreateNotificationRequest request, User currentUser);
List<NotificationRecipient> findAll(User currentUser);
List<NotificationRecipient> findUnread(User currentUser);
NotificationRecipient findDetail(Long notificationId, User currentUser);
long countUnread(User currentUser);
int markAllAsRead(User currentUser);
void delete(Long notificationId, User currentUser);
```

**QUAN TRỌNG — KHÔNG ĐƯỢC THAY ĐỔI:**
- **KHÔNG có `findAllSent()`** trong service contract.
- **KHÔNG tạo `GET /api/notifications/sent`**.
- Đây là quyết định đã chốt (Step 16.3.1 loại bỏ `findAllSent`; Step 16.4 xác nhận bỏ `/sent` khỏi scope).
- **Không tự thêm lại** `findAllSent()` hoặc endpoint `/sent` nếu không có lệnh mới.

### NotificationTargetType

```java
enum NotificationTargetType { ALL_STUDENTS, ALL_TEACHERS, SPECIFIC_CLASS, SPECIFIC_USER }
```

### NotificationRecipientRepository methods

```java
List<NotificationRecipient> findByUser_IdOrderByNotification_CreatedAtDesc(Long userId);
List<NotificationRecipient> findByUser_IdAndIsReadFalse(Long userId);
long countByUser_IdAndIsReadFalse(Long userId);
Optional<NotificationRecipient> findByNotification_IdAndUser_Id(Long notificationId, Long userId);
List<NotificationRecipient> findByNotification_Id(Long notificationId);
void deleteByNotification_IdAndUser_Id(Long notificationId, Long userId);
```

### NotificationRepository methods

```java
List<Notification> findByCreatedBy_Id(Long adminId);
```

(Lưu ý: `findByCreatedBy_Id` hiện **chưa được service nào dùng** vì `findAllSent` đã bị loại bỏ.)

## Notification API endpoints (hiện tại)

Base path: `/api/notifications`

| Method | URL | Service method | Status |
|---|---|---|---|
| POST | `/api/notifications` | `create` | 201 (ADMIN only) |
| GET | `/api/notifications` | `findAll` | 200 |
| GET | `/api/notifications/unread` | `findUnread` | 200 |
| GET | `/api/notifications/unread/count` | `countUnread` | 200 |
| GET | `/api/notifications/{notificationId}` | `findDetail` (tự đánh dấu đọc) | 200 / 404 |
| PUT | `/api/notifications/read-all` | `markAllAsRead` | 200 |
| DELETE | `/api/notifications/{notificationId}` | `delete` | 204 / 404 |

Security:
- `POST` create: ADMIN enforced trong service (`requireAdmin`) → AccessDeniedException → 403.
- GET/PUT/DELETE: dùng `anyRequest().authenticated()`; dữ liệu tự giới hạn theo `currentUser` từ `@AuthenticationPrincipal`. KHÔNG cần thêm matcher vào SecurityConfig.
- `findDetail`/`delete` không thuộc quyền của user → 404 (ResourceNotFoundException), không leak existence.

## Notification business rules ĐÃ CHỐT

1. `ALL_STUDENTS` → chỉ user role `STUDENT` + status `ACTIVE`.
2. `ALL_TEACHERS` → chỉ user role `TEACHER` + status `ACTIVE`.
3. `ALL_STUDENTS`/`ALL_TEACHERS` có `targetId` → reject `BusinessException`.
4. `SPECIFIC_CLASS` → `targetId` bắt buộc (thiếu → `BusinessException`).
5. `SPECIFIC_CLASS` → lấy registration `APPROVED`/`PAID` của class + teacher của class.
6. `SPECIFIC_CLASS` → dedupe recipient theo user id.
7. `SPECIFIC_CLASS` không có recipient hợp lệ → `BusinessException`.
8. `SPECIFIC_USER` → `targetId` bắt buộc, không giới hạn role.
9. User không có quyền truy cập notification → KHÔNG leak existence, trả `ResourceNotFoundException`.
10. `findDetail` tự đánh dấu đã đọc (isRead + readAt).
11. `delete` chỉ xóa `NotificationRecipient` của current user, KHÔNG xóa `Notification` chính.
12. `attachmentUrl` là String nullable, không upload file.

## Testing

- `NotificationServiceTest` (28 tests) cover toàn bộ 7 service methods + business rules trên.
- `NotificationControllerTest` (15 tests): POST 201/403/400, GET list/unread/count/detail, read-all, delete 204/404, cross-user isolation 404.
- **Full suite: 308 tests, 0 failures, 0 errors.**

## Những quyết định KHÔNG được tự ý thay đổi

1. `findAllSent()` **không tồn tại**; endpoint `/api/notifications/sent` **không được tạo**.
2. Phân quyền nằm trong **service layer**, không thêm matcher SecurityConfig cho `/api/notifications/**`.
3. Response DTO dùng convention `fromEntity()`; envelope `ApiResponse<T>`.
4. Business rules 1–12 ở trên (resolveRecipients).
5. Giữ đúng "Intern scope" và "Explicitly OUT OF SCOPE" bên dưới.

## Intern scope

- Score Management ✅
- Schedule / UC-18 ✅
- Notification ✅ (hoàn thành Step 16.4)
- AI Chat + FAQ + Chat History ⏸ (chưa làm)
- Audit Log tối giản ⏸ (chưa làm)
- Seed Data ⏸ (chưa làm)
- Frontend ⏸ (trống)

## Explicitly OUT OF SCOPE

Không tự triển khai:

- Payment Gateway
- Refresh Token
- OAuth2
- JWT blacklist/Redis
- Microservices
- Docker/Kubernetes
- CI/CD phức tạp
- ML training
- Tự động xếp lớp
- Chấm tự luận bằng ML
- Analytics/Dashboard phức tạp
- Các feature không thuộc Intern scope

## Next steps (đề xuất, CHỜ người dùng xác nhận)

1. **Step 16.5 — Notification API integration/regression test** (kiểm chứng cross-resource, không có findAllSent).
2. **Seed Data** (tạo dữ liệu mẫu cho toàn hệ thống — chưa tồn tại).
3. **Frontend Notification UI** (frontend hiện trống).
4. **E2E/regression** toàn bộ.

Sau 3 module intern còn lại: **AI Chat + FAQ + Chat History**, **Audit Log tối giản** (bảng `chat_conversations`, `chat_messages`, `faqs`, `audit_logs` chưa có entity).

## Bảng DB chưa có entity/code

`notifications` ✅ / `notification_recipients` ✅ (đã có entity + code từ Step 16).
`chat_conversations`, `chat_messages`, `faqs`, `audit_logs`, `system_settings`, `teacher_profiles`, `token_blacklist`, `failed_login_attempts`, `password_reset_tokens` — chưa có entity.

## Resume instructions

1. **Đọc file handoff này trước.**
2. Kiểm tra `git status` và `git rev-parse --short HEAD`.
3. **Không tự ý mở rộng scope** — giữ đúng "Intern scope" và "Explicitly OUT OF SCOPE" ở trên.
4. Chỉ tiếp tục khi người dùng xác nhận.
5. Trước khi code phải **audit lại schema/SRS/use case liên quan** (`database/schema.sql`, `docs/usecase-specification/`, domain model).
6. Giữ nguyên pattern hiện có: `ApiResponse<T>` envelope, `GlobalExceptionHandler`, phân quyền trong service layer, response DTO `fromEntity()`, `@AuthenticationPrincipal User currentUser`, test đầy đủ (unit + MockMvc/H2).
