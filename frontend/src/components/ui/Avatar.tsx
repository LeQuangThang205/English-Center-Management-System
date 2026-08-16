import { useState } from 'react';
import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/format';
import styles from './Avatar.module.css';

type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span className={cn(styles.avatar, styles[size], className)} aria-hidden="true">
      {showImage ? (
        <img src={src} alt="" className={styles.image} onError={() => setFailed(true)} />
      ) : (
        <span className={styles.fallback}>{getInitials(name)}</span>
      )}
    </span>
  );
}
