import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import btnStyles from '@/components/ui/Button.module.css';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <EmptyState
        icon={Compass}
        title="Không tìm thấy trang"
        description="Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển."
        action={
          <Link to="/login" className={`${btnStyles.button} ${btnStyles.secondary}`}>
            Về trang đăng nhập
          </Link>
        }
      />
    </div>
  );
}
