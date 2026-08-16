import {
  LayoutDashboard,
  BookOpen,
  School,
  Users,
  UserCog,
  ClipboardList,
  CreditCard,
  CalendarCheck,
  Star,
  Bell,
  Bot,
  ScrollText,
  Settings,
  CalendarDays,
} from 'lucide-react';
import type { Role } from '@/types/user';
import type { NavGroup } from '@/types/nav';

export const navConfig: Record<Role, NavGroup[]> = {
  ADMIN: [
    {
      items: [{ label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Quản lý',
      items: [
        { label: 'Học viên', path: '/admin/students', icon: Users },
        { label: 'Giáo viên', path: '/admin/teachers', icon: UserCog },
        { label: 'Khóa học', path: '/admin/courses', icon: BookOpen },
        { label: 'Lớp học', path: '/admin/classes', icon: School },
        { label: 'Đăng ký', path: '/admin/registrations', icon: ClipboardList },
        { label: 'Thanh toán', path: '/admin/transactions', icon: CreditCard },
      ],
    },
    {
      title: 'Học tập',
      items: [
        { label: 'Điểm danh', path: '/admin/attendance', icon: CalendarCheck },
        { label: 'Bảng điểm', path: '/admin/scores', icon: Star },
      ],
    },
    {
      title: 'Truyền thông',
      items: [{ label: 'Thông báo', path: '/admin/notifications', icon: Bell }],
    },
    {
      title: 'Hệ thống',
      items: [
        { label: 'AI Assistant', path: '/admin/ai-chat', icon: Bot, comingSoon: true },
        { label: 'Audit Log', path: '/admin/audit-logs', icon: ScrollText, comingSoon: true },
        { label: 'Cài đặt', path: '/admin/settings', icon: Settings, comingSoon: true },
      ],
    },
  ],
  TEACHER: [
    {
      items: [{ label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Lớp học',
      items: [
        { label: 'Lớp của tôi', path: '/teacher/classes', icon: School },
        { label: 'Lịch dạy', path: '/teacher/schedule', icon: CalendarDays },
        { label: 'Điểm danh', path: '/teacher/attendance', icon: CalendarCheck },
        { label: 'Bảng điểm', path: '/teacher/scores', icon: Star },
      ],
    },
    {
      title: 'Thông tin',
      items: [{ label: 'Thông báo', path: '/teacher/notifications', icon: Bell }],
    },
  ],
  STUDENT: [
    {
      items: [{ label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Học tập',
      items: [
        { label: 'Khóa học của tôi', path: '/student/courses', icon: BookOpen },
        { label: 'Lịch học', path: '/student/schedule', icon: CalendarDays },
        { label: 'Bảng điểm', path: '/student/scores', icon: Star },
        { label: 'Đăng ký', path: '/student/registrations', icon: ClipboardList },
      ],
    },
    {
      title: 'Thông tin',
      items: [{ label: 'Thông báo', path: '/student/notifications', icon: Bell }],
    },
  ],
};

export function roleHomePath(role: Role): string {
  return `/${role.toLowerCase()}/dashboard`;
}

export function flattenNav(role: Role): Array<{ label: string; path: string; comingSoon?: boolean }> {
  return navConfig[role].flatMap((group) => group.items);
}
