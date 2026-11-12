# Credi FE + ACSS Backend

Frontend: `D:\Python\CNTT\fe`
Backend: `D:\Python\CNTT\be`

## Chạy local

Cài dependencies (lần đầu): chạy `npm install` ở mỗi thư mục FE và BE.

Từ thư mục FE, chạy:

```sh
npm run local
```

Hoặc chạy riêng `npm start` trong BE và `npm run dev` trong FE.

- Giao diện: http://127.0.0.1:5173/
- Backend API: http://127.0.0.1:3000/api
- Người dùng local: `user1 / 123`.
- Quản trị viên local: `admin / 123`.

Vite proxy chuyển `/api` từ cổng 5173 đến 3000. Mở giao diện qua Vite dev/preview; thư mục dist cần reverse proxy /api nếu triển khai sang môi trường khác.

## API được sử dụng

| Chức năng | API |
| --- | --- |
| Đăng nhập | POST /api/login — username, password |
| Gửi hồ sơ | POST /api/applications — Authorization: Bearer token |
| Danh sách quản trị | GET /api/applications — ADMIN |
| Phê duyệt / từ chối | PUT /api/applications/:id/status — APPROVED hoặc REJECTED |

FE đổi spending thành expenses và gửi GPA, thu nhập, chi tiêu, số hoạt động ở dạng số.
Điểm hiển thị lấy trực tiếp creditScore từ BE. Thuật toán hiện tại cho 300–470 điểm; FE không tự tính điểm hoặc tự suy diễn mức rủi ro.

Đăng nhập lấy vai trò từ API. Token nằm trong sessionStorage, giữ qua tải lại trang trong cùng phiên tab; đăng xuất xoá token. Không dùng tài khoản mô phỏng hay nút tự đổi quyền. Đăng ký chưa được BE hỗ trợ.

## Giới hạn API hiện tại

- GET /applications chỉ dành cho admin và chỉ trả id, username, credit_score, status. API không có ngày nộp, hạn mức, nội dung hồ sơ hoặc API xem chi tiết. FE ghi rõ các trường chưa được cung cấp.
- Chưa có GET lịch sử cá nhân. FE lưu biên nhận sau khi POST thành công theo user ID trong localStorage. Chỉ gồm hồ sơ đã gửi qua trình duyệt này; trạng thái là trạng thái lúc gửi, không tự đồng bộ kết quả admin xét duyệt.
- Mốc ngày trong biên nhận lấy từ đồng hồ trình duyệt, không phải thời gian do BE trả về.
- Hạn mức trên biên nhận là số tiền người dùng đề xuất, không phải hạn mức được BE tính hoặc phê duyệt.
- Nếu không lưu được biên nhận cục bộ, FE vẫn báo gửi thành công khi BE đã nhận; không tự gửi lại để tránh trùng hồ sơ.
- Khi API lỗi, FE hiển thị thông báo và cho thử lại, không chèn dữ liệu mẫu.

Đây là môi trường phát triển local, dùng tài khoản và dữ liệu thử. Cơ chế mật khẩu, JWT secret và dependencies của BE được giữ nguyên theo nhánh đã lấy về; chưa đánh giá là cấu hình production.

## Kiểm tra

`npm run build` kiểm tra TypeScript và tạo bản production.
Đã kiểm tra đăng nhập đúng/sai, gửi hồ sơ nhận điểm từ BE, tải lại biên nhận, admin lấy danh sách và cập nhật trạng thái rồi tải lại từ máy chủ.

Giao diện giữ nền xanh non–trắng, kính trong mờ, điều hướng trái, theme sáng/tối và chuyển động jelly. Không lưu ảnh preview vào mã FE.
