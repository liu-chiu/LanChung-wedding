# Thiết lập Google Sheets cho RSVP và lời chúc

Backend dùng Google Apps Script để ghi phản hồi vào Google Sheets. Thực hiện các bước sau bằng tài khoản Google sở hữu bảng tính.

## 1. Tạo bảng tính và Apps Script

1. Tạo Google Sheet mới.
2. Chọn **Extensions > Apps Script**.
3. Thay mã mặc định bằng toàn bộ nội dung trong `google-apps-script/Code.gs`.
4. Trong **Project Settings**, đặt múi giờ `Asia/Ho_Chi_Minh`.
5. Chạy `setupWeddingSheets` một lần và cấp quyền. Script tạo hai sheet với tiêu đề:

   - `RSVP`: `Submission ID`, `Timestamp`, `Name`, `Guests`, `Event`, `Attendance`, `Phone`, `Message`, `Transportation`.
   - `Wishes`: `Submission ID`, `Timestamp`, `Name`, `Wish`, `Status`.

Không đổi tên sheet hoặc thứ tự cột. `setupWeddingSheets` sẽ thêm tiêu đề `Transportation` ở cột cuối của sheet RSVP hiện có. Khi sửa Apps Script, hãy triển khai phiên bản mới để website dùng mã mới.

## 2. Triển khai Web App và cấu hình website

1. Chọn **Deploy > New deployment > Web app**.
2. Chọn **Execute as: Me**. Cấu hình quyền truy cập để khách mời có thể gửi yêu cầu; việc cho phép truy cập công khai cũng cho phép người dùng Internet gọi các thao tác API của script.
3. Triển khai, cấp quyền theo yêu cầu và sao chép URL `/exec`.
4. Đặt URL đó làm `apiUrl` trong `config.js`. Có thể thay `siteUrl` bằng URL website thật; hiện thuộc tính này chưa được dùng trong mã ứng dụng.
5. Triển khai lại website nếu cần để tải cấu hình mới.

## 3. Cách gửi và xác minh dữ liệu

Frontend gửi dữ liệu kèm `Submission ID`, sau đó truy vấn trạng thái nhiều lần. Trang chỉ báo lưu thành công khi Apps Script tìm thấy ID trong một trong hai sheet. Nếu không xác minh được, biểu mẫu báo lỗi thay vì hiển thị thành công.

Các trường RSVP được lưu gồm tên, số khách, sự kiện, trạng thái tham dự, phương tiện di chuyển, số điện thoại và lời nhắn. Apps Script giới hạn độ dài các trường và số khách trong phạm vi 1–20.

## 4. Duyệt lời chúc

- Lời chúc mới được lưu với `Status = Pending`.
- Đổi trạng thái thành `Approved` để đưa lời chúc vào danh sách tải về website.
- Các trạng thái khác, ví dụ `Hidden`, không được hiển thị.
- Website tải tối đa 50 lời chúc đã duyệt.
- Sau khi gửi, lời chúc mới chỉ hiển thị trong phiên của người gửi; sau khi tải lại trang, chỉ lời chúc đã duyệt được tải từ Sheet.

## 5. Kiểm tra

- Xác nhận trạng thái backend trên phần RSVP báo đã kết nối.
- Gửi RSVP thử và kiểm tra dòng mới trong `RSVP` cùng mã xác nhận trên trang.
- Gửi lời chúc thử, xác nhận trạng thái `Pending`, đổi sang `Approved`, rồi tải lại website để kiểm tra.

Google Apps Script và Sheets có giới hạn quota. Không dùng bảng tính này để lưu mật khẩu, OTP, thông tin thanh toán hoặc dữ liệu nhạy cảm khác.

Web App cho phép khách truy cập công khai gửi dữ liệu. Theo dõi các lần gửi bất thường và cân nhắc bổ sung giới hạn tần suất hoặc CAPTCHA nếu endpoint bị spam.
