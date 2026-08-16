/**
 * Envelope chuẩn của backend: `{ success, data, message, timestamp }`.
 * Xem `backend/.../dto/response/ApiResponse.java`.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp?: string;
}
