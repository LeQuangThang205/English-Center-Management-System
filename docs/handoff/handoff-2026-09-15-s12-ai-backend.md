# Handoff — S12 AI Backend

Date (UTC): 2026-09-15
Workspace: `D:\English Center Management System`
Status: S12 IN PROGRESS / PAUSED — chưa VERIFIED. Không commit/push/reset/revert.

## 1. Current checkpoint

- S01–S11 DONE, 17.7 VERIFIED, CORE BUSINESS COMPLETE (trước khi bắt đầu AI).
- **S12 Backend AI đang triển khai, CHƯA được xác nhận complete** (thiếu BUILD SUCCESSFUL sạch cho nhóm test AI do Gradle client block ở shutdown — xem §10).
- **S13 Frontend AI CHƯA bắt đầu.** Không có code frontend AI nào.

## 2. AI decisions đã chốt

- LLM thật qua API (OpenAI-compatible `/chat/completions`).
- Mọi user đã đăng nhập: STUDENT / TEACHER / ADMIN. Guest descoped.
- Lưu lịch sử conversation/message xuống DB.
- Scope INTERN: không RAG/vector DB/fine-tuning/training; không AI grading/class placement; không payment gateway.
- `AiProvider` là interface độc lập contract; `AiService` không biết JSON OpenAI/Gemini (adapter tự map).

## 3. S12 architecture (đã implement)

- `config/AiProperties.java` (`app.ai.*`) + `config/AiConfig.java` (RestClient `aiRestClient` + timeouts).
- `entity/AiConversation.java` → `chat_conversations`; `entity/AiMessage.java` → `chat_messages`;
  `entity/enums/ConversationType.java` (CHATBOT/ASSISTANT).
- `repository/AiConversationRepository.java` (`findByUser_IdOrderByUpdatedAtDesc`, `existsByIdAndUser_Id`),
  `repository/AiMessageRepository.java` (list by conversation order by sequence, `maxSequenceNumber` query).
- `exception/AiProviderException.java`.
- `service/ai/AiProvider.java` (interface) + `AiChatRequest{systemPrompt,userMessage,maxOutputTokens}` +
  `AiChatReply{text}` (contract độc lập provider).
- `service/ai/LlmAiProvider.java` (adapter OpenAI-compatible: model/messages/max_tokens/temperature 0.3;
  missing key/timeout/HTTP lỗi/response rỗng → AiProviderException).
- `service/ai/AiFaqContext.java` (FAQ tĩnh) + `service/ai/AiContextBuilder.java` (system prompt + context role).
- `service/AiService.java` + `service/impl/AiServiceImpl.java`.
- DTO: `request/AiChatRequest{message @NotBlank, conversationId?}`, `response/AiChatResponse{reply,
  conversationId, historySaved, notice}`, `response/AiConversationResponse`,
  `response/AiConversationDetailResponse` (kèm messages).
- `controller/AiController.java` — đúng 4 endpoints, không thêm:
  - `POST /api/ai/chat` → 200 (chat, không phải 201)
  - `GET /api/ai/conversations` → 200 list của chính mình
  - `GET /api/ai/conversations/{id}` → 200 detail / 404
  - `DELETE /api/ai/conversations/{id}` → 204 / 404

## 4. Config (`application.yml`, file duy nhất bị sửa ngoài code mới)

```yaml
app:
  ai:
    base-url: "${AI_BASE_URL:https://api.openai.com/v1}"
    model: "${AI_MODEL:gpt-4o-mini}"
    api-key: "${AI_API_KEY:}"
    timeout-ms: 30000
    max-context-chars: 6000
    max-output-tokens: 500
```

- API key qua env `AI_API_KEY`, default rỗng (thiếu key → provider từ chối rõ ràng, không gọi HTTP).
- Tuyệt đối không `VITE_`, không hard-code key.

## 5. DB design (đọc từ code + `schema.sql` bảng 17/18)

- `chat_conversations`: id, `user_id` NULLABLE (FK users, SET NULL), `type` ENUM(CHATBOT/ASSISTANT),
  `title` VARCHAR(255, từ câu hỏi đầu, cắt 100 ký tự), created_at/updated_at.
- `chat_messages`: id, `conversation_id` NOT NULL (FK CASCADE), `sequence_number` INT
  (UNIQUE theo cặp conversation+sequence, tính = max+1), `question` TEXT, `response` TEXT, created_at.
- Quan hệ: `AiConversation.messages` OneToMany cascade ALL + orphanRemoval.
  ADMIN → ASSISTANT, còn lại → CHATBOT.
- Migration: `database/migration/001_ai_chat.sql` (CREATE TABLE IF NOT EXISTS, khớp schema).
- Trạng thái verify: entity mapping đã qua H2 `create-drop` trong controller tests (pass);
  **chưa apply migration lên MySQL thật** (pending, làm khi resume nếu cần).

## 6. Security / role-based context (`AiContextBuilder`)

- STUDENT: registrations + transactions của chính mình + lớp UPCOMING/STUDYING tuyển sinh + FAQ.
- TEACHER: lớp mình dạy (sĩ số) + số buổi đã điểm danh + FAQ.
- ADMIN: aggregates (số HV/GV/lớp theo trạng thái, pending counts) + FAQ.
- Cấm đưa LLM: `passwordHash`, thông tin thẻ/tài khoản ngân hàng, dữ liệu user khác ngoài phạm vi role.
- Ownership backend: GET list (chỉ của mình), GET detail, DELETE, POST chat kèm conversationId
  (check TRƯỚC khi gọi provider — fail fast, không tốn API call); чужой → 404 (không leak existence,
  đúng convention Notification).

## 7. FAQ

- `AiFaqContext` tĩnh trong backend (8 cặp hỏi-đáp: đăng ký, thanh toán, hủy, điểm danh, lịch học...).
- Chưa có FAQ entity/CRUD. Không RAG/vector DB.

## 8. Error handling (CODE THỰC TẾ)

- Blank message: `@NotBlank` → 400 + service `BusinessException` dự phòng.
- Provider timeout/lỗi/rỗng → `AiProviderException` → service map thành
  `BusinessException("AI đang bận, vui lòng thử lại sau")` → 400.
- Ownership: 404. Không token: 403.
- **DB save failure**: provider gọi TRƯỚC, lưu (conversation mới + message) trong MỘT transaction SAU;
  lưu lỗi → rollback toàn bộ, trả `historySaved=false` + `notice` rõ ràng, vẫn trả `reply`;
  `conversationId=null` khi conversation mới chưa lưu được. Không tạo trạng thái nửa vời.

## 9. Test status

| Suite | tests |
|---|---|
| AiContextBuilderTest (role scope, sanitize, truncate) | 6 |
| LlmAiProviderTest (MockRestServiceServer, no real HTTP) | 4 |
| AiServiceTest (ownership, save-failure, provider-fail) | 9 |
| AiControllerTest (MockMvc/H2, @MockBean AiProvider) | 9 |
| **Tổng** | **28** |

- XML mới nhất: **28/28 PASS, 0 failures, 0 errors, 0 skipped**.
- 5 test từng fail `UnnecessaryStubbingException` (helper `stubChatPrerequisites()` trong setUp nhưng
  5 test không tới provider call) — đã fix **test-only** bằng cách chuyển 2 stub vào helper và gọi
  helper chỉ ở test cần (hiện helper được gọi ở `chatNewConversationSaved`, `chatProviderFailure`;
  các test còn lại dùng mock defaults). Production code không đổi vì fix này.

## 10. Gradle issue hiện tại

- `gradlew test` hoàn thành test (XML flush 28/28), Spring `EntityManagerFactory` + Hikari shutdown xong,
  nhưng Gradle client không trả control (block ở shutdown).
- Daemon IDLE sau đó, không còn test-worker JVM, port 8080 free.
- `gradlew --stop` đã chạy nhiều lần; rerun sau đó vẫn block tương tự.
- Xem là vấn đề teardown/Gradle client trên Windows, CHƯA có bằng chứng test logic fail.
- **S12 chưa VERIFIED** vì chưa có BUILD SUCCESSFUL sạch; nhưng AI test logic 28/28 qua XML.

## 11. Current git state (không commit/push/reset/revert)

- Modified: `backend/.../application.yml` (khối `app.ai`), `frontend/.../AppRoutes.tsx`,
  `frontend/.../attendanceApi.ts`, `registrationsApi.ts`, `transactionsApi.ts` (4 file sau là S08–S11 có sẵn).
- Untracked S12: `config/AiConfig.java`, `config/AiProperties.java`, `controller/AiController.java`,
  `dto/request/AiChatRequest.java`, `dto/response/AiChatResponse.java`,
  `AiConversationDetailResponse.java`, `AiConversationResponse.java`, `entity/AiConversation.java`,
  `entity/AiMessage.java`, `entity/enums/ConversationType.java`, `exception/AiProviderException.java`,
  `repository/AiConversationRepository.java`, `AiMessageRepository.java`, `service/AiService.java`,
  `service/ai/` (6 files), `service/impl/AiServiceImpl.java`, 4 test files,
  `database/migration/001_ai_chat.sql`, `docs/project/`.
- Untracked S08–S11 (giữ nguyên): 4 test FE, hooks, pages, CSS như cũ.
- HEAD: `fbbfa8d`.

## 12. What NOT to do next

- Không rerun Gradle vô hạn; không thêm `lenient()`; không sửa production để né UnnecessaryStubbing.
- Không kill VS Code Java language server (PID 5312/13148/14076, không liên quan).
- Không `bootRun`/server background. Không bắt đầu S13 khi chưa chốt S12.

## 13. Next resume action

1. Đọc handoff này. 2. Kiểm tra XML AI tests mới nhất. 3. Nếu cần, lấy BUILD SUCCESSFUL sạch
   (stop daemon trước, chạy 1 lần). 4. Apply `001_ai_chat.sql` lên MySQL thật + boot verify
   `ddl-auto: validate`. 5. Chốt S12 complete. 6. Mới lập/approve S13 Frontend AI.

## 14. Roadmap position

- S01–S11 DONE. 17.7 VERIFIED. CORE BUSINESS COMPLETE.
- **S12 BACKEND AI = IN PROGRESS / PAUSED.** **S13 FRONTEND AI = NOT STARTED.**
- Release Readiness = chưa bắt đầu chính thức.

## 15. Limitations / backlog

- Provider/API cost + timeout/latency (key thật chưa cấu hình ở repo — đúng, key chỉ qua env).
- Admin-create password BCrypt, registration discrepancies (duplicate/capacity/owner-GET),
  `dashboardCharts` fail 1 test, docs/code discrepancies D/T/S-mã (xem PROJECT_CONTEXT §16).
- AI scope intern: model/rủi ro prompt-injection đã chặn bằng context giới hạn + system instruction.
