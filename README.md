# Thiệp cưới Lan & Chung | 12.12.2026 (Luxury Edition)

Website thiệp cưới online cao cấp dành cho cặp đôi **Bùi Ngọc Lan & Nguyễn Văn Chung**, ngày cưới 12.12.2026. 
Trang sử dụng 100% HTML5, CSS3 và JavaScript ES6 thuần; không phụ thuộc thư viện nặng; RSVP và lời chúc được kết nối trực tiếp vào Google Sheets qua Google Apps Script.

## 🌟 Các tính năng nổi bật (Bản Luxury)

- **Mở phong bì thư hoàng gia & Con dấu sáp L & C:** Trải nghiệm chạm vào con dấu sáp dập nổi, nắp phong bì mở ra theo không gian 3D và lá thiệp mời trượt lên cùng nhạc nền được phát ngẫu nhiên từ danh sách bài hát.
- **Cá nhân hóa thiệp mời (`?to=...`):** In tên từng vị khách lên lá thiệp, trong lời mời và tự động điền sẵn Form RSVP / Lời chúc.
- **Thiệp cưới hai mặt xoay 3D:** Mở chế độ xem để lật, kéo xoay và phóng to thiệp; mặt sau trình bày lịch trình cùng địa chỉ chi tiết của hai buổi tiệc. Mặt sau phong bì và mặt sau 3D dùng chung họa tiết cover-floral.svg.
- **Công cụ tạo link mời khách (Link Generator):** Nút *"💌 Tạo link khách"* ở cuối trang giúp cô dâu chú rể gõ tên khách và sao chép đường link đã mã hóa gửi qua Zalo / Facebook chỉ trong 1 giây.
- **Hiệu ứng Cánh hoa rơi Canvas:** Cánh hoa pastel rơi nhẹ nhàng 60fps, có thể rê chuột hoặc chạm và rê để bắt cánh hoa, cùng nút bật/tắt `🌸`.
- **Album ảnh cưới Touch / Swipe Lightbox:** Ảnh được nén tối ưu và tải trễ; hỗ trợ vuốt tay chuyển ảnh trên điện thoại, nút Previous / Next, đếm số ảnh `1 / 9`, phím mũi tên trên máy tính.
- **Tương thích 100% Zalo / Messenger In-App WebView:** Cơ chế sao chép clipboard kép (hỗ trợ cả khi Zalo chặn quyền), chống lỗi đổi màu số tài khoản trên iOS, bộ thẻ OpenGraph chuẩn 1200x630px.
- **RSVP & Sổ lưu bút thời gian thực:** Kết nối Google Sheets, xác thực gửi tin cậy ngay cả trên mạng 3G/4G chập chờn.
- **Mừng cưới VietQR & Lưu sự kiện lịch:** Sao chép số tài khoản 1 chạm, file `.ics` lịch sự kiện cho cả 2 buổi tiệc.

Các bản ảnh `*-optimized.jpg` dùng cho website để giảm dung lượng tải; ảnh gốc vẫn được giữ nguyên trong `assets/images`.

---

## 🚀 Hướng dẫn chạy thử

Mở terminal tại thư mục này và chạy:

```bash
python -m http.server 8000
```

Sau đó mở trình duyệt tại:
- Xem bản mặc định: `http://localhost:8000/`
- Thử nghiệm thiệp cá nhân hóa: `http://localhost:8000/?to=Anh+Tuấn+&+Chị+Linh&side=groom`
- Để thử trên điện thoại cùng Wi-Fi: Chạy với `--bind 0.0.0.0`, lấy IP máy tính (VD: `http://192.168.1.5:8000/?to=Bạn+Thảo`).

---

## 💌 Hướng dẫn tạo link mời cá nhân hóa

1. **Cách 1 (Dùng công cụ trên web):**
   - Kéo xuống chân trang (Footer), bấm nút **"💌 Tạo link khách"**.
   - Nhập tên khách mời (VD: `Anh Hùng & Chị Mai`), chọn tiệc mời (Nhà gái / Nhà trai / Cả hai).
   - Bấm **"Sao chép link gửi khách"** và dán gửi qua tin nhắn Zalo/Facebook/SMS!

2. **Cách 2 (Gắn trực tiếp vào URL):**
   - Thêm `?to=Tên+Khách+Mời` vào đuôi link website.
   - Thêm `&side=bride` (Tiệc nhà gái) hoặc `&side=groom` (Tiệc nhà trai).
   - Ví dụ: `https://liu-chiu.github.io/LanChung-wedding/?to=Gia+đình+Bác+Ba&side=bride`

---

## ⚙️ Cấu hình và triển khai chính thức

1. Làm theo [GOOGLE-SHEETS-SETUP.md](./GOOGLE-SHEETS-SETUP.md) để kết nối Google Apps Script.
2. Cập nhật `apiUrl` và `siteUrl` trong `config.js`.
3. Các thẻ `canonical`, `og:url`, `og:image` trong `index.html` và `siteUrl` trong `config.js` đang dùng địa chỉ triển khai `https://liu-chiu.github.io/LanChung-wedding/`.
4. Tải toàn bộ thư mục lên hosting tĩnh (Netlify, Vercel, Cloudflare Pages, GitHub Pages).
