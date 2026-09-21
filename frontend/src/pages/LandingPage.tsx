import { Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/landing/PublicLayout';
import { Hero } from '@/components/landing/Hero';
import { FeaturedCourses } from '@/components/landing/FeaturedCourses';
import { WhyBrightWay } from '@/components/landing/WhyBrightWay';
import { TeachersTeaser } from '@/components/landing/TeachersTeaser';
import { LearningJourney } from '@/components/landing/LearningJourney';
import { Testimonials } from '@/components/landing/Testimonials';
import { FinalCta } from '@/components/landing/FinalCta';
import { LocationSection } from '@/components/landing/LocationSection';
import { useAuth } from '@/features/auth/useAuth';
import { roleHomePath } from '@/routes/navigation';

export function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return (
    <PublicLayout>
      <Hero />
      <FeaturedCourses />
      <WhyBrightWay />
      <TeachersTeaser />
      <LearningJourney />
      <Testimonials />
      <FinalCta />
      <LocationSection />
    </PublicLayout>
  );
}
