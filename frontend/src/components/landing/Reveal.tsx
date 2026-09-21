import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import styles from './Reveal.module.css';

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms — applied via transition-delay, no timers. */
  delay?: number;
}

function canAnimate(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('IntersectionObserver' in window)) return false;
  if (typeof window.matchMedia === 'function') {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return true;
}

// Scroll-reveal wrapper (progressive enhancement):
// content is visible immediately when IntersectionObserver is missing
// or reduced-motion is preferred, so it can never stay hidden.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => !canAnimate());

  useEffect(() => {
    const element = ref.current;
    if (!element || !canAnimate()) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties | undefined =
    delay > 0 ? { transitionDelay: `${delay}ms` } : undefined;

  return (
    <div ref={ref} style={style} className={cn(styles.reveal, visible && styles.visible, className)}>
      {children}
    </div>
  );
}
