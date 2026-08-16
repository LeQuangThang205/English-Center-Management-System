import { http } from '@/services/api/httpClient';
import type { Transaction, TransactionStatus } from '@/types/transaction';

export interface TransactionsQuery {
  status?: TransactionStatus;
  studentId?: number;
  registrationId?: number;
}

export const transactionsApi = {
  getTransactions: (query?: TransactionsQuery) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.studentId != null) params.set('studentId', String(query.studentId));
    if (query?.registrationId != null) params.set('registrationId', String(query.registrationId));
    const qs = params.toString();
    return http.get<Transaction[]>(`/transactions${qs ? `?${qs}` : ''}`);
  },
};
