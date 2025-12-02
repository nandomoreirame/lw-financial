export interface LoginRequest {
  username: string;
  pass: string;
}

export interface LoginResponse {
  token: string;
}

export interface ErrorResponse {
  error: string;
}
