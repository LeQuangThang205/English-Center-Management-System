import { useState } from 'react';
import { Bell, Info, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import styles from './FoundationPreview.module.css';

export function FoundationPreview() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Foundation Preview"
        description="Trang xem trước design system (Step 18.1) — chạy trong App Shell. Không phải dashboard thật."
        actions={
          <>
            <Button variant="ghost">Hủy</Button>
            <Button leftIcon={<Plus size={16} aria-hidden="true" />}>Tạo mới</Button>
          </>
        }
      />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Typography & Status</h2>
        <div className={styles.typography}>
          <h1>Heading 1 — 24px</h1>
          <h2>Heading 2 — 20px</h2>
          <p>Body text 14px — text chính của giao diện.</p>
          <p className={styles.secondary}>Secondary text 13px — mô tả, phụ chú.</p>
          <p className={styles.muted}>Muted text — timestamp, phụ chú nhẹ.</p>
        </div>
        <div className={styles.badgeRow}>
          <Badge>Neutral</Badge>
          <Badge tone="primary">Primary</Badge>
          <Badge tone="success" dot>
            Success
          </Badge>
          <Badge tone="warning" dot>
            Warning
          </Badge>
          <Badge tone="danger" dot>
            Danger
          </Badge>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Controls</h2>
        <div className={styles.grid}>
          <Card title="Buttons">
            <div className={styles.buttonRow}>
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className={styles.buttonRow}>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Card>

          <Card title="Form">
            <div className={styles.form}>
              <Input label="Tên học viên" placeholder="Nguyễn Văn A" leftIcon={<Search size={16} aria-hidden="true" />} />
              <Input label="Email" placeholder="you@example.com" hint="Dùng email đã đăng ký để đăng nhập." />
              <Input label="Số điện thoại" placeholder="0901 234 567" error="Số điện thoại không hợp lệ." />
              <Select label="Cấp độ khóa học" defaultValue="">
                <option value="" disabled>
                  Chọn cấp độ
                </option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </Select>
            </div>
          </Card>

          <Card title="Avatar & Loading">
            <div className={styles.avatarRow}>
              <Avatar name="Nguyễn Văn A" size="sm" />
              <Avatar name="Trần Thị B" size="md" />
              <Avatar name="Lê Quang C" size="lg" />
            </div>
            <div className={styles.buttonRow}>
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
            </div>
          </Card>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>States</h2>
        <div className={styles.grid}>
          <Card title="Empty state">
            <EmptyState
              icon={Bell}
              title="Chưa có thông báo"
              description="Khi có thông báo mới, chúng sẽ hiển thị tại đây."
            />
          </Card>
          <Card title="Error state">
            <ErrorState
              icon={Info}
              title="Không thể tải dữ liệu"
              message="Đã có lỗi xảy ra khi kết nối máy chủ."
              onRetry={() => undefined}
            />
          </Card>
          <Card title="Modal">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Mở modal
            </Button>
          </Card>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title="Xác nhận thao tác"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => setModalOpen(false)}>Xác nhận</Button>
          </>
        }
      >
        <p>
          Đây là modal theo design system — overlay mờ, panel trắng, ESC và click overlay để đóng, có focus
          trap và aria attributes.
        </p>
      </Modal>
    </div>
  );
}
