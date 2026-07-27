import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Dwaraka Academy — CBSE | JEE | NEET Coaching | Premier Education',
  description: 'Dwaraka Academy is a premier educational institution offering quality coaching for CBSE, JEE Main & Advanced, and NEET. Expert faculty, personalized attention, and excellent results since 2020.',
  keywords: ['Dwaraka Academy', 'CBSE Coaching', 'JEE Coaching', 'NEET Coaching', 'Education', 'Tuition', 'Competitive Exam Preparation', 'Academic Coaching'],
  icons: {
    icon: '/images/logo/logo.png',
    shortcut: '/images/logo/logo.png',
    apple: '/images/logo/logo.png',
  },
  openGraph: {
    title: 'Dwaraka Academy — CBSE | JEE | NEET Coaching',
    description: 'Premier educational institution offering quality coaching for CBSE, JEE, and NEET examinations.',
    siteName: 'Dwaraka Academy',
    type: 'website',
    locale: 'en_IN',
    images: [{ url: '/images/logo/logo.png', width: 600, height: 331 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dwaraka Academy — CBSE | JEE | NEET Coaching',
    description: 'Premier educational institution offering quality coaching for CBSE, JEE, and NEET examinations.',
    images: ['/images/logo/logo.png'],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://dwarakaacademy.com',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Dwaraka Academy',
  description: 'Premier educational institution offering quality coaching for CBSE, JEE, and NEET examinations.',
  url: 'https://dwarakaacademy.com',
  telephone: '+91-9876543210',
  foundingDate: '2020',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123, Academic Block, Education City',
    addressCountry: 'IN',
  },
  offers: [
    { '@type': 'Course', name: 'CBSE Coaching', description: 'Classes 6-12, Board Exam Preparation' },
    { '@type': 'Course', name: 'JEE Coaching', description: 'JEE Main & Advanced Preparation' },
    { '@type': 'Course', name: 'NEET Coaching', description: 'Medical Entrance Exam Preparation' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
