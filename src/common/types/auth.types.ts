// JWT payload
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  username: string;
}

// authenticated data of user attached on req
export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
}

// response after login / signup
export interface TokenResponse {
  accessToken: string;
  expiresIn: string;
  tokenType: string;
}
