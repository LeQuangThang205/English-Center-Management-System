/**
 * FE-only validation: lý do từ chối là bắt buộc theo UC-24 (BR-04).
 * Backend hiện cho phép `reason` nullable — đây là yêu cầu hiển thị
 * của FE, không tuyên bố backend enforce.
 */
export function validateRejectReason(reason: string): string | null {
  if (reason.trim().length === 0) {
    return 'Vui lòng nhập lý do từ chối.';
  }
  return null;
}
