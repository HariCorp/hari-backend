# Hướng dẫn sử dụng API Review Service

## Cài đặt và chuẩn bị

### Biến môi trường Postman

Tạo một Environment trong Postman với các biến sau:

- `base_url`: http://localhost:3000/api
- `access_token`: JWT token của bạn sau khi đăng nhập

## Các API đánh giá sản phẩm

### 1. Tạo đánh giá mới

- **URL**: `{{base_url}}/reviews`
- **Method**: POST
- **Headers**:
  - Content-Type: application/json
  - Authorization: Bearer {{access_token}}
- **Body**:
```json
{
  "productId": "65f2a1b3c4d5e6f7g8h9i0j1",
  "rating": 5,
  "comment": "Sản phẩm rất tốt, đúng như mô tả. Giao hàng nhanh và đóng gói cẩn thận.",
  "title": "Rất hài lòng với sản phẩm"
}
```
- **Response thành công** (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "65f2a1b3c4d5e6f7g8h9i0j2",
    "productId": "65f2a1b3c4d5e6f7g8h9i0j1",
    "userId": "65f2a1b3c4d5e6f7g8h9i0j3",
    "rating": 5,
    "comment": "Sản phẩm rất tốt, đúng như mô tả. Giao hàng nhanh và đóng gói cẩn thận.",
    "title": "Rất hài lòng với sản phẩm",
    "createdAt": "2023-09-15T10:30:00.000Z",
    "updatedAt": "2023-09-15T10:30:00.000Z"
  },
  "message": "Tạo đánh giá thành công"
}
```

### 2. Lấy danh sách đánh giá

- **URL**: `{{base_url}}/reviews?page=1&limit=10&sortBy=createdAt&sortOrder=desc`
- **Method**: GET
- **Query Parameters**:
  - page: Số trang (mặc định: 1)
  - limit: Số lượng kết quả trên mỗi trang (mặc định: 10)
  - sortBy: Trường để sắp xếp (mặc định: createdAt)
  - sortOrder: Thứ tự sắp xếp - asc/desc (mặc định: desc)
  - rating: Lọc theo số sao đánh giá (tùy chọn)
  - userId: Lọc theo ID người dùng (tùy chọn)
  - productId: Lọc theo ID sản phẩm (tùy chọn)
- **Response thành công** (200 OK):
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "65f2a1b3c4d5e6f7g8h9i0j2",
        "productId": "65f2a1b3c4d5e6f7g8h9i0j1",
        "userId": "65f2a1b3c4d5e6f7g8h9i0j3",
        "rating": 5,
        "comment": "Sản phẩm rất tốt, đúng như mô tả. Giao hàng nhanh và đóng gói cẩn thận.",
        "title": "Rất hài lòng với sản phẩm",
        "createdAt": "2023-09-15T10:30:00.000Z",
        "updatedAt": "2023-09-15T10:30:00.000Z"
      },
      {
        "_id": "65f2a1b3c4d5e6f7g8h9i0j4",
        "productId": "65f2a1b3c4d5e6f7g8h9i0j5",
        "userId": "65f2a1b3c4d5e6f7g8h9i0j6",
        "rating": 4,
        "comment": "Sản phẩm tốt, nhưng giao hàng hơi chậm.",
        "title": "Sản phẩm chất lượng",
        "createdAt": "2023-09-14T15:45:00.000Z",
        "updatedAt": "2023-09-14T15:45:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 3. Lấy đánh giá theo ID sản phẩm

- **URL**: `{{base_url}}/reviews/product/65f2a1b3c4d5e6f7g8h9i0j1?page=1&limit=10&rating=5`
- **Method**: GET
- **Query Parameters**:
  - page: Số trang (mặc định: 1)
  - limit: Số lượng kết quả trên mỗi trang (mặc định: 10)
  - rating: Lọc theo số sao đánh giá (tùy chọn)
  - sortBy: Trường để sắp xếp (mặc định: createdAt)
  - sortOrder: Thứ tự sắp xếp - asc/desc (mặc định: desc)
- **Response thành công** (200 OK):
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "65f2a1b3c4d5e6f7g8h9i0j2",
        "productId": "65f2a1b3c4d5e6f7g8h9i0j1",
        "userId": "65f2a1b3c4d5e6f7g8h9i0j3",
        "rating": 5,
        "comment": "Sản phẩm rất tốt, đúng như mô tả. Giao hàng nhanh và đóng gói cẩn thận.",
        "title": "Rất hài lòng với sản phẩm",
        "createdAt": "2023-09-15T10:30:00.000Z",
        "updatedAt": "2023-09-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### 4. Lấy chi tiết một đánh giá

- **URL**: `{{base_url}}/reviews/65f2a1b3c4d5e6f7g8h9i0j2`
- **Method**: GET
- **Response thành công** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "65f2a1b3c4d5e6f7g8h9i0j2",
    "productId": "65f2a1b3c4d5e6f7g8h9i0j1",
    "userId": "65f2a1b3c4d5e6f7g8h9i0j3",
    "rating": 5,
    "comment": "Sản phẩm rất tốt, đúng như mô tả. Giao hàng nhanh và đóng gói cẩn thận.",
    "title": "Rất hài lòng với sản phẩm",
    "createdAt": "2023-09-15T10:30:00.000Z",
    "updatedAt": "2023-09-15T10:30:00.000Z"
  }
}
```

### 5. Cập nhật đánh giá

- **URL**: `{{base_url}}/reviews/65f2a1b3c4d5e6f7g8h9i0j2`
- **Method**: PUT
- **Headers**:
  - Content-Type: application/json
  - Authorization: Bearer {{access_token}}
- **Body**:
```json
{
  "rating": 4,
  "comment": "Sản phẩm khá tốt, nhưng có một vài chi tiết nhỏ chưa hoàn thiện.",
  "title": "Sản phẩm tốt"
}
```
- **Response thành công** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "65f2a1b3c4d5e6f7g8h9i0j2",
    "productId": "65f2a1b3c4d5e6f7g8h9i0j1",
    "userId": "65f2a1b3c4d5e6f7g8h9i0j3",
    "rating": 4,
    "comment": "Sản phẩm khá tốt, nhưng có một vài chi tiết nhỏ chưa hoàn thiện.",
    "title": "Sản phẩm tốt",
    "createdAt": "2023-09-15T10:30:00.000Z",
    "updatedAt": "2023-09-15T11:45:00.000Z"
  },
  "message": "Cập nhật đánh giá thành công"
}
```

### 6. Xóa đánh giá

- **URL**: `{{base_url}}/reviews/65f2a1b3c4d5e6f7g8h9i0j2`
- **Method**: DELETE
- **Headers**:
  - Authorization: Bearer {{access_token}}
- **Response thành công** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "65f2a1b3c4d5e6f7g8h9i0j2",
    "deleted": true
  },
  "message": "Xóa đánh giá thành công"
}
```

## Lưu ý quan trọng

1. Tất cả các API liên quan đến tạo, cập nhật và xóa đánh giá đều yêu cầu người dùng đã đăng nhập (JWT token).
2. Người dùng chỉ có thể cập nhật hoặc xóa đánh giá của chính mình.
3. Các ID trong ví dụ là ID mẫu, bạn cần thay thế bằng ID thực tế trong hệ thống của mình.
4. Đối với các API lấy danh sách, bạn có thể tùy chỉnh các tham số query để lọc và sắp xếp kết quả theo nhu cầu.
5. Tất cả các response đều được bọc trong cấu trúc chuẩn với các trường `success`, `data` và `message` (hoặc `error` nếu có lỗi).