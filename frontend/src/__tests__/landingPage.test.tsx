import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { authStorage } from '@/features/auth/authStorage';
import { AppRoutes } from '@/routes/AppRoutes';
import type { Role, User } from '@/types/user';

function makeUser(role: Role): User {
  return {
    id: 1,
    email: `${role.toLowerCase()}@example.com`,
    fullName: `${role} User`,
    phone: null,
    role,
    status: 'ACTIVE',
    avatarUrl: null,
    emailVerifiedAt: null,
    lastLoginAt: null,
    createdAt: null,
    updatedAt: null,
  };
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('landing page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the BrightWay landing for anonymous users at /', () => {
    renderAt('/');

    expect(screen.getAllByText(/BrightWay English/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: /Tiếng Anh hôm nay\./ }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Khóa học phù hợp với mục tiêu của bạn' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Tại sao chọn BrightWay English?' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Đồng hành cùng đội ngũ giảng viên tận tâm' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Bốn bước đơn giản để bắt đầu' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Học viên nói gì về BrightWay?' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Sẵn sàng chinh phục tiếng Anh?' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Tìm BrightWay English' }),
    ).toBeTruthy();
    expect(screen.getByText('© 2026 BrightWay English.')).toBeTruthy();
  });

  it('does not render the dashboard AppShell on the landing page', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: /Tiếng Anh hôm nay\./ })).toBeTruthy();
    expect(screen.queryByLabelText('Điều hướng chính')).toBeNull();
    expect(screen.queryByText('Thu gọn')).toBeNull();
  });

  it('points login and trial CTAs to /login', () => {
    renderAt('/');

    // Desktop actions are CSS-hidden below 1024px; include them explicitly.
    // (vitest css:true + jsdom never matches media queries, so they are
    // always computed as display:none in tests.)
    const loginLinks = screen.getAllByRole('link', { name: 'Đăng nhập', hidden: true });
    expect(loginLinks.length).toBeGreaterThanOrEqual(2);
    loginLinks.forEach((link) => {
      expect(link.getAttribute('href')).toBe('/login');
    });

    const trialCtas = screen.getAllByRole('link', { name: 'Học thử miễn phí' });
    expect(trialCtas).toHaveLength(2);
    trialCtas.forEach((cta) => {
      expect(cta.getAttribute('href')).toBe('/login');
    });
  });

  it('points discovery CTAs to the #khoa-hoc anchor', () => {
    renderAt('/');

    const discoveryCtas = screen.getAllByRole('link', { name: 'Khám phá khóa học' });
    expect(discoveryCtas).toHaveLength(2);
    discoveryCtas.forEach((cta) => {
      expect(cta.getAttribute('href')).toBe('#khoa-hoc');
    });
  });

  it('points the Đăng ký action to /login (no public register page in S19.1)', () => {
    renderAt('/');

    const registerLinks = screen.getAllByRole('link', { name: 'Đăng ký', hidden: true });
    expect(registerLinks.length).toBeGreaterThanOrEqual(1);
    registerLinks.forEach((link) => {
      expect(link.getAttribute('href')).toBe('/login');
    });
  });

  it('renders header navigation anchors with correct destinations', () => {
    renderAt('/');

    // Desktop nav is CSS-hidden below 1024px (jsdom never matches the
    // media query), so locate it by testid instead of landmark role.
    const nav = screen.getByTestId('public-desktop-nav');
    const expectations: Array<[string, string]> = [
      ['Trang chủ', '#top'],
      ['Khóa học', '#khoa-hoc'],
      ['Giảng viên', '#giang-vien'],
      ['Về chúng tôi', '#ve-chung-toi'],
      ['Liên hệ', '#lien-he'],
    ];
    expectations.forEach(([label, href]) => {
      expect(
        within(nav).getByRole('link', { name: label, hidden: true }).getAttribute('href'),
      ).toBe(href);
    });
  });

  it('renders featured course cards without inventing live data claims', () => {
    renderAt('/');

    expect(screen.getByText('English Foundation')).toBeTruthy();
    expect(screen.getByText('English Communication')).toBeTruthy();
    expect(screen.getByText('IELTS Advanced')).toBeTruthy();

    const detailCtas = screen.getAllByRole('link', { name: 'Đăng nhập để xem chi tiết' });
    expect(detailCtas).toHaveLength(3);
    detailCtas.forEach((cta) => {
      expect(cta.getAttribute('href')).toBe('/login');
    });
  });

  it('makes no API calls when anonymous users view the landing page', () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    renderAt('/');

    expect(screen.getByRole('heading', { name: /Tiếng Anh hôm nay\./ })).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['STUDENT', 'Tổng quan khóa học và lịch học của bạn.'],
    ['TEACHER', 'Tổng quan lớp học và lịch dạy của bạn.'],
    ['ADMIN', 'Tổng quan hoạt động của trung tâm.'],
  ])(
    'redirects an authenticated %s from / to their dashboard',
    async (role: string, dashboardDescription: string) => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      authStorage.setSession('jwt.test', makeUser(role as Role));

      renderAt('/');

      expect(await screen.findByText(dashboardDescription)).toBeTruthy();
      expect(screen.queryByText(/Cơ hội lớn ngày mai/)).toBeNull();
    },
  );

  it('opens and closes the mobile navigation without affecting desktop links', () => {
    renderAt('/');

    expect(
      screen.queryByRole('navigation', { name: 'Điều hướng trang chủ trên di động' }),
    ).toBeNull();

    const toggle = screen.getByRole('button', { name: 'Mở menu' });
    fireEvent.click(toggle);

    const mobileNav = screen.getByRole('navigation', {
      name: 'Điều hướng trang chủ trên di động',
    });
    expect(
      within(mobileNav).getByRole('link', { name: 'Khóa học' }).getAttribute('href'),
    ).toBe('#khoa-hoc');
    expect(screen.getByRole('button', { name: 'Đóng menu' })).toBeTruthy();

    fireEvent.click(within(mobileNav).getByRole('link', { name: 'Khóa học' }));
    expect(
      screen.queryByRole('navigation', { name: 'Điều hướng trang chủ trên di động' }),
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
    expect(
      screen.getByRole('navigation', { name: 'Điều hướng trang chủ trên di động' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Đóng menu' }));
    expect(
      screen.queryByRole('navigation', { name: 'Điều hướng trang chủ trên di động' }),
    ).toBeNull();

    const desktopNav = screen.getByTestId('public-desktop-nav');
    expect(
      within(desktopNav).getByRole('link', { name: 'Khóa học', hidden: true }).getAttribute('href'),
    ).toBe('#khoa-hoc');
  });

  it('renders the location section with the approved area address and map', () => {
    renderAt('/');

    expect(
      screen.getByRole('heading', { name: 'Tìm BrightWay English' }),
    ).toBeTruthy();
    expect(screen.getByText(/Yên Nghĩa/)).toBeTruthy();
    expect(screen.getByText('Hà Đông, Hà Nội')).toBeTruthy();

    const iframe = screen.getByTitle(
      'Bản đồ khu vực BrightWay English tại Yên Nghĩa, Hà Đông, Hà Nội',
    );
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe.getAttribute('loading')).toBe('lazy');
    expect(iframe.getAttribute('src')).toContain('https://www.google.com/maps?q=');
    expect(iframe.getAttribute('src')).toContain('output=embed');

    const mapsLink = screen.getByRole('link', { name: 'Xem trên Google Maps' });
    expect(mapsLink.getAttribute('href')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Y%C3%AAn%20Ngh%C4%A9a%2C%20H%C3%A0%20%C4%90%C3%B4ng%2C%20H%C3%A0%20N%E1%BB%99i',
    );
    expect(mapsLink.getAttribute('target')).toBe('_blank');
    expect(mapsLink.getAttribute('rel')).toContain('noopener');
  });

  it('assigns #lien-he to the location section instead of the footer', () => {
    renderAt('/');

    const anchor = document.getElementById('lien-he');
    expect(anchor?.tagName).toBe('SECTION');
    expect(screen.getByRole('contentinfo').getAttribute('id')).toBeNull();
  });

  it('reveals content through IntersectionObserver and disconnects after intersecting', () => {
    const observed: Element[] = [];
    const disconnect = vi.fn();
    let callback: IntersectionObserverCallback | null = null;
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((cb: IntersectionObserverCallback) => {
        callback = cb;
        return { observe: (el: Element) => observed.push(el), disconnect, unobserve: vi.fn() };
      }),
    );

    renderAt('/');

    expect(observed.length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Tìm BrightWay English' })).toBeTruthy();

    act(() => {
      callback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(disconnect).toHaveBeenCalled();
  });

  it('skips the observer and shows content immediately when reduced motion is preferred', () => {
    const observe = vi.fn();
    vi.stubGlobal('IntersectionObserver', vi.fn(() => ({ observe, disconnect: vi.fn() })));
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    renderAt('/');

    expect(observe).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Tìm BrightWay English' })).toBeTruthy();
  });
});
