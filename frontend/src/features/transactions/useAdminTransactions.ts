import { useCallback, useEffect, useMemo, useState } from 'react';
import { transactionsApi } from '@/services/api/transactionsApi';
import type { Transaction, TransactionStatus } from '@/types/transaction';

export type TransactionStatusFilter = 'ALL' | TransactionStatus;

type TransactionsStatus = 'loading' | 'error' | 'success';

export function useAdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatusFilter>('PENDING_CONFIRMATION');
  const [status, setStatus] = useState<TransactionsStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      // Backend findAll chỉ áp dụng đúng 1 filter query (ưu tiên
      // studentId > registrationId > status) nên S09 load toàn bộ một lần
      // và kết hợp status/search hoàn toàn ở client-side.
      const data = await transactionsApi.getTransactions();
      setTransactions(data);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Không thể tải danh sách giao dịch. Vui lòng thử lại.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return transactions.filter((transaction) => {
      if (statusFilter !== 'ALL' && transaction.status !== statusFilter) return false;
      if (!keyword) return true;
      const haystack =
        `${transaction.transactionCode} ${transaction.studentName} ${transaction.className} ${transaction.courseName}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [transactions, search, statusFilter]);

  // Registration → PAID và mọi cập nhật liên quan do backend xử lý
  // (confirm gọi RegistrationService.markPaid). FE không tự cập nhật
  // registration/headcount — luôn reload server state.
  const confirmTransaction = useCallback(
    async (id: number) => {
      await transactionsApi.confirmTransaction(id);
      await load();
    },
    [load],
  );

  const rejectTransaction = useCallback(
    async (id: number) => {
      await transactionsApi.rejectTransaction(id);
      await load();
    },
    [load],
  );

  return {
    transactions,
    visibleTransactions,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    status,
    error,
    reload: load,
    confirmTransaction,
    rejectTransaction,
  };
}
