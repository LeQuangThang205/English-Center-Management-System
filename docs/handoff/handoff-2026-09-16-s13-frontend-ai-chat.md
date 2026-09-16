# Handoff — S13 Frontend AI Chat

Date (UTC): 2026-09-16
Workspace: `D:\English Center Management System`
Status: S13 IMPLEMENTED — chưa commit/push. Không reset/revert.

## 1. Current checkpoint

- S01–S11 DONE, 17.7 VERIFIED, CORE BUSINESS COMPLETE.
- **S12 Backend AI = VERIFIED** (AI tests 28/28 PASS qua XML, `compileJava` + `compileTestJava` PASS, migration/schema hợp lệ, security/context pass — xem §8).
- **S13 Frontend AI Chat = IMPLEMENTED** trong lượt này (S13 PLAN đã approved trước đó).
- HEAD: `0b8a6ee` (`ai open` — chứa S12). S13 nằm ở working tree **uncommitted**.
- Không commit/push/reset/revert ở lượt này.

## 2. S13 scope đã implement (không vượt scope)

- Một `AiChatPage` dùng chung cho `/student/ai-chat`, `/teacher/ai-chat`, `/admin/ai-chat`.
- Gửi câu hỏi, nhận reply, typing indicator (`AI đang trả lời…`), history sidebar, mở conversation (GET detail on-demand), xóa có confirm (Modal), retry gửi, `ErrorState`/`EmptyState`, responsive (2-column desktop → stack mobile).
- Không: RAG/vector DB/embedding/fine-tuning/training, markdown renderer, file upload, voice, streaming/websocket, payment AI, grading/placement, `dangerouslySetInnerHTML`.

## 3. Files created (6, S13)

- `frontend/src/types/aiChat.ts` — `AiChatResponse`, `AiConversation`, `AiMessage`, `AiConversationDetail` (map 1-1 backend DTO).
- `frontend/src/services/api/aiChatApi.ts` — `sendMessage` (POST `/ai/chat`), `getConversations`, `getConversation`, `deleteConversation` (DELETE 204 theo pattern `notificationsApi`). Chỉ gửi `message` + `conversationId` — không userId, không API key.
- `frontend/src/features/ai/useAiChat.ts` — state: list `loading|error|success` + `reload`; detail on-demand, 404 → giữ sidebar + báo lỗi panel; send trim-validate + `sendPending` guard; `lastDraft` + `retrySend`; delete confirm, delete-404 → sync xóa khỏi list; `notice` khi `historySaved=false` hoặc `notice != null`.
- `frontend/src/pages/AiChatPage.tsx` + `frontend/src/pages/AiChatPage.module.css` — composer là native `<form onSubmit>` (Enter-send, không `onKeyDown` — repo chưa có precedent); suggestions tĩnh (`Tôi đang học lớp nào?`, `Lịch học của tôi là gì?`, `Tôi có thể đăng ký lớp nào?`).
- `frontend/src/__tests__/aiChatPage.test.tsx` — 28 tests (xem §5).

## 4. Files modified (2, S13)

- `frontend/src/routes/AppRoutes.tsx` — thêm `isAiChat()` (`item.path.endsWith('/ai-chat')`) → `<AiChatPage />`; kế thừa `ProtectedRoute` role guard.
- `frontend/src/routes/navigation.ts` — ADMIN bỏ `comingSoon` ở `/admin/ai-chat`; TEACHER/STUDENT thêm `AI Assistant` (icon `Bot`, group `Thông tin`). Không sửa `Sidebar.tsx` (comingSoon chỉ là metadata render).

## 5. Test status S13

- `aiChatPage.test.tsx`: **28/28 PASS** (unauth→login, 3 role routes, PageHeader, history load/empty/error+retry, open detail, detail 404, messages, blank-draft no-request, send+reply, typing indicator, new/existing conversationId, 400, 403-envelope, retry đúng 2 POST, `historySaved=false` notice, delete cancel/success/clear-active/404-sync, multi-conversation, no-API-key, no-userId, suggestion submit, notification-count mock, authStorage).
- Full FE suite: **394/395 PASS** — fail duy nhất `dashboardCharts.test.tsx` (`renders the three charts…`, hard-coded `08/2026`/`3.300.000 ₫`, known maintenance backlog, KHÔNG sửa).
- `npm run lint` PASS. `npm run build` (`tsc -b` + vite) PASS.
- `git diff --check` PASS. `git diff --name-only -- backend/ database/` = rỗng (S01–S12 untouched).
- Lỗi giữa chừng (3 fail đầu + 2 lỗi `tsc` narrowing `release?.()`) đều fix **test-only**; production code không đổi vì các fix đó.

## 6. Git state (không commit/push)

```
M frontend/src/routes/AppRoutes.tsx
M frontend/src/routes/navigation.ts
?? frontend/src/__tests__/aiChatPage.test.tsx
?? frontend/src/features/ai/
?? frontend/src/pages/AiChatPage.tsx
?? frontend/src/pages/AiChatPage.module.css
?? frontend/src/services/api/aiChatApi.ts
?? frontend/src/types/aiChat.ts
```

## 7. Quyết định đã chốt (giữ nguyên)

- Delete gặp 404 → coi như đã xóa server-side, sync khỏi list (test `syncs history when delete returns 404`).
- Server là source of truth: mở lại conversation thì GET detail thay thế local state; không optimistic sync phức tạp.
- `title` null → fallback `Hội thoại #<id>`.
- Render text thuần, không markdown/HTML.

## 8. S12 verification recap (lượt trước, giữ để tham chiếu)

- XML `backend/build/test-results/test/`: AiContextBuilder 6 + LlmAiProvider 4 + AiService 9 + AiController 9 = **28/28, 0 failures/errors/skipped** (timestamp 2026-09-15T09:58:56).
- `compileJava` + `compileTestJava` PASS (EXIT_CODE=0).
- `001_ai_chat.sql` khớp `schema.sql` bảng 17/18 (PK/UK/FK); `ddl-auto: validate` giữ nguyên; `app.ai.*` đủ 6 key gồm `max-output-tokens: 500`; AI key chỉ qua env `AI_API_KEY`.
- Ownership fail-fast trước provider call → 404; `AiProviderException` → `BusinessException("AI đang bận…")` → 400; timeout 30s connect+read.

## 9. Pending / backlog (không làm trong lượt này)

1. **Apply `database/migration/001_ai_chat.sql` lên MySQL thật** — operational step trước UAT/demo S12+S13 (`ddl-auto: validate` sẽ fail boot nếu thiếu bảng `chat_*`). Không sửa migration nếu chưa có lỗi thực tế.
2. `dashboardCharts.test.tsx` fail 1 assertion — known maintenance, không sửa.
3. Pre-existing (không thuộc S12/S13): DB password + JWT secret hard-code trong `application.yml`; registration/transaction discrepancies (mã D/T); admin-create BCrypt backlog.

## 10. Next session

- UAT tay AI chat 3 role (sau khi apply migration + boot MySQL validate): send/reply, history, delete, retry, `historySaved=false` notice.
- Quyết định commit (hiện S12 committed ở `0b8a6ee`, S13 uncommitted) — chờ lệnh người dùng.
- Sau đó: Release Readiness theo `docs/project/ROADMAP.md` (fix dashboardCharts → full regression → UAT → prod config → README/ERD/demo → deploy).

## 11. Suggested skills

- `implement` — nếu next session triển khai tiếp (UAT fix, release readiness).
- `diagnosing-bugs` — nếu UAT MySQL/boot hoặc AI provider lỗi thật.
- `tdd` — nếu thêm slice/test mới.
- `handoff` — cuối mỗi session để compact tiếp.

## 12. What NOT to do next

- Không commit/push/reset/revert khi chưa lệnh.
- Không sửa `dashboardCharts.test.tsx`, S01–S11, backend/database vì S13.
- Không thêm RAG/vector DB/training/grading/payment gateway.
- Không hard-code AI key; không `VITE_AI_*`.

(End of file)
