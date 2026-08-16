export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PAID';

export interface Registration {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  courseName: string;
  status: RegistrationStatus;
  tuitionAtRegistration: number;
  registeredAt?: string | null;
  approvedAt?: string | null;
  approvedById?: number | null;
  approvedByName?: string | null;
  rejectedAt?: string | null;
  rejectedById?: number | null;
  rejectedByName?: string | null;
  rejectionReason?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
