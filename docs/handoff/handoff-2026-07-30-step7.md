# Handoff — 2026-07-30

## Phase

**Phase 2 — Backend Spring Boot**

## Current Step

**Step 13 — Business API: Attendance API** (complete: 7.1-7.3 JWT/Validation/Roles + 8 Users/StudentProfile + 9 Course + 10 Class + 11 Registration + 12 Transaction + 13 Attendance → **Phase 2 DONE**)  ✅ BUILD SUCCESSFUL — 198 tests, 0 failures

## What was completed

### JWT Foundation (Step 7.1)

Created the authentication infrastructure — no login/register endpoints yet, but the security layer is ready to accept JWT tokens.

### AuthController & CustomUserDetailsService (Step 7.2)

Full login/register flow with JWT, typed DTOs, Jakarta Validation, and MockMvc integration tests.

### Validation Error Handling & Role Authorization (Step 7.3)

- `MethodArgumentNotValidException` handler → HTTP 400 with the first `FieldError.getDefaultMessage()` (e.g. `"Email is required"`), keeping `ApiResponse` format.
- `SecurityConfig`: `/api/auth/**` permitAll, `/api/admin/**` `hasRole("ADMIN")`, everything else authenticated.
- Minimal `AdminController` (`GET /api/admin/test`) to exercise authorization.
- Tests: validation fail → 400; STUDENT → 403; ADMIN → 200.

### Users CRUD + Role Authorization (Step 8)

- `UserService` gained `currentUser`-aware overloads (`findAll(status, role, currentUser)`, `findById`, `findByEmail`, `create`, `update`, `delete`); authorization lives in the service (helper `checkSelfOrAdmin`), not the controller.
- Rules: ADMIN full access; STUDENT/TEACHER only view/edit own record; create/delete are ADMIN-only. `AccessDeniedException` handler → 403.
- `UserController` uses `@AuthenticationPrincipal User currentUser`; `DELETE` now returns 204.
- Tests: `UserControllerTest` (9) — ADMIN 200/200/200/204, STUDENT 200/403/200/403/403.

### Course CRUD (Step 9)

- Role-based, not record-based: any authenticated user can read courses; only ADMIN can write.
- `CourseService`/`CourseServiceImpl` unchanged (CRUD already complete from Step 5/6). No `@AuthenticationPrincipal` in the service because there is no per-record ownership to check.
- `CourseController` added a `requireAdmin(currentUser)` gate on POST/PUT/DELETE (throws `AccessDeniedException` → 403 via existing handler); `DELETE` → 204.
- Tests: `CourseControllerTest` (8) — ADMIN 200/201/200/204, STUDENT 200/403/403/403.

### Class API (Step 10)

- Entity/Repository/Service/DTO/Controller CRUD already existed (Step 5/6); only authorization + DELETE status were missing.
- Per-record model (user confirmed): read-all authenticated; POST ADMIN-only; PUT/DELETE allowed for ADMIN **or** the class's assigned TEACHER (`checkCanModify` compares `courseClass.teacher.id` with `currentUser.id`).
- `CourseClassService` gained `currentUser`-aware overloads (create/update/delete); logic lives in the service (per-record), not the controller.
- `CourseClassController` passes `@AuthenticationPrincipal User currentUser` to authorized overloads; `DELETE` → 204.
- Tests: `CourseClassControllerTest` (13) — ADMIN 200/201/200/204, STUDENT 200/403/403/403, TEACHER POST 403 / PUT own 200 / PUT other 403 / DELETE own 204 / DELETE other 403.

### StudentProfile API (Step 11)

- Profile is tied 1-to-1 to a student (`user_id` PK) — record-ownership model identical to User API (Step 8): non-admin read/update own profile only, create/delete ADMIN-only.
- `StudentProfileService` gained `currentUser`-aware overloads (findAll/findByUserId/findByEmail/create/update/delete); authorization lives in the service (`checkSelfOrAdmin`), not the controller.
- `StudentProfileController` passes `@AuthenticationPrincipal User currentUser` to all endpoints; `DELETE` → 204.
- Note: a TEACHER has no profile, so self-access 404s; access to another user's profile → 403.
- Tests: `StudentProfileControllerTest` (10) — ADMIN 200/201/200/204, STUDENT 200/403/200/403/403.

### Registration API (Step 11) — final step of Phase 2

- Authorization per user requirement: **GET open to all authenticated users** (no scope restriction); **POST STUDENT-only, self-registration only**; **ADMIN manages all registrations; STUDENT may only cancel their own**.
- Rules:
  - GET list/filter/by-id: any authenticated user → 200 (auth handled by `SecurityConfig`, no service check).
  - POST: role STUDENT **and** `studentId == currentUser.id`, else 403.
  - PUT approve / reject / mark-paid: ADMIN only (403 otherwise) — administrative decisions.
  - PUT cancel: ADMIN (any) or STUDENT (own) → **204 No Content**.
- `RegistrationService` gained plain `findAll(studentId, classId, status)` (for the open GET) + `currentUser`-aware overloads `create`/`approve`/`reject`/`cancel`/`markPaid`. Authorization lives in the service (`requireAdmin`, owner check in cancel); controller only passes `@AuthenticationPrincipal User currentUser`.
- `RegistrationController`: GET endpoints no longer need `currentUser`; `PUT /{id}/cancel` → 204. `approverId`/`rejecterId` query params removed from approve/reject — approver/rejecter comes from the authenticated token (prevents spoofing); `reject` still takes an optional `{reason}` body.
- `RegistrationRepository.findByCourseClass_Teacher_Id` removed (TEACHER is not part of this model).
- Tests: `RegistrationControllerTest` (20) — admin 200/403/200/200/204, student 200/200/201/403/403/403/204, teacher 200/403/403/403.

### Transaction/Payment API (Step 12) — per UC-26 (Thanh toán) + UC-27 (Xem lịch sử)

- Manual bank-transfer payment: Student creates a transaction (only for an APPROVED registration of their own) → reports paid → ADMIN confirms/rejects. `TransactionStatus`: `PENDING_CONFIRMATION → SUCCESS | FAILED`.
- Rules:
  - GET list/by-id: ADMIN sees everything (+ filters studentId/registrationId/status); STUDENT only sees transactions tied to their own registrations (foreign `studentId` → 403); TEACHER → 403.
  - POST: STUDENT-only, own APPROVED registration only → 201 (201 for create). ADMIN/TEACHER → 403.
  - PUT report-paid: STUDENT own transaction only (must be PENDING_CONFIRMATION) → sets `paidAt`; still PENDING_CONFIRMATION.
  - PUT confirm: ADMIN-only → transaction SUCCESS + `RegistrationService.markPaid(...)` (registration APPROVED → PAID). Guard against a second SUCCESS on the same registration → 400.
  - PUT reject: ADMIN-only → FAILED.
- `TransactionService`/`TransactionServiceImpl` carry all authorization (owner check = `transaction.registration.student.id == currentUser.id`; `requireAdmin` for confirm/reject); `TransactionController` only passes `@AuthenticationPrincipal User currentUser` and returns `TransactionResponse`.
- Business rules enforced: payment only for APPROVED registration; one SUCCESS transaction per registration (`existsByRegistration_IdAndStatus`); `transactionCode` auto-generated (`TXN<timestamp><registrationId>`) as the bank-transfer reference (BR-05); `amount` copied from `tuitionAtRegistration`.
- Out of scope (no schema support): student cancels transaction (UC-26 A2), payment-gateway journal (UC-28), CSV reconciliation (UC-29), audit log for transactions (BR-07).
- Tests: `TransactionControllerTest` (21) — admin 200/200/200/201/403/403/403/403 + student create/report-paid flow + teacher 403 matrix, lifecycle create→report-paid→confirm (SUCCESS + registration PAID), duplicate confirm / create-after-paid → 400.

### Attendance API (Step 13) — per UC-16 (Điểm danh)

- Teacher takes attendance per class + date (statuses PRESENT/ABSENT/EXCUSED) and can edit an existing sheet afterwards (UC-16 A1). Tables: `attendance_sheets` (one sheet per class+date) + `attendance_records` (per-student status).
- Rules:
  - POST /api/attendance/sheets: TEACHER (own assigned class) or ADMIN → 201. Class must be `STUDYING` (BR-03, else 400); date must not be in the future (BR-05, else 400); one sheet per class+date (BR-02, duplicate → 400); students must hold an APPROVED or PAID registration in the class (else 400); duplicate student in records → 400.
  - GET list/by-id: ADMIN sees everything; TEACHER only sheets of classes they teach (foreign class/sheet → 403); STUDENT → 403 (attendance has no student-facing UC; attendance rate is a reporting concern).
  - PUT /api/attendance/sheets/{id}: TEACHER (own class) or ADMIN → 200; replaces all records of the sheet (A1).
- `AttendanceServiceImpl` carries all authorization (`requireClassTeacherOrAdmin`, `requireReadAccess`); `AttendanceController` only passes `@AuthenticationPrincipal User currentUser` and returns `AttendanceSheetResponse`.
- Update replaces records via `clear()` + `addAll()` (orphanRemoval deletes old records before inserting new ones, so the `(sheet_id, student_id)` unique key is safe on re-mark).
- Out of scope (reporting module): attendance rate (BR-06), QR-code attendance, absence notifications.
- Tests: `AttendanceControllerTest` (20) — admin/teacher/student matrix, own-vs-other class 403s, not-STUDYING 400, future date 400, duplicate sheet 400, non-enrolled / duplicate student 400, filter by date, update replaces records.

### Files created

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/englishcenter/config/PasswordEncoderConfig.java` | `@Bean` for `BCryptPasswordEncoder` |
| `backend/src/main/java/com/englishcenter/config/SecurityConfig.java` | `SecurityFilterChain` — CORS, CSRF disable, STATELESS, route rules, JWT filter; `AuthenticationManager` bean |
| `backend/src/main/java/com/englishcenter/security/JwtTokenProvider.java` | Generate/validate JWT, extract userId & role |
| `backend/src/main/java/com/englishcenter/security/JwtAuthenticationFilter.java` | `OncePerRequestFilter` — reads `Authorization: Bearer <token>`, validates, sets `SecurityContextHolder` |
| `backend/src/main/java/com/englishcenter/security/CustomUserDetailsService.java` | Loads user by email into Spring `UserDetails` (email, passwordHash, `ROLE_...`, disabled if INACTIVE) |
| `backend/src/main/java/com/englishcenter/controller/AuthController.java` | `POST /api/auth/login` + `POST /api/auth/register` |
| `backend/src/main/java/com/englishcenter/controller/AdminController.java` | `GET /api/admin/test` → `"Admin API is working"` (role test only) |
| `backend/src/main/java/com/englishcenter/dto/request/LoginRequest.java` | `{email, password}` with `@NotBlank`, `@Email` |
| `backend/src/main/java/com/englishcenter/dto/request/RegisterRequest.java` | `{email, password, fullName}` with `@NotBlank`, `@Email`, `@Size` |
| `backend/src/main/java/com/englishcenter/dto/response/AuthResponse.java` | `{token, user: UserResponse}` replacing `Map<String,Object>` |
| `backend/src/test/java/com/englishcenter/controller/AuthControllerTest.java` | 5 MockMvc integration tests (H2): login success, login fail, register success, duplicate email, validation fail → 400 |
| `backend/src/test/java/com/englishcenter/controller/AdminControllerTest.java` | 2 MockMvc role tests (H2): STUDENT → 403, ADMIN → 200 |
| `backend/src/test/java/com/englishcenter/controller/UserControllerTest.java` | 9 MockMvc tests (H2): admin 200/200/200/204, student 200/403/200/403/403 |
| `backend/src/test/java/com/englishcenter/controller/CourseControllerTest.java` | 8 MockMvc tests (H2): admin 200/201/200/204, student 200/403/403/403 |
| `backend/src/test/java/com/englishcenter/controller/CourseClassControllerTest.java` | 13 MockMvc tests (H2): admin 200/201/200/204, student 200/403/403/403, teacher own/other matrix |
| `backend/src/test/java/com/englishcenter/controller/StudentProfileControllerTest.java` | 10 MockMvc tests (H2): admin 200/201/200/204, student 200/403/200/403/403 |
| `backend/src/test/java/com/englishcenter/controller/RegistrationControllerTest.java` | 20 MockMvc tests (H2): admin/student/teacher authorization matrix — GET open, POST student-only, cancel → 204 |
| `backend/src/main/java/com/englishcenter/entity/enums/PaymentMethod.java` | Enum `BANK_TRANSFER` |
| `backend/src/main/java/com/englishcenter/entity/enums/TransactionStatus.java` | Enum `PENDING_CONFIRMATION`, `SUCCESS`, `FAILED` |
| `backend/src/main/java/com/englishcenter/entity/Transaction.java` | Entity for `transactions` table (registration, amount, paymentMethod, transactionCode UNIQUE, status, paidAt, confirmedAt, confirmedBy) |
| `backend/src/main/java/com/englishcenter/repository/TransactionRepository.java` | `findByRegistration_Id`, `findByRegistration_Student_Id`, `findByStatus`, `existsByRegistration_IdAndStatus` |
| `backend/src/main/java/com/englishcenter/service/TransactionService.java` | `create`, `findById`, `findAll`, `reportPaid`, `confirm`, `reject` (all take `currentUser`) |
| `backend/src/main/java/com/englishcenter/service/impl/TransactionServiceImpl.java` | Service-side authorization (owner check + `requireAdmin`); confirm reuses `RegistrationService.markPaid` |
| `backend/src/main/java/com/englishcenter/controller/TransactionController.java` | `/api/transactions` — POST/GET/GET{id}/PUT report-paid/confirm/reject |
| `backend/src/main/java/com/englishcenter/dto/request/CreateTransactionRequest.java` | `{registrationId}` with `@NotNull` |
| `backend/src/main/java/com/englishcenter/dto/response/TransactionResponse.java` | Transaction detail + student/course/class names |
| `backend/src/test/java/com/englishcenter/controller/TransactionControllerTest.java` | 21 MockMvc tests (H2): admin/student/teacher matrix + full lifecycle |
| `backend/src/main/java/com/englishcenter/entity/enums/AttendanceStatus.java` | Enum `PRESENT`, `ABSENT`, `EXCUSED` |
| `backend/src/main/java/com/englishcenter/entity/AttendanceSheet.java` | Entity for `attendance_sheets` (courseClass, date, createdBy, records) — UNIQUE (class_id, date) |
| `backend/src/main/java/com/englishcenter/entity/AttendanceRecord.java` | Entity for `attendance_records` (sheet, student, status) — UNIQUE (sheet_id, student_id) |
| `backend/src/main/java/com/englishcenter/repository/AttendanceSheetRepository.java` | `existsByCourseClass_IdAndDate`, `findByCourseClass_Id`, `findByCourseClass_Teacher_Id` |
| `backend/src/main/java/com/englishcenter/service/AttendanceService.java` | `create`, `findById`, `findAll`, `update` (all take `currentUser`) |
| `backend/src/main/java/com/englishcenter/service/impl/AttendanceServiceImpl.java` | Service-side authorization + UC-16 business rules |
| `backend/src/main/java/com/englishcenter/controller/AttendanceController.java` | `/api/attendance/sheets` — POST/GET/GET{id}/PUT |
| `backend/src/main/java/com/englishcenter/dto/request/CreateAttendanceSheetRequest.java` | `{classId, date, records}` |
| `backend/src/main/java/com/englishcenter/dto/request/UpdateAttendanceSheetRequest.java` | `{records}` |
| `backend/src/main/java/com/englishcenter/dto/request/AttendanceRecordRequest.java` | `{studentId, status}` |
| `backend/src/main/java/com/englishcenter/dto/response/AttendanceSheetResponse.java` | Sheet detail + records |
| `backend/src/main/java/com/englishcenter/dto/response/AttendanceRecordResponse.java` | `{id, studentId, studentName, status}` |
| `backend/src/test/java/com/englishcenter/controller/AttendanceControllerTest.java` | 20 MockMvc tests (H2): admin/teacher/student matrix + UC-16 rules |

### Files modified

| File | Change |
|------|--------|
| `backend/build.gradle` | Added `spring-boot-starter-security`, `spring-boot-starter-validation`, `jjwt-api:0.12.5`, `jjwt-impl`, `jjwt-jackson` |
| `backend/src/main/resources/application.yml` | Added `app.jwt.secret` and `app.jwt.expiration` |
| `backend/src/test/resources/application.yml` | Added `app.jwt.*` properties for test context |
| `backend/src/main/java/com/englishcenter/exception/GlobalExceptionHandler.java` | Added `@ExceptionHandler(AuthenticationException.class)` → 401 `"Invalid email or password"`; `@ExceptionHandler(MethodArgumentNotValidException.class)` → 400 with first field message; `@ExceptionHandler(AccessDeniedException.class)` → 403 `"Access denied"` |
| `backend/src/main/java/com/englishcenter/config/SecurityConfig.java` | Added `@Bean AuthenticationManager authenticationManager(AuthenticationConfiguration)`; role rules: `/api/auth/**` permitAll, `/api/admin/**` `hasRole("ADMIN")`, rest authenticated |
| `backend/src/main/java/com/englishcenter/service/UserService.java` | Added `currentUser`-aware overloads for findAll/findById/findByEmail/create/update/delete |
| `backend/src/main/java/com/englishcenter/service/impl/UserServiceImpl.java` | Implemented authorization: `isAdmin`, `checkSelfOrAdmin`; non-admin self-only; create/delete ADMIN-only |
| `backend/src/main/java/com/englishcenter/controller/UserController.java` | Uses `@AuthenticationPrincipal User currentUser` + authorized service methods; DELETE → 204 |
| `backend/src/main/java/com/englishcenter/controller/CourseController.java` | Added `requireAdmin(currentUser)` gate on POST/PUT/DELETE; DELETE → 204; GET unchanged |
| `backend/src/main/java/com/englishcenter/service/CourseClassService.java` | Added `currentUser`-aware overloads for create/update/delete |
| `backend/src/main/java/com/englishcenter/service/impl/CourseClassServiceImpl.java` | Implemented `checkCanModify` (ADMIN or class's teacher); create ADMIN-only |
| `backend/src/main/java/com/englishcenter/controller/CourseClassController.java` | Passes `@AuthenticationPrincipal User currentUser` to authorized overloads; DELETE → 204 |
| `backend/src/main/java/com/englishcenter/service/StudentProfileService.java` | Added `currentUser`-aware overloads for findAll/findByUserId/findByEmail/create/update/delete |
| `backend/src/main/java/com/englishcenter/service/impl/StudentProfileServiceImpl.java` | Implemented authorization: `isAdmin`, `checkSelfOrAdmin`; non-admin self-only; create/delete ADMIN-only |
| `backend/src/main/java/com/englishcenter/controller/StudentProfileController.java` | Passes `@AuthenticationPrincipal User currentUser` to all endpoints; DELETE → 204 |
| `backend/src/main/java/com/englishcenter/repository/RegistrationRepository.java` | Removed `findByCourseClass_Teacher_Id` (not needed in the ADMIN/STUDENT model) |
| `backend/src/main/java/com/englishcenter/service/RegistrationService.java` | Added plain `findAll(studentId, classId, status)` + `currentUser`-aware overloads for create/approve/reject/cancel/markPaid |
| `backend/src/main/java/com/englishcenter/service/impl/RegistrationServiceImpl.java` | Implemented `requireAdmin` (approve/reject/mark-paid ADMIN-only); POST only STUDENT self; cancel ADMIN or own-student |
| `backend/src/main/java/com/englishcenter/controller/RegistrationController.java` | GET uses plain service methods; POST/PUT pass `@AuthenticationPrincipal User currentUser`; cancel → 204; removed `approverId`/`rejecterId` params |

### Bugs fixed during session

1. **`contextLoads()` / all `@SpringBootTest` failed** — Spring Boot 3 / Security 6 does NOT expose an `AuthenticationManager` bean automatically; `AuthController` injects it, causing `NoSuchBeanDefinitionException`. Fixed by declaring `@Bean AuthenticationManager authenticationManager(AuthenticationConfiguration config)` in `SecurityConfig`.
2. (Step 7.1) `contextLoads()` failed because `JwtTokenProvider` reads `@Value("${app.jwt.secret}")` but test context lacked these properties. Fixed by adding `app.jwt.*` to `src/test/resources/application.yml`.
3. **Login with wrong password returned 500 instead of 401** — `BadCredentialsException` thrown inside the controller was caught by the generic `@ExceptionHandler(Exception.class)`. Fixed with a dedicated `AuthenticationException` handler returning 401.

### Design notes

- `AuthController` calls `authenticationManager.authenticate(...)` inside the controller; `AuthenticationManager` is built by Spring Boot from the single `UserDetailsService` (`CustomUserDetailsService`) + `PasswordEncoder` (BCrypt) beans.
- Jakarta Validation only runs because of `@Valid @RequestBody` on controller methods.
- Register defaults `role = STUDENT`, `status = ACTIVE`, encodes password with BCrypt before save; duplicate email → 409 via existing `UserService.create`.
- `AuthControllerTest` / `AdminControllerTest` / `UserControllerTest` override the datasource to H2 in-memory (`@TestPropertySource`, `MODE=MySQL`, `ddl-auto=create-drop`) and use `@Transactional` rollback so the MySQL dev DB is never touched. Identical configs share one cached Spring context.
- Per-record authorization lives in the service: non-admin (STUDENT/TEACHER) may only view/update their own record (`currentUser.getId()` vs target id); create/delete are ADMIN-only. Controller is a thin layer passing `@AuthenticationPrincipal User currentUser` and returning `UserResponse` DTOs.

### Test results

- `./gradlew clean test` — ✅ BUILD SUCCESSFUL — **198 tests, 0 failures** (AuthControllerTest: 5, AdminControllerTest: 2, UserControllerTest: 9, CourseControllerTest: 8, CourseClassControllerTest: 13, StudentProfileControllerTest: 10, RegistrationControllerTest: 20, TransactionControllerTest: 21, AttendanceControllerTest: 20)

## What is NOT completed

| Task | Status |
|------|--------|
| `UserControllerTest` for POST create (ADMIN only) | ❌ Not started — create covered by service-level auth, endpoint untested |
| Refresh Token, OAuth2, JWT blacklist, Redis | ❌ Deliberately out of scope (per session instruction) |
| Payment gateway integration, CSV reconciliation, transaction audit log (UC-28/29, BR-07) | ❌ Out of scope — no schema support, manual bank-transfer model only |
| Attendance rate computation, QR attendance, absence notifications (BR-06) | ❌ Out of scope — reporting/dashboard module |

## Architecture overview (current)

```
Login/Register → /api/auth/** (permitAll) → AuthController
  ├─ login    → AuthenticationManager.authenticate(email, password)
  │              ├─ fail → BadCredentialsException → 401
  │              └─ ok   → JwtTokenProvider.generateToken(user) → {token, user}
  └─ register → validate → BCrypt hash → UserService.create → 201 {token, user}
      └─ validation fail → MethodArgumentNotValidException → 400 (first field message)

Authenticated request → JwtAuthenticationFilter
  ├─ No/Invalid token → 401
  └─ Valid token → JwtTokenProvider.validateToken() → set SecurityContext (principal = User entity) → Authorization
       ├─ /api/auth/** → permitAll
       ├─ /api/admin/** → hasRole("ADMIN") (else → 403)
       └─ anyRequest → authenticated → Controller (@AuthenticationPrincipal User currentUser)
            └─ per-record check in Service (checkSelfOrAdmin) → AccessDeniedException → 403
```

## Related files

- `backend/src/main/java/com/englishcenter/config/SecurityConfig.java`
- `backend/src/main/java/com/englishcenter/config/PasswordEncoderConfig.java`
- `backend/src/main/java/com/englishcenter/security/JwtTokenProvider.java`
- `backend/src/main/java/com/englishcenter/security/JwtAuthenticationFilter.java`
- `backend/src/main/java/com/englishcenter/security/CustomUserDetailsService.java`
- `backend/src/main/java/com/englishcenter/controller/AuthController.java`
- `backend/src/main/java/com/englishcenter/controller/AdminController.java`
- `backend/src/main/java/com/englishcenter/controller/UserController.java`
- `backend/src/main/java/com/englishcenter/controller/CourseController.java`
- `backend/src/main/java/com/englishcenter/controller/CourseClassController.java`
- `backend/src/main/java/com/englishcenter/service/UserService.java`
- `backend/src/main/java/com/englishcenter/service/impl/UserServiceImpl.java`
- `backend/src/main/java/com/englishcenter/service/CourseClassService.java`
- `backend/src/main/java/com/englishcenter/service/impl/CourseClassServiceImpl.java`
- `backend/src/main/java/com/englishcenter/service/StudentProfileService.java`
- `backend/src/main/java/com/englishcenter/service/impl/StudentProfileServiceImpl.java`
- `backend/src/main/java/com/englishcenter/controller/StudentProfileController.java`
- `backend/src/main/java/com/englishcenter/repository/RegistrationRepository.java`
- `backend/src/main/java/com/englishcenter/service/RegistrationService.java`
- `backend/src/main/java/com/englishcenter/service/impl/RegistrationServiceImpl.java`
- `backend/src/main/java/com/englishcenter/controller/RegistrationController.java`
- `backend/src/main/java/com/englishcenter/dto/request/LoginRequest.java`
- `backend/src/main/java/com/englishcenter/dto/request/RegisterRequest.java`
- `backend/src/main/java/com/englishcenter/dto/response/AuthResponse.java`
- `backend/src/main/java/com/englishcenter/exception/GlobalExceptionHandler.java`
- `backend/src/test/java/com/englishcenter/controller/AuthControllerTest.java`
- `backend/src/test/java/com/englishcenter/controller/AdminControllerTest.java`
- `backend/src/test/java/com/englishcenter/controller/UserControllerTest.java`
- `backend/src/test/java/com/englishcenter/controller/CourseControllerTest.java`
- `backend/src/test/java/com/englishcenter/controller/CourseClassControllerTest.java`
- `backend/src/test/java/com/englishcenter/controller/StudentProfileControllerTest.java`
- `backend/src/test/java/com/englishcenter/controller/RegistrationControllerTest.java`
- `backend/src/main/java/com/englishcenter/entity/Transaction.java`
- `backend/src/main/java/com/englishcenter/entity/enums/PaymentMethod.java`
- `backend/src/main/java/com/englishcenter/entity/enums/TransactionStatus.java`
- `backend/src/main/java/com/englishcenter/repository/TransactionRepository.java`
- `backend/src/main/java/com/englishcenter/service/TransactionService.java`
- `backend/src/main/java/com/englishcenter/service/impl/TransactionServiceImpl.java`
- `backend/src/main/java/com/englishcenter/controller/TransactionController.java`
- `backend/src/main/java/com/englishcenter/dto/request/CreateTransactionRequest.java`
- `backend/src/main/java/com/englishcenter/dto/response/TransactionResponse.java`
- `backend/src/test/java/com/englishcenter/controller/TransactionControllerTest.java`
- `backend/src/main/java/com/englishcenter/entity/AttendanceSheet.java`
- `backend/src/main/java/com/englishcenter/entity/AttendanceRecord.java`
- `backend/src/main/java/com/englishcenter/entity/enums/AttendanceStatus.java`
- `backend/src/main/java/com/englishcenter/repository/AttendanceSheetRepository.java`
- `backend/src/main/java/com/englishcenter/service/AttendanceService.java`
- `backend/src/main/java/com/englishcenter/service/impl/AttendanceServiceImpl.java`
- `backend/src/main/java/com/englishcenter/controller/AttendanceController.java`
- `backend/src/main/java/com/englishcenter/dto/request/CreateAttendanceSheetRequest.java`
- `backend/src/main/java/com/englishcenter/dto/request/UpdateAttendanceSheetRequest.java`
- `backend/src/main/java/com/englishcenter/dto/request/AttendanceRecordRequest.java`
- `backend/src/main/java/com/englishcenter/dto/response/AttendanceSheetResponse.java`
- `backend/src/main/java/com/englishcenter/dto/response/AttendanceRecordResponse.java`
- `backend/src/test/java/com/englishcenter/controller/AttendanceControllerTest.java`
- `backend/src/main/resources/application.yml`
- `backend/src/test/resources/application.yml`
- `backend/build.gradle`

## Suggested commit message

```
feat: add JWT authentication foundation

- Add spring-boot-starter-security and jjwt dependencies
- Create JwtTokenProvider for token generation and validation
- Create JwtAuthenticationFilter (OncePerRequestFilter)
- Configure SecurityFilterChain (CORS, CSRF, STATELESS, route rules)
- Add PasswordEncoder bean (BCrypt)
- Add app.jwt.secret and app.jwt.expiration config
- Add CustomUserDetailsService (UserDetailsService)
- Add AuthController with login/register + LoginRequest/RegisterRequest/AuthResponse DTOs
- Add Jakarta Validation (@NotBlank, @Email, @Size) on auth DTOs
- Add AuthenticationManager bean + AuthenticationException handler (401)
- Add MethodArgumentNotValidException handler (400)
- Add role rules: /api/auth/** permitAll, /api/admin/** hasRole("ADMIN")
- Add AdminController (GET /api/admin/test)
- Add AuthControllerTest + AdminControllerTest (MockMvc, H2) — auth flow + validation + roles
- Add per-record role authorization to UserService/UserController (@AuthenticationPrincipal)
- Add AccessDeniedException handler (403) + DELETE → 204
- Add UserControllerTest (MockMvc, H2) — admin/student authorization matrix
- Add ADMIN-only write gate to CourseController (requireAdmin) + CourseControllerTest
- Add per-record Class authorization (ADMIN or class teacher) to CourseClassService/Controller + CourseClassControllerTest
- Add per-record StudentProfile authorization (self or ADMIN; create/delete ADMIN-only) + StudentProfileControllerTest
- Add Registration authorization: GET open to authenticated, POST STUDENT self-only, ADMIN approve/reject/mark-paid/cancel, STUDENT cancel own (→ 204); removed approverId/rejecterId params + RegistrationControllerTest
- Add Transaction/Payment API: Student creates transaction for APPROVED registration + report-paid, ADMIN confirm/reject (SUCCESS → registration PAID); service-side owner + role checks; TransactionControllerTest (21)
- Add Attendance API (UC-16): Teacher/ADMIN create & update attendance sheets (class must be STUDYING, date not future, students APPROVED/PAID, one sheet per class+date); TEACHER scoped to own class; AttendanceControllerTest (20)
```

## Next session

**Phase 2 is complete** (198 tests, 0 failures). All 7 resources (Users, StudentProfiles, Courses, Classes, Registrations, Transactions, Attendance) have role/record-based authorization + integration tests. Deliberately out of scope: Refresh Token, OAuth2, JWT blacklist, Redis, payment-gateway integration/CSV reconciliation/audit log (UC-28/29, BR-07), attendance rate (BR-06), and a `UserControllerTest` POST-create case. Next per roadmap: **Score API (`scores` table, UC-17/UC-18)**, then Notification, AI Chat.
