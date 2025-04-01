export const AUTH_SERVICE = 'AUTH_SERVICE';

export interface IAuthService {
  validateRefreshToken(userId: string, refreshToken: string): Promise<boolean>;
} 