export type TransactionStatus = 'PENDING_CONFIRMATION' | 'SUCCESS' | 'FAILED';

export interface Transaction {
  id: number;
  registrationId: number;
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  courseName: string;
  amount: number;
  paymentMethod: string;
  transactionCode: string;
  status: TransactionStatus;
  createdAt?: string | null;
  paidAt?: string | null;
  confirmedAt?: string | null;
  confirmedById?: number | null;
  confirmedByName?: string | null;
  updatedAt?: string | null;
}
