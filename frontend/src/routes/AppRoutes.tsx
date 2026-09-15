import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { navConfig } from '@/routes/navigation';
import { LoginPage } from '@/pages/LoginPage';
import { FoundationPreview } from '@/pages/FoundationPreview';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminAttendancePage } from '@/pages/AdminAttendancePage';
import { AdminScoresPage } from '@/pages/AdminScoresPage';
import { AdminStudentsPage } from '@/pages/AdminStudentsPage';
import { AdminTeachersPage } from '@/pages/AdminTeachersPage';
import { AdminClassesPage } from '@/pages/AdminClassesPage';
import { AdminRegistrationsPage } from '@/pages/AdminRegistrationsPage';
import { AdminTransactionsPage } from '@/pages/AdminTransactionsPage';
import { StudentRegistrationsPage } from '@/pages/StudentRegistrationsPage';
import { TeacherAttendancePage } from '@/pages/TeacherAttendancePage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { CoursesPage } from '@/pages/CoursesPage';
import { TeacherScoresPage } from '@/pages/TeacherScoresPage';
import { TeacherClassesPage } from '@/pages/TeacherClassesPage';
import { TeacherSchedulePage } from '@/pages/TeacherSchedulePage';
import { StudentScoresPage } from '@/pages/StudentScoresPage';
import { StudentSchedulePage } from '@/pages/StudentSchedulePage';
import { StudentCoursesPage } from '@/pages/StudentCoursesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import type { Role } from '@/types/user';
import type { NavItem } from '@/types/nav';

function isAdminStudents(item: NavItem): boolean {
  return item.path === '/admin/students';
}

function isAdminTeachers(item: NavItem): boolean {
  return item.path === '/admin/teachers';
}

function isAdminClasses(item: NavItem): boolean {
  return item.path === '/admin/classes';
}

function isAdminRegistrations(item: NavItem): boolean {
  return item.path === '/admin/registrations';
}

function isAdminTransactions(item: NavItem): boolean {
  return item.path === '/admin/transactions';
}

function isAdminAttendance(item: NavItem): boolean {
  return item.path === '/admin/attendance';
}

function isAdminScores(item: NavItem): boolean {
  return item.path === '/admin/scores';
}

function isDashboard(item: NavItem): boolean {
  return item.path.endsWith('/dashboard');
}

function isNotifications(item: NavItem): boolean {
  return item.path.endsWith('/notifications');
}

function isAdminCourses(item: NavItem): boolean {
  return item.path === '/admin/courses';
}

function isTeacherScores(item: NavItem): boolean {
  return item.path === '/teacher/scores';
}

function isStudentScores(item: NavItem): boolean {
  return item.path === '/student/scores';
}

function isTeacherClasses(item: NavItem): boolean {
  return item.path === '/teacher/classes';
}

function isTeacherAttendance(item: NavItem): boolean {
  return item.path === '/teacher/attendance';
}

function isTeacherSchedule(item: NavItem): boolean {
  return item.path === '/teacher/schedule';
}

function isStudentCourses(item: NavItem): boolean {
  return item.path === '/student/courses';
}

function isStudentRegistrations(item: NavItem): boolean {
  return item.path === '/student/registrations';
}

function isStudentSchedule(item: NavItem): boolean {
  return item.path === '/student/schedule';
}

function buildRoleRoutes(role: Role) {
  const items = navConfig[role].flatMap((group) => group.items);
  return items.map((item) => {
    const path = item.path.replace(`/${role.toLowerCase()}/`, '');
    const element = isDashboard(item) ? (
      <DashboardPage />
    ) : isAdminAttendance(item) ? (
      <AdminAttendancePage />
    ) : isAdminScores(item) ? (
      <AdminScoresPage />
    ) : isAdminStudents(item) ? (
      <AdminStudentsPage />
    ) : isAdminTeachers(item) ? (
      <AdminTeachersPage />
    ) : isAdminClasses(item) ? (
      <AdminClassesPage />
    ) : isAdminRegistrations(item) ? (
      <AdminRegistrationsPage />
    ) : isAdminTransactions(item) ? (
      <AdminTransactionsPage />
    ) : isNotifications(item) ? (
      <NotificationsPage />
    ) : isAdminCourses(item) ? (
      <CoursesPage />
    ) : isTeacherScores(item) ? (
      <TeacherScoresPage />
    ) : isStudentScores(item) ? (
      <StudentScoresPage />
    ) : isStudentSchedule(item) ? (
      <StudentSchedulePage />
    ) : isStudentCourses(item) ? (
      <StudentCoursesPage />
    ) : isStudentRegistrations(item) ? (
      <StudentRegistrationsPage />
    ) : isTeacherClasses(item) ? (
      <TeacherClassesPage />
    ) : isTeacherAttendance(item) ? (
      <TeacherAttendancePage />
    ) : isTeacherSchedule(item) ? (
      <TeacherSchedulePage />
    ) : (
      <PlaceholderPage item={item} />
    );
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
