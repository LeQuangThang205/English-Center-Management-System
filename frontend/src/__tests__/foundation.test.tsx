import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppShell } from '@/components/layout/AppShell';
import { FoundationPreview } from '@/pages/FoundationPreview';
import { LoginPage } from '@/pages/LoginPage';

function renderWithProviders(ui: ReactNode) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

describe('frontend foundation', () => {
  it('renders AppShell with ADMIN sidebar navigation', () => {
    renderWithProviders(
      <AppShell role="ADMIN">
        <div>main content</div>
      </AppShell>,
    );

    expect(screen.getAllByText('English Center').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Học viên' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Điểm danh' })).toBeTruthy();
    expect(screen.getByText('main content')).toBeTruthy();
  });

  it('renders role-specific sidebar without other-role items', () => {
    renderWithProviders(
      <AppShell role="STUDENT">
        <div />
      </AppShell>,
    );

    expect(screen.getByRole('link', { name: 'Khóa học của tôi' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Học viên' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Lớp của tôi' })).toBeNull();
  });

  it('renders FoundationPreview design system page', () => {
    renderWithProviders(<FoundationPreview />);

    expect(screen.getByRole('heading', { name: 'Foundation Preview' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tạo mới' })).toBeTruthy();
    expect(screen.getAllByText('Primary').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Empty state' })).toBeTruthy();
  });

  it('renders LoginPage', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Mật khẩu')).toBeTruthy();
  });
});
