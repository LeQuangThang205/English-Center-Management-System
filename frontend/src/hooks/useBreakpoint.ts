import { useMediaQuery } from '@/hooks/useMediaQuery';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint(): Breakpoint {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 640px)');

  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'mobile';
}
