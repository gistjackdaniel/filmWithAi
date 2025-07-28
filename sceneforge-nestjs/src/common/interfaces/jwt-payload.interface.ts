export interface JwtPayload {
  userId: string;
  email: string;
  profileId: string;
  iat?: number;
  exp?: number;
} 