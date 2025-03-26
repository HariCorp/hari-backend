export enum MongoErrorCode {
    DuplicateKey = 11000, // Lỗi trùng khóa duy nhất (E11000)
    NetworkError = 89, // Lỗi kết nối MongoDB
    Unauthorized = 13, // Không có quyền truy cập
    InvalidBSON = 10334, // BSON không hợp lệ
  }