import { Quote } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/landing/Reveal';
import layoutStyles from './PublicLayout.module.css';
import styles from './Testimonials.module.css';

// Static marketing/demo content — NOT reviews from the database.
// Identities stay generic on purpose so nobody mistakes these
// for real student records.
const TESTIMONIALS = [
  {
    identity: 'Học viên lớp giao tiếp',
    quote:
      'Mỗi buổi học đều được luyện nói rất nhiều. Tôi tự tin hơn hẳn khi giao tiếp với đồng nghiệp nước ngoài.',
  },
  {
    identity: 'Học viên lớp nền tảng',
    quote:
      'Bắt đầu từ con số gần như bằng không, giờ tôi đã nắm chắc phát âm và ngữ pháp cơ bản.',
  },
  {
    identity: 'Học viên luyện thi IELTS',
    quote:
      'Lộ trình ôn luyện rõ ràng, thầy cô sửa bài kỹ. Tôi luôn biết mình đang ở đâu và cần cải thiện gì.',
  },
];

export function Testimonials() {
  return (
    <section className={layoutStyles.section} aria-labelledby="testimonials-heading">
      <div className={layoutStyles.container}>
        <Reveal className={layoutStyles.sectionHead}>
          <p className={layoutStyles.eyebrow}>Cảm nhận học viên</p>
          <h2 id="testimonials-heading" className={layoutStyles.sectionTitle}>
            Học viên nói gì về BrightWay?
          </h2>
          <p className={layoutStyles.sectionSubtitle}>
            Những chia sẻ từ các bạn đã và đang học tập tại trung tâm.
          </p>
        </Reveal>

        <div className={styles.grid}>
          {TESTIMONIALS.map((item, index) => (
            <Reveal key={item.identity} delay={index * 70}>
            <Card className={styles.card}>
              <Quote size={24} className={styles.quoteIcon} aria-hidden="true" />
              <blockquote className={styles.quote}>“{item.quote}”</blockquote>
              <p className={styles.identity}>{item.identity}</p>
            </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
