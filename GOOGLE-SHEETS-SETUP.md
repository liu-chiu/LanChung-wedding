# Thiết lập Google Sheets cho RSVP và lời chúc

Backend dùng Google Apps Script để ghi phản hồi vào Google Sheets. Thực hiện các bước sau bằng tài khoản Google sở hữu bảng tính.

## 1. Tạo bảng tính và Apps Script

1. Tạo Google Sheet mới.
2. Chọn **Extensions > Apps Script**.
3. Thay mã mặc định bằng toàn bộ nội dung trong `google-apps-script/Code.gs`.
4. Trong **Project Settings**, đặt múi giờ `Asia/Ho_Chi_Minh`.
5. Chạy `setupWeddingSheets` một lần và cấp quyền. Script tạo ba sheet với tiêu đề:

   - `RSVP`: `Submission ID`, `Timestamp`, `Name`, `Guests`, `Event`, `Attendance`, `Phone`, `Message`, `Transportation`.
   - `Wishes`: `Submission ID`, `Timestamp`, `Name`, `Wish`, `Status`.
   - `Visits`: `Visit ID`, `Timestamp`, `Guest Name`, `Referrer`, `Page URL`, `User Agent`, `Language`, `Screen`, `Invited By`.

Không đổi tên sheet hoặc thứ tự cột. `setupWeddingSheets` sẽ thêm tiêu đề `Transportation` ở cột cuối của sheet RSVP hiện có. Khi sửa Apps Script, hãy triển khai phiên bản mới để website dùng mã mới.

Các request của website không tự chạy `setupWeddingSheets`; việc tạo sheet và định dạng tiêu đề chỉ thực hiện khi bạn chủ động chạy hàm này. Điều đó tránh ghi/định dạng lại bảng tính cho mỗi khách truy cập.

Nếu sheet `Visits` đã được tạo trước đây, hãy chạy lại `setupWeddingSheets` một lần để thêm tiêu đề cột `Invited By`.

## 2. Triển khai Web App và cấu hình website

1. Chọn **Deploy > New deployment > Web app**.
2. Chọn **Execute as: Me**. Cấu hình quyền truy cập để khách mời có thể gửi yêu cầu; việc cho phép truy cập công khai cũng cho phép người dùng Internet gọi các thao tác API của script. Endpoint thống kê lượt truy cập chỉ trả tổng số, không trả ID, tên hay thời gian của khách.
3. Triển khai, cấp quyền theo yêu cầu và sao chép URL `/exec`.
4. Đặt URL đó làm `apiUrl` trong `config.js`. Có thể thay `siteUrl` bằng URL website thật để link generator tạo liên kết cá nhân hóa đúng domain.
5. Triển khai lại website nếu cần để tải cấu hình mới.

## 3. Cách gửi và xác minh dữ liệu

Frontend gửi dữ liệu kèm `Submission ID`, sau đó truy vấn trạng thái nhiều lần. Trang chỉ báo lưu thành công khi Apps Script tìm thấy ID trong một trong hai sheet. Nếu không xác minh được, biểu mẫu báo lỗi thay vì hiển thị thành công. Với Visits, `Referrer` là URL do trình duyệt gửi và có thể trống khi khách mở link trực tiếp từ ứng dụng nhắn tin; `Invited By` lưu tên người tạo link kế tiếp qua tham số `from`.

Các trường RSVP được lưu gồm tên, số khách, sự kiện, trạng thái tham dự, phương tiện di chuyển, số điện thoại và lời nhắn. Apps Script giới hạn độ dài các trường và số khách trong phạm vi 1–20.

Trạng thái submission đã lưu được cache tối đa 6 giờ để xác minh nhanh; danh sách lời chúc đã duyệt được cache 60 giây. Vì vậy, lời chúc vừa được duyệt thủ công có thể mất tối đa một phút mới xuất hiện trên website. Apps Script/Google Sheets vẫn có hạn mức và tuần tự hóa thao tác ghi để tránh ghi trùng; nếu dự kiến có lượng truy cập đồng thời rất lớn, cần chuyển phần lưu RSVP sang backend cơ sở dữ liệu chuyên dụng.

## 4. Duyệt lời chúc

- Lời chúc mới được lưu với `Status = Pending`.
- Đổi trạng thái thành `Approved` để đưa lời chúc vào danh sách tải về website.
- Các trạng thái khác, ví dụ `Hidden`, không được hiển thị.
- Website tải tối đa 50 lời chúc đã duyệt.
- Sau khi gửi, lời chúc mới chỉ hiển thị trong phiên của người gửi; sau khi tải lại trang, chỉ lời chúc đã duyệt được tải từ Sheet.

## 5. Kiểm tra

- Xác nhận trạng thái backend trên phần RSVP báo đã kết nối.
- Gửi RSVP thử và kiểm tra dòng mới trong `RSVP` cùng thông báo gửi thành công trên trang.
- Gửi lời chúc thử, xác nhận trạng thái `Pending`, đổi sang `Approved`, rồi tải lại website để kiểm tra.

Google Apps Script và Sheets có giới hạn quota. Không dùng bảng tính này để lưu mật khẩu, OTP, thông tin thanh toán hoặc dữ liệu nhạy cảm khác.

Web App cho phép khách truy cập công khai gửi dữ liệu. Mã hiện có honeypot và giới hạn nhẹ 5 lần gửi cho mỗi danh tính chuẩn hóa trong 10 phút. Apps Script Web App không cung cấp IP người gọi cho mã này, nên lớp giới hạn đó không ngăn được bot cố tình đổi danh tính. Nếu endpoint bị spam, hãy bổ sung CAPTCHA được xác minh ở máy chủ hoặc chuyển sang backend có kiểm soát IP.
