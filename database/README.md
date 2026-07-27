# database/

Thư mục chứa toàn bộ tài nguyên liên quan đến cơ sở dữ liệu của hệ thống **English Center Management System**.

## Cấu trúc thư mục

| Thư mục / File | Mục đích |
|----------------|----------|
| `schema.sql` | Định nghĩa cấu trúc toàn bộ cơ sở dữ liệu: CREATE TABLE, FOREIGN KEY, INDEX, CHECK, ENUM. |
| `seed.sql` | Dữ liệu mẫu phục vụ phát triển và kiểm thử (Admin, Teacher, Student, khóa học, lớp học, ...). |
| `migration/` | Các script cập nhật cấu trúc CSDL khi có thay đổi qua các phiên bản. |
| `backup/` | Bản sao lưu dữ liệu định kỳ. |
| `docs/` | Tài liệu thiết kế cơ sở dữ liệu: ERD, Physical Database Design, DDL Review. |
| `README.md` | File này — mô tả tổng quan thư mục database. |

## Quy tắc

- Tất cả tên bảng, tên cột, ràng buộc (constraint) đặt bằng tiếng Anh theo chuẩn `snake_case`.
- Mô tả nghiệp vụ, comment trong SQL viết bằng tiếng Việt.
- Mọi thay đổi cấu trúc CSDL phải được thực hiện qua migration, không sửa trực tiếp `schema.sql` sau khi đã chạy.
