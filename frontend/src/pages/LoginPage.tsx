import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { roleHomePath } from '@/routes/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { ApiError } from '@/services/api/httpClient';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? roleHomePath(user.role), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <span className={styles.logo}>
            <LogIn size={20} aria-hidden="true" />
          </span>
          <h1 className={styles.title}>Đăng nhập</h1>
          <p className={styles.subtitle}>English Center Management System</p>
        </div>

        <div className={styles.fields}>
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
          <Input
            type="password"
            label="Mật khẩu"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <Button type="submit" loading={submitting} className={styles.submit}>
          Đăng nhập
        </Button>
      </form>
    </div>
  );
}
