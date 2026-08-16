import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { roleHomePath } from '@/routes/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { validateLogin, type LoginFieldErrors } from '@/features/auth/loginValidation';
import { ApiError } from '@/services/api/httpClient';
import styles from './LoginPage.module.css';

function toFriendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Email hoặc mật khẩu không đúng.';
    if (err.status === 400) return 'Vui lòng kiểm tra lại thông tin đăng nhập.';
    if (err.status && err.status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
    return 'Đăng nhập thất bại. Vui lòng thử lại.';
  }
  if (err instanceof TypeError) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  }
  return 'Đăng nhập thất bại. Vui lòng thử lại.';
}

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const errors = validateLogin({ email, password });
    setFieldErrors(errors);
    setFormError(null);
    if (errors.email || errors.password) return;

    setSubmitting(true);
    try {
      const loggedInUser = await login({ email: email.trim(), password });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? roleHomePath(loggedInUser.role), { replace: true });
    } catch (err) {
      setFormError(toFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
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
            onChange={(event) => {
              setEmail(event.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            error={fieldErrors.email}
            required
            autoComplete="email"
            autoFocus
          />
          <Input
            type="password"
            label="Mật khẩu"
            placeholder="••••••••"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            error={fieldErrors.password}
            required
            autoComplete="current-password"
          />
        </div>

        {formError && (
          <p className={styles.error} role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" loading={submitting} className={styles.submit}>
          Đăng nhập
        </Button>
      </form>
    </div>
  );
}