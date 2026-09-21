export interface LandingNavItem {
  label: string;
  href: string;
}

// Shared public-site anchor navigation (header + footer).
// "Liên hệ" targets the Location section (#lien-he).
export const LANDING_NAV_ITEMS: readonly LandingNavItem[] = [
  { label: 'Trang chủ', href: '#top' },
  { label: 'Khóa học', href: '#khoa-hoc' },
  { label: 'Giảng viên', href: '#giang-vien' },
  { label: 'Về chúng tôi', href: '#ve-chung-toi' },
  { label: 'Liên hệ', href: '#lien-he' },
];
