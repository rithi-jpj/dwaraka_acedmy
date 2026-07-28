import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dwarakaacademy.com'),
  title: {
    default: 'Dwaraka Academy — CBSE | JEE | NEET Coaching | Premier Education',
    template: '%s | Dwaraka Academy',
  },
  description: 'Dwaraka Academy is a premier educational institution offering quality coaching for CBSE, JEE Main & Advanced, and NEET. Expert faculty, personalized attention, and excellent results since 2020.',
  keywords: ['Dwaraka Academy', 'CBSE Coaching', 'JEE Coaching', 'NEET Coaching', 'Education', 'Tuition', 'Competitive Exam Preparation', 'Academic Coaching', 'Best Coaching Institute', 'Board Exam Preparation'],
  authors: [{ name: 'Dwaraka Academy' }],
  creator: 'Dwaraka Academy',
  publisher: 'Dwaraka Academy',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  icons: {
    icon: '/images/logo/logo.png',
    shortcut: '/images/logo/logo.png',
    apple: '/images/logo/logo.png',
  },
  openGraph: {
    title: 'Dwaraka Academy — CBSE | JEE | NEET Coaching | Premier Education',
    description: 'Premier educational institution offering quality coaching for CBSE Classes 6-12, JEE Main & Advanced, and NEET. Expert faculty, personalized attention since 2020.',
    siteName: 'Dwaraka Academy',
    type: 'website',
    locale: 'en_IN',
    countryName: 'India',
    emails: ['info@dwarakaacademy.com', 'admissions@dwarakaacademy.com'],
    phoneNumbers: ['+91-9876543210', '+91-9876543211'],
    images: [{ url: '/images/logo/logo.png', width: 600, height: 331, alt: 'Dwaraka Academy Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dwaraka Academy — CBSE | JEE | NEET Coaching',
    description: 'Premier educational institution offering quality coaching for CBSE, JEE, and NEET examinations.',
    images: ['/images/logo/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://dwarakaacademy.com',
  },
  verification: {
    // TODO: Replace 'verification-code' with the actual Google Search Console verification code before deploying to production
    // Get your verification code from https://search.google.com/search-console
    google: 'verification-code',
  },
  category: 'education',
  classification: 'Education',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': 'https://dwarakaacademy.com#organization',
      name: 'Dwaraka Academy',
      description: 'Premier educational institution offering quality coaching for CBSE, JEE, and NEET examinations.',
      url: 'https://dwarakaacademy.com',
      telephone: '+91-9876543210',
      email: 'info@dwarakaacademy.com',
      foundingDate: '2020',
      founder: { '@type': 'Person', name: 'Dr. Dwaraka Kumar' },
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123, Academic Block, Education City',
        addressRegion: 'Karnataka',
        addressCountry: 'IN',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '500',
        bestRating: '5',
        worstRating: '1',
      },
      knowsAbout: ['CBSE Coaching', 'JEE Coaching', 'NEET Coaching', 'Board Exam Preparation'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://dwarakaacademy.com#website',
      url: 'https://dwarakaacademy.com',
      name: 'Dwaraka Academy',
      description: 'Premier educational institution offering quality coaching for CBSE, JEE, and NEET examinations.',
      inLanguage: 'en-IN',
      publisher: { '@id': 'https://dwarakaacademy.com#organization' },
    },
    {
      '@type': 'Course',
      name: 'CBSE Coaching Classes 6-12',
      description: 'Comprehensive CBSE coaching with expert faculty, weekly tests, and personalized attention.',
      provider: { '@id': 'https://dwarakaacademy.com#organization' },
      educationalCredentialAwarded: 'CBSE Board Certification',
      offers: { '@type': 'Offer', price: 'Contact for pricing', priceCurrency: 'INR' },
    },
    {
      '@type': 'Course',
      name: 'JEE Main & Advanced Coaching',
      description: 'Intensive JEE preparation with problem-solving sessions and mock tests.',
      provider: { '@id': 'https://dwarakaacademy.com#organization' },
      offers: { '@type': 'Offer', price: 'Contact for pricing', priceCurrency: 'INR' },
    },
    {
      '@type': 'Course',
      name: 'NEET Medical Entrance Coaching',
      description: 'Focused NEET coaching with daily practice and comprehensive subject coverage.',
      provider: { '@id': 'https://dwarakaacademy.com#organization' },
      offers: { '@type': 'Offer', price: 'Contact for pricing', priceCurrency: 'INR' },
    },
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
