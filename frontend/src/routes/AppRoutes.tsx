import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { navConfig } from '@/routes/navigation';
import { LoginPage } from '@/pages/LoginPage';
import { FoundationPreview } from '@/pages/FoundationPreview';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import type { Role } from '@/types/user';
import type { NavItem } from '@/types/nav';

function isDashboard(item: NavItem): boolean {
  return item.path.endsWith('/dashboard');
}

function buildRoleRoutes(role: Role) {
  const items = navConfig[role].flatMap((group) => group.items);
  return items.map((item) => {
    const path = item.path.replace(`/${role.toLowerCase()}/`, '');
    const element = isDashboard(item) ? <DashboardPage /> : <PlaceholderPage item={item} />;
    return <Route key={item.path} path={path} element={element} />;
  });
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/foundation-preview" element={<AppLayout role="ADMIN" preview />}>
        <Route index element={<FoundationPreview />} />
      </Route>

      {(['ADMIN', 'TEACHER', 'STUDENT'] as const).map((role) => (
        <Route
          key={role}
          path={`/${role.toLowerCase()}`}
          element={
            <ProtectedRoute roles={[role]}>
              <AppLayout role={role} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={`/${role.toLowerCase()}/dashboard`} replace />} />
          {buildRoleRoutes(role)}
        </Route>
      ))}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
