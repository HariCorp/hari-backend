# Hướng dẫn sử dụng Postman Collection cho Review API

## Giới thiệu

Tập tin Postman Collection này chứa các mẫu request để thao tác với API đánh giá sản phẩm. Collection được chia thành hai phần do giới hạn kích thước:

- `postman_collection_review_api.json`: Chứa các API tạo đánh giá, lấy danh sách đánh giá, lấy đánh giá theo sản phẩm, và lấy chi tiết đánh giá.
- `postman_collection_review_api_part2.json`: Chứa các API cập nhật và xóa đánh giá.

## Cách sử dụng

1. Mở Postman
2. Nhấp vào "Import" và chọn các tập tin JSON đã cung cấp
3. Tạo một Environment mới trong Postman và thêm biến `access_token` với giá trị là JWT token của bạn
4. Sử dụng các request đã được cấu hình sẵn

## Các API có sẵn

### 1. Tạo đánh giá mới (POST /api/reviews)
- Yêu cầu xác thực (JWT token)
- Body: productId, rating, comment, title (tùy chọn)

### 2. Lấy tất cả đánh giá (GET /api/reviews)
- Tham số query: page, limit, sortBy, sortOrder
- Không yêu cầu xác thực

### 3. Lấy đánh giá theo ID sản phẩm (GET /api/reviews/product/:productId)
- Tham số query: page, limit, rating
- Không yêu cầu xác thực

### 4. Lấy chi tiết một đánh giá (GET /api/reviews/:id)
- Không yêu cầu xác thực

### 5. Cập nhật đánh giá (PUT /api/reviews/:id)
- Yêu cầu xác thực (JWT token)
- Người dùng phải là chủ sở hữu của đánh giá
- Body: rating, comment, title (tất cả đều tùy chọn)

### 6. Xóa đánh giá (DELETE /api/reviews/:id)
- Yêu cầu xác thực (JWT token)
- Người dùng phải là chủ sở hữu của đánh giá

## Lưu ý

- Các ID trong collection là ID mẫu, bạn cần thay thế bằng ID thực tế trong hệ thống của bạn
- Đảm bảo đã đăng nhập và có JWT token hợp lệ cho các API yêu cầu xác thực
- Mỗi API đều có ví dụ về response thành công và thất bại để tham khảo