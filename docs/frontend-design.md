# Frontend Design System — English Center Management System

> **Single source of truth** cho mọi quyết định UI của frontend (Admin / Teacher / Student dùng chung).
> Đọc file này trước khi tạo bất kỳ component, page hay style nào.
> Phiên bản: v1.0 (Step 18.1 — Frontend Foundation).

---

## 1. Nguyên tắc thiết kế

1. **Hiện đại, chuyên nghiệp, giống SaaS thực tế.** Không tạo cảm giác "AI-generated".
2. **Ít decoration.** Không gradient lạm dụng, không glassmorphism, không neon, không shadow nặng, không card lồng card.
3. **Ít màu.** Một màu primary duy nhất (xanh dương) + bộ neutral (slate) + semantic (success/warning/danger). Màu khác chỉ xuất hiện để biểu thị trạng thái (status).
4. **Typography rõ ràng, hierarchy mạnh.** Kích thước/weight/thưa chữ theo token, không tự đặt.
5. **Layout có khoảng thở nhưng không lãng phí.** Spacing theo scale 4px, gap nhất quán 24px giữa các block chính.
6. **Shell cố định:** Sidebar + Topbar + Main Content — giống nhau giữa mọi role, chỉ khác menu.
7. **Responsive thật sự:** Mobile không phải desktop thu nhỏ. Mobile dùng drawer, tablet dùng sidebar thu gọn, desktop dùng sidebar đầy đủ.
8. **Accessibility & usability ưu tiên:** focus ring rõ ràng, contrast AA, keyboard operable, label cho mọi input, empty/loading/error state đầy đủ.
9. **Mọi giá trị phải đến từ token.** Không magic value trong component.
10. **Component reusable**, một set icon duy nhất (không trộn style/library icon).

---

## 2. Stack tham chiếu (cho Step 18.1+)

| Lớp | Lựa chọn |
|-----|----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router (v6/v7) |
| Styling | CSS custom properties (design tokens) + CSS Modules — không dùng CSS framework |
| Icons | Một bộ duy nhất, icon stroke 24px, dùng inline SVG (vd. Lucide) — không emoji làm icon chính |
| Charts | Chưa chọn — sẽ quyết định ở bước Dashboard |
| State | Context + hooks (tối giản), chưa cần thư viện state nặng |

> Chú ý: quyết định stack có thể được điều chỉnh trong Step 18.1, nhưng **design tokens và quy ước visual bên dưới là bất biến**.

---

## 3. Color palette

### 3.1 Primary — xanh dương (duy nhất)

Dùng cho: hành động chính, link, focus, active nav, brand.

| Token | Giá trị |
|-------|---------|
| `--color-primary-50` | `#EFF6FF` |
| `--color-primary-100` | `#DBEAFE` |
| `--color-primary-200` | `#BFDBFE` |
| `--color-primary-300` | `#93C5FD` |
| `--color-primary-400` | `#60A5FA` |
| `--color-primary-500` | `#3B82F6` |
| `--color-primary-600` | `#2563EB` |
| `--color-primary-700` | `#1D4ED8` |
| `--color-primary-800` | `#1E40AF` |
| `--color-primary-900` | `#1E3A8A` |

### 3.2 Neutral — slate

Dùng cho: surface, border, text, nền trang. Giá trị chính:

| Token | Giá trị |
|-------|---------|
| `--color-neutral-0` | `#FFFFFF` |
| `--color-neutral-50` | `#F8FAFC` |
| `--color-neutral-100` | `#F1F5F9` |
| `--color-neutral-200` | `#E2E8F0` |
| `--color-neutral-300` | `#CBD5E1` |
| `--color-neutral-400` | `#94A3B8` |
| `--color-neutral-500` | `#64748B` |
| `--color-neutral-600` | `#475569` |
| `--color-neutral-700` | `#334155` |
| `--color-neutral-800` | `#1E293B` |
| `--color-neutral-900` | `#0F172A` |

### 3.3 Semantic

Chỉ dùng cho trạng thái, không dùng cho brand.

| Token | Giá trị |
|-------|---------|
| `--color-success-50` | `#F0FDF4` |
| `--color-success-500` | `#22C55E` |
| `--color-success-600` | `#16A34A` |
| `--color-success-700` | `#15803D` |
| `--color-warning-50` | `#FFFBEB` |
| `--color-warning-500` | `#F59E0B` |
| `--color-warning-600` | `#D97706` |
| `--color-warning-700` | `#B45309` |
| `--color-danger-50` | `#FEF2F2` |
| `--color-danger-500` | `#EF4444` |
| `--color-danger-600` | `#DC2626` |
| `--color-danger-700` | `#B91C1C` |

### 3.4 Role tokens (alias — luôn tham chiếu qua alias này)

| Token | Giá trị |
|-------|---------|
| `--color-bg-canvas` | `#F8FAFC` (nền trang) |
| `--color-bg-surface` | `#FFFFFF` (card, sidebar, topbar) |
| `--color-bg-subtle` | `#F1F5F9` (table header, hover row, input disabled) |
| `--color-border` | `#E2E8F0` |
| `--color-border-strong` | `#CBD5E1` |
| `--color-text-primary` | `#0F172A` |
| `--color-text-secondary` | `#475569` |
| `--color-text-muted` | `#64748B` |
| `--color-text-disabled` | `#94A3B8` |
| `--color-text-on-primary` | `#FFFFFF` |
| `--color-focus-ring` | `rgba(37, 99, 235, 0.30)` |

### 3.5 Bảng ánh xạ status → tone

Mọi status trong UI phải hiển thị bằng Badge theo bảng này. Không tự bôi màu text.

| Domain | Giá trị | Tone |
|--------|---------|------|
| User | `ACTIVE` | success |
| User | `INACTIVE` | neutral |
| Course | `ACTIVE` | success |
| Course | `DELETED` | neutral |
| Course level | `BEGINNER` | primary |
| Course level | `INTERMEDIATE` | warning |
| Course level | `ADVANCED` | success |
| Class | `UPCOMING` | primary |
| Class | `STUDYING` | success |
| Class | `FINISHED` | neutral |
| Class | `CANCELLED` | danger |
| Registration | `PENDING` | warning |
| Registration | `APPROVED` | primary |
| Registration | `PAID` | success |
| Registration | `REJECTED` | danger |
| Registration | `CANCELLED` | neutral |
| Transaction | `PENDING_CONFIRMATION` | warning |
| Transaction | `SUCCESS` | success |
| Transaction | `FAILED` | danger |
| Attendance | `PRESENT` | success |
| Attendance | `ABSENT` | danger |
| Attendance | `EXCUSED` | warning |
| Notification | chưa đọc (unread) | primary (chấm nhỏ + tiêu đề đậm) |

---

## 4. Typography

- Font chính: `Inter`, fallback `Segoe UI`, `system-ui`, `-apple-system`, `Helvetica Neue`, `Arial`, sans-serif.
- Không dùng font display/script. Không uppercase toàn cục.
- Số đơn vị dùng `tabular-nums` cho bảng.

### 4.1 Scale

| Token | Kích thước | Line-height | Weight | Dùng cho |
|-------|-----------|-------------|--------|----------|
| `--font-size-3xl` | 30px | 1.2 | 700 | Display (ít dùng) |
| `--font-size-2xl` | 24px | 1.3 | 700 | Page title |
| `--font-size-xl` | 20px | 1.35 | 600 | Section title |
| `--font-size-lg` | 18px | 1.4 | 600 | Card title, modal title |
| `--font-size-md` | 16px | 1.5 | 400 | Body lớn |
| `--font-size-sm` | 14px | 1.5 | 400 | **Mặc định UI** |
| `--font-size-xs` | 13px | 1.45 | 400 | Secondary text, table cell |
| `--font-size-2xs` | 12px | 1.4 | 500 | Caption, badge, timestamp |

Weights: `--font-weight-regular: 400`, `--font-weight-medium: 500`, `--font-weight-semibold: 600`, `--font-weight-bold: 700`.

### 4.2 Quy tắc

- `text-primary` cho nội dung chính; `text-secondary` cho mô tả; `text-muted` cho phụ chú/timestamp.
- Table cell mặc định `13px`; header bảng `13px/600`.
- Badge/label `12px/500`.
- Không dưới `12px` cho text UI.

---

## 5. Spacing scale (hệ số 4px)

| Token | Giá trị |
|-------|---------|
| `--space-0` | 0 |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

**Quy ước sử dụng:**
- Gap giữa các block chính trong page: `space-6` (24px).
- Padding card: `space-5` (20px) hoặc `space-6` (24px).
- Gap giữa label và input: `space-2`; giữa form field: `space-4`.
- Gap icon → text trong button/menu: `space-2`.
- Không dùng giá trị spacing nằm ngoài scale.

---

## 6. Border radius

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--radius-sm` | 6px | Input, select, small elements |
| `--radius-md` | 8px | Button, badge, small card |
| `--radius-lg` | 10px | Card, modal, page container |
| `--radius-xl` | 12px | Large card, large dropdown |
| `--radius-full` | 999px | Avatar, pill, dot |

---

## 7. Shadows

Shadow mặc định cho card/surface là **không có** (chỉ border). Shadow chỉ dùng cho layer nổi.

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--shadow-sm` | `0 1px 2px 0 rgba(15,23,42,0.05)` | Subtle lift |
| `--shadow-md` | `0 1px 3px 0 rgba(15,23,42,0.08), 0 1px 2px 0 rgba(15,23,42,0.04)` | Hover elevated element |
| `--shadow-lg` | `0 4px 6px -2px rgba(15,23,42,0.06), 0 2px 4px -2px rgba(15,23,42,0.04)` | Dropdown, popover |
| `--shadow-modal` | `0 20px 25px -5px rgba(15,23,42,0.15), 0 8px 10px -6px rgba(15,23,42,0.08)` | Modal |

**Luật:** card thường → border thay shadow. Không đổ shadow lên shadow (card lồng card bị cấm).

---

## 8. Breakpoints & layout

### 8.1 Breakpoints

| Token | Giá trị | Phạm vi |
|-------|---------|---------|
| `--breakpoint-sm` | 640px | ≥ 640px |
| `--breakpoint-md` | 768px | ≥ 768px |
| `--breakpoint-lg` | 1024px | ≥ 1024px |
| `--breakpoint-xl` | 1280px | ≥ 1280px |
| `--breakpoint-2xl` | 1536px | ≥ 1536px |

**Phân loại thiết bị:**
- Mobile: `< 640px`
- Tablet: `640px – 1023px`
- Desktop: `≥ 1024px`

### 8.2 Layout dimensions

| Token | Giá trị |
|-------|---------|
| `--layout-sidebar-width` | 260px |
| `--layout-sidebar-collapsed-width` | 72px |
| `--layout-topbar-height` | 64px |
| `--layout-content-max-width` | 1440px |
| `--layout-content-padding` | 24px (desktop) / 16px (mobile) |
| `--layout-gap` | 24px |

### 8.3 Responsive rules

| Hạng mục | Mobile (<640) | Tablet (640–1023) | Desktop (≥1024) |
|----------|---------------|-------------------|-----------------|
| Sidebar | Ẩn — mở qua **drawer** (280px) + overlay | Thu gọn thành **icon rail** (72px) hoặc drawer theo lựa chọn UX | Full **260px**, sticky |
| Topbar | Nút hamburger + page context | Nút hamburger + page context | Page context + breadcrumb (nếu có) |
| Content padding | 16px | 24px | 24px |
| Table | Horizontal scroll container | Horizontal scroll nếu cần | Full width |
| Form grid | 1 cột | 1 cột | 2 cột khi form dài |
| Stats grid | 1 cột | 2 cột | 4 cột (đúng số lượng thực tế) |

### 8.4 Mobile drawer

- Overlay nửa trong suốt (`rgba(15,23,42,0.4)`), click overlay đóng.
- Drawer trượt từ trái, width 280px, có nút đóng, ESC đóng, focus trap.
- Body khóa scroll khi mở.

---

## 9. App shell

```
┌───────────────┬──────────────────────────────────────┐
│  Sidebar      │  Topbar (64px, sticky)               │
│  (260px)      ├──────────────────────────────────────┤
│  Navigation   │  Main Content                        │
│  (grouped)    │  max-width 1440px, padding 24/16px   │
│               │                                      │
└───────────────┴──────────────────────────────────────┘
```

### 9.1 Sidebar

- Nền: `--color-bg-surface`; border phải `--color-border`.
- **Brand** đầu sidebar: logo (icon + "English Center" text). Collapsed → chỉ logo.
- **Navigation grouped** theo section; mỗi group có label (12px/500/muted).
- **Item:** icon trái 20px + label 14px/500; padding `space-2 space-3`; radius `--radius-md`.
  - Hover: nền `--color-bg-subtle`.
  - **Active:** nền `--color-primary-50`, text `--color-primary-700`, icon `--color-primary-700` (không dùng sidebar tối màu).
  - Disabled (chưa có ở bước này): text `--color-text-disabled`.
- Collapsed: chỉ icon, giữa, tooltip (native title hoặc custom).
- Footer: user block thu gọn (avatar + tên + logout).

### 9.2 Topbar

- Cao `64px`, sticky top, nền `--color-bg-surface`, border dưới `--color-border`.
- Trái: nút hamburger (mobile/tablet), page context (page title hiện tại / breadcrumb).
- Phải: **notification entry** (bell icon + unread count badge), **user/profile entry** (avatar + tên role → dropdown: profile, logout).
- Height cố định, không dùng `<header>` lồng card.

### 9.3 Main content

- Nền `--color-bg-canvas`.
- Container max `1440px`, căn giữa, padding theo responsive.
- Dùng `PageHeader` ở đầu mỗi page (title + description + actions).
- Không wrap nội dung trong card "lồng nhau" không cần thiết.

---

## 10. Navigation theo role

Cấu hình menu theo config object (role → groups → items), render chung một component. Mỗi item: `{ label, path, icon, roles }`.

### 10.1 ADMIN (`/admin`)

| Group | Item | Path |
|-------|------|------|
| — | Dashboard | `/admin/dashboard` |
| Quản lý | Học viên | `/admin/students` |
| Quản lý | Giáo viên | `/admin/teachers` |
| Quản lý | Khóa học | `/admin/courses` |
| Quản lý | Lớp học | `/admin/classes` |
| Quản lý | Đăng ký | `/admin/registrations` |
| Quản lý | Thanh toán | `/admin/transactions` |
| Học tập | Điểm danh | `/admin/attendance` |
| Học tập | Bảng điểm | `/admin/scores` |
| Truyền thông | Thông báo | `/admin/notifications` |
| Hệ thống | AI Assistant *(coming)* | `/admin/ai-chat` |
| Hệ thống | Audit Log *(coming)* | `/admin/audit-logs` |
| Hệ thống | Cài đặt *(coming)* | `/admin/settings` |

### 10.2 TEACHER (`/teacher`)

| Group | Item | Path |
|-------|------|------|
| — | Dashboard | `/teacher/dashboard` |
| Lớp học | Lớp của tôi | `/teacher/classes` |
| Lớp học | Lịch dạy | `/teacher/schedule` |
| Lớp học | Điểm danh | `/teacher/attendance` |
| Lớp học | Bảng điểm | `/teacher/scores` |
| Thông tin | Thông báo | `/teacher/notifications` |

### 10.3 STUDENT (`/student`)

| Group | Item | Path |
|-------|------|------|
| — | Dashboard | `/student/dashboard` |
| Học tập | Khóa học của tôi | `/student/courses` |
| Học tập | Lịch học | `/student/schedule` |
| Học tập | Bảng điểm | `/student/scores` |
| Học tập | Đăng ký | `/student/registrations` |
| Thông tin | Thông báo | `/student/notifications` |

> Trong Step 18.1 chỉ tạo **foundation** (sidebar + routing trống + placeholder). Các item đánh dấu *(coming)* disabled.

---

## 11. Components spec

### 11.1 Button

- Kích thước: `sm` (32px), `md` (36px), `lg` (40px).
- Variant:
  - `primary` — nền `--color-primary-600`, text trắng; hover `--color-primary-700`; active `--color-primary-800`.
  - `secondary` — nền trắng, border `--color-border-strong`, text `--color-text-primary`; hover nền `--color-bg-subtle`.
  - `ghost` — trong suốt, text `--color-text-secondary`; hover nền `--color-bg-subtle`.
  - `danger` — nền `--color-danger-600`, text trắng; hover `--color-danger-700`.
- Trạng thái: disabled (opacity 0.5, no pointer), loading (spinner nhỏ thay icon/trước label).
- Icon trái/trái label, gap `space-2`. Radius `--radius-md`. Font `14px/500`.
- Focus: `--color-focus-ring`.

### 11.2 Input & Select

- Cao `36px` (md), padding `space-2 space-3`, border `--color-border-strong`, radius `--radius-sm`, nền trắng.
- Label phía trên (`13px/500`), hint `12px/muted`, error `12px/danger`.
- **Error state:** border `--color-danger-500`, text `--color-danger-600`.
- Focus: border `--color-primary-500` + ring `--color-focus-ring`.
- Disabled: nền `--color-bg-subtle`, text `--color-text-disabled`.
- Hỗ trợ prefix/suffix icon (tiền tệ, mắt mật khẩu...).
- Select: cùng style; chevron icon bên phải.

### 11.3 Badge

- Pill, `--radius-full`, `12px/500`, padding `2px 8px`, line-height cố định.
- Tones: `neutral`, `primary`, `success`, `warning`, `danger`.
- Nền tone nhạt (`*-50`/`*-100`), text tone đậm (`*-700`), border tone nhạt hơn. Ví dụ success: nền `--color-success-50`, text `--color-success-700`, border `--color-success-500`/20%.
- Tùy chọn chấm tròn (dot) 6px cùng màu text trước label (dùng cho trạng thái trực quan).
- **Status phải dùng Badge** — theo bảng ánh xạ mục 3.5.

### 11.4 Avatar

- Radius full. Fallback: initials (lấy 2 chữ cái đầu họ tên), nền `--color-primary-100`, text `--color-primary-700`.
- Sizes: `sm` 24px, `md` 32px, `lg` 40px.
- Hỗ trợ `avatar_url` (image cover) + fallback nếu load lỗi.
- Tùy chọn status dot (nhỏ, góc phải) dùng cho presence/online nếu sau này cần.

### 11.5 Card

- Nền `--color-bg-surface`, border `--color-border`, radius `--radius-lg`, **không shadow mặc định**.
- Padding `space-5` hoặc `space-6`.
- Tiêu đề card: `--font-size-lg/600`; mô tả `--font-size-xs/muted`.
- Chỉ lồng card khi thực sự cần (cấm card lồng card không lý do).
- Không dùng gradient, không background pattern.

### 11.6 PageHeader

- Trái: title (`--font-size-2xl/700`) + description (`--font-size-sm/secondary`).
- Phải: actions (buttons) align phải.
- Ngăn cách với content bằng `space-6`.

### 11.7 Modal / Dialog

- Overlay `rgba(15,23,42,0.4)`; panel giữa, nền trắng, radius `--radius-lg`, shadow `--shadow-modal`.
- Width: `sm` 400px, `md` 560px, `lg` 720px; max-height 90vh, scroll trong.
- Header: title `--font-size-lg/600` + nút close (ghost icon). Body: content. Footer: actions align phải.
- Bắt buộc: ESC đóng, click overlay đóng, focus trap, aria-label, role="dialog".
- Hành động destructive trong modal bắt buộc xác nhận.

### 11.8 Loading

- `Spinner`: ring SVG quay (24px, border 2px, `--color-primary-600`).
- `Button loading`: spinner nhỏ trong button, disable.
- `Skeleton`: block nền `--color-bg-subtle`, radius `--radius-sm`, pulse nhẹ (opacity 0.6→1) — dùng cho placeholder nội dung.

### 11.9 EmptyState

- Icon muted (40px) hoặc không icon. Title `--font-size-lg/600`, description `--font-size-sm/muted`, action optional.
- Căn giữa, padding `space-12`. Text: "Chưa có dữ liệu" + hướng dẫn hành động cụ thể.

### 11.10 ErrorState

- Icon danger muted. Title "Không thể tải dữ liệu", message lỗi `--font-size-sm`, nút "Thử lại".
- Không hiện raw exception; dùng message thân thiện + mã lỗi.

---

## 12. Tables

- Container: `overflow-x auto` cho mobile; thêm border `--color-border`, radius `--radius-lg`, nền trắng.
- Header: nền `--color-bg-subtle`, text `13px/600/secondary`, text-align theo cột (số → right).
- Cell: `13px`, padding `space-3 space-4`, border dưới `--color-border` (chỉ border giữa hàng).
- Row hover: nền `--color-bg-subtle`/50%.
- Cột action: icon buttons (ghost) align phải; destructive đỏ khi hover.
- Số tiền/điểm: right-align, `tabular-nums`.
- Status column: dùng Badge (mục 3.5).
- Không dùng zebra striping; phân cách bằng border nhẹ.

---

## 13. Forms

- Một cột trên mobile; 2 cột từ `--breakpoint-md` cho form dài (grid gap `space-4`).
- Label luôn hiển thị (không placeholder-only).
- Error message ngay dưới field + border đỏ trên field.
- Submit primary align phải; destructive có bước xác nhận.
- Validation hiển thị sau submit hoặc on-blur.

---

## 14. Icons

- Một bộ duy nhất, stroke 24px, line 2, sử dụng thống nhất toàn bộ app (vd. Lucide).
- Kích thước icon chuẩn: 16px (inline/nhỏ), 20px (menu), 24px (empty state).
- Icon không mang màu riêng — kế thừa `currentColor`.
- **Cấm emoji làm icon UI chính.**
- Cấm trộn icon giữa các bộ/library khác nhau.

---

## 15. UX principles

1. Mỗi view có đúng **một hành động chính** (primary button).
2. Hành động phá hủy (delete, reject, cancel) phải qua **confirmation**.
3. Mọi thao tác bất đồng bộ phải có **loading state**; mọi lỗi phải có **error state** với hướng xử lý.
4. Trạng thái luôn dùng **Badge chuẩn hóa**, không bôi màu text tùy ý.
5. Text ngắn, hành động mô tả đúng kết quả ("Lưu", "Xóa", "Xác nhận").
6. Nhất quán giữa Admin/Teacher/Student — chỉ khác menu và dữ liệu.
7. Không fake data trên UI production; placeholder page dùng nội dung trung thực.

---

## 16. Accessibility

- Mọi control có label (visible hoặc aria-label).
- Focus ring hiển thị khi keyboard (`:focus-visible`), không tắt outline.
- Contrast ≥ AA cho text (secondary `#475569` on trắng ~ 7.9:1).
- Modal: focus trap + ESC + `aria-modal`.
- Drawer: focus trap + ESC + overlay click.
- Button/menu/select operable bằng bàn phím.
- Không chỉ dùng màu để truyền đạt trạng thái — Badge có cả text.
- Tôn trọng `prefers-reduced-motion` (tắt animation không cần thiết).

---

## 17. Do / Don't

**Do:**
- Dùng token cho mọi giá trị visual.
- Ít màu, nhiều khoảng trắng, hierarchy rõ.
- Component reusable, một nguồn icon.

**Don't:**
- Không gradient background (trừ gradient cực nhỏ cho hover nếu thực sự cần — ưu tiên solid).
- Không glassmorphism, không blur nền.
- Không neon/glow.
- Không shadow nặng, không card lồng card.
- Không quá 1 màu primary + semantic cho toàn app.
- Không emoji làm icon UI chính.
- Không fake statistic cards / fake dashboard data.
- Không animation phức tạp (respect reduced-motion).
- Không magic value — tất cả qua token.

---

## 18. Cấu trúc thư mục frontend (tham chiếu Step 18.1)

```
frontend/
├── src/
│   ├── assets/            # fonts, images, static
│   ├── components/        # UI primitives (Button, Input, ...)
│   ├── layouts/           # AppShell, AuthLayout
│   ├── features/          # modules theo domain (auth, dashboard, ...)
│   ├── hooks/             # useAuth, useResponsive, ...
│   ├── pages/             # route-level pages
│   ├── routes/            # route config + guards
│   ├── services/          # api client + api modules
│   ├── styles/            # tokens, global, css variables
│   ├── types/             # shared TS types
│   └── utils/             # format, cn, ...
```

> Chi tiết triển khai từng file nằm ở Step 18.1. File này chỉ chốt **visual & behavior**, không thay thế code.
