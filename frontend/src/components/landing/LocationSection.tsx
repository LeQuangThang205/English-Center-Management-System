import { ExternalLink, MapPin } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';
import { cn } from '@/utils/cn';
import layoutStyles from './PublicLayout.module.css';
import styles from './LocationSection.module.css';

// Static area information for the public landing page.
// Only the district-level area is shown — no street address, phone,
// email, opening hours or social links exist in the current project,
// so none are presented here.
const MAP_QUERY = 'Yên Nghĩa, Hà Đông, Hà Nội';
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;
const MAP_EXTERNAL_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;

export function LocationSection() {
  return (
    <section id="lien-he" className={cn(layoutStyles.section, layoutStyles.sectionAlt)}>
      <div className={layoutStyles.container}>
        <Reveal>
          <div className={layoutStyles.sectionHead}>
            <p className={layoutStyles.eyebrow}>Liên hệ</p>
            <h2 className={layoutStyles.sectionTitle}>Tìm BrightWay English</h2>
            <p className={layoutStyles.sectionSubtitle}>
              Ghé thăm khu vực trung tâm của chúng tôi tại Hà Đông, Hà Nội.
            </p>
          </div>
        </Reveal>

        <div className={styles.grid}>
          <Reveal className={styles.info}>
            <div className={styles.addressCard}>
              <span className={styles.pinIcon} aria-hidden="true">
                <MapPin size={22} />
              </span>
              <p className={styles.brandName}>BrightWay English</p>
              <address className={styles.address}>
                Yên Nghĩa
                <span className={styles.addressBreak}>Hà Đông, Hà Nội</span>
              </address>
              <a
                className={styles.mapLink}
                href={MAP_EXTERNAL_HREF}
                target="_blank"
                rel="noopener noreferrer"
              >
                Xem trên Google Maps
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={70} className={styles.mapWrap}>
            <iframe
              className={styles.map}
              title="Bản đồ khu vực BrightWay English tại Yên Nghĩa, Hà Đông, Hà Nội"
              src={MAP_EMBED_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
