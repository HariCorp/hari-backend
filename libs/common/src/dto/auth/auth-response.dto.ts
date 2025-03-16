// libs/common/src/dto/auth/auth-response.dto.ts
export class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // Thời gian hết hạn của access token (thường tính bằng giây)
    tokenType: string = 'Bearer';
  }
  