import { useCallback, useEffect, useMemo, useState } from 'react';
import { classesApi } from '@/services/api/classesApi';
import { registrationsApi } from '@/services/api/registrationsApi';
import { transactionsApi } from '@/services/api/transactionsApi';
import { useAuth } from '@/features/auth/useAuth';
import type { CourseClass } from '@/types/courseClass';
import type { Registration } from '@/types/registration';
import type { Transaction } from '@/types/transaction';

type PageStatus = 'loading' | 'error' | 'success';

const ACTIVE_REGISTRATION_STATUSES: ReadonlySet<Registration['status']> = new Set([
  'PENDING',
  'APPROVED',
  'PAID',
]);

/**
 * Nhóm transactions theo registration. Backend cho phép nhiều transaction
 * cho cùng một registration (chỉ chặn khi đã có SUCCESS) nên không được
 * assume quan hệ 1-1.
 */
export function groupTransactionsByRegistration(
  transactions: Transaction[],
): Map<number, Transaction[]> {
  const grouped = new Map<number, Transaction[]>();
  for (const transaction of transactions) {
    const list = grouped.get(transaction.registrationId) ?? [];
    list.push(transaction);
    grouped.set(transaction.registrationId, list);
  }
  return grouped;
}

/**
 * Chọn transaction đại diện cho UI: SUCCESS được ưu tiên (terminal);
 * nếu chưa có SUCCESS thì lấy transaction mới nhất theo id.
 */
export function latestRelevantTransaction(transactions: Transaction[]): Transaction | null {
  if (transactions.length === 0) return null;
  const success = transactions.find((t) => t.status === 'SUCCESS');
  if (success) return success;
  return transactions.reduce((latest, current) => (current.id > latest.id ? current : latest));
}

export function useStudentRegistrations() {
  const { user } = useAuth();
  const studentId = user?.id;

  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<PageStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) {
      setStatus('error');
      setError('Không xác định được học viên. Vui lòng đăng nhập lại.');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      // Backend tự scope transactions theo student hiện tại; registrations
      // lọc theo own studentId; classes lấy toàn bộ rồi lọc client-side.
      const [classList, registrationList, transactionList] = await Promise.all([
        classesApi.getClasses(),
        registrationsApi.getRegistrations({ studentId }),
        transactionsApi.getTransactions(),
      ]);
      setClasses(classList);
      setRegistrations(registrationList);
      setTransactions(transactionList);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Không thể tải dữ liệu đăng ký. Vui lòng thử lại.');
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Backend cho đăng ký lớp UPCOMING và STUDYING (chỉ cấm FINISHED/CANCELLED).
  const enrollableClasses = useMemo(
    () => classes.filter((cls) => cls.status === 'UPCOMING' || cls.status === 'STUDYING'),
    [classes],
  );

  const activeRegistrationByClass = useMemo(() => {
    const map = new Map<number, Registration>();
    for (const registration of registrations) {
      if (ACTIVE_REGISTRATION_STATUSES.has(registration.status)) {
        map.set(registration.classId, registration);
      }
    }
    return map;
  }, [registrations]);

  const transactionsByRegistration = useMemo(
    () => groupTransactionsByRegistration(transactions),
    [transactions],
  );

  // Mọi mutation reload server state; FE không tự đổi state local.
  const createRegistration = useCallback(
    async (classId: number) => {
      if (!studentId) throw new Error('Không xác định được học viên. Vui lòng đăng nhập lại.');
      await registrationsApi.createRegistration({ studentId, classId });
      await load();
    },
    [load, studentId],
  );

  const cancelRegistration = useCallback(
    async (id: number) => {
      await registrationsApi.cancelRegistration(id);
      await load();
    },
    [load],
  );

  const createTransaction = useCallback(
    async (registrationId: number) => {
      await transactionsApi.createTransaction(registrationId);
      await load();
    },
    [load],
  );

  const reportPaid = useCallback(
    async (transactionId: number) => {
      await transactionsApi.reportPaidTransaction(transactionId);
      await load();
    },
    [load],
  );

  return {
    studentId,
    classes,
    enrollableClasses,
    registrations,
    transactions,
    activeRegistrationByClass,
    transactionsByRegistration,
    status,
    error,
    reload: load,
    createRegistration,
    cancelRegistration,
    createTransaction,
    reportPaid,
  };
}
