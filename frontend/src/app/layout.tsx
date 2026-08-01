import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';

// ── Optimized fonts via next/font ──────────────────────────────────────
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: false, // only used for numbers, not critical
  fallback: ['monospace'],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://dwarakaacademy.in';
const SITE_NAME = 'Dwaraka Academy';
const SITE_DESCRIPTION = 'Dwaraka Academy is a premier educational institution offering quality coaching for CBSE, JEE Main & Advanced, and NEET. Expert faculty, personalized attention, and excellent results since 2020.';

// ── Viewport (separate from Metadata in Next.js 15) ──────────────────
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1E40AF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} — CBSE | JEE | NEET Coaching Institute`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Dwaraka Academy',
    'CBSE Coaching',
    'JEE Coaching',
    'NEET Coaching',
    'Class 11 Tuition',
    'Class 12 Tuition',
    'Best Coaching Institute',
    'Education',
    'Students',
    'Academy',
    'Competitive Exam Preparation',
    'Board Exam Preparation',
    'JEE Main',
    'JEE Advanced',
    'Medical Entrance',
    'Academic Coaching',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: `${SITE_NAME} — CBSE | JEE | NEET Coaching`,
    description: 'Premium coaching for CBSE, JEE and NEET aspirants with experienced faculty, personalized mentoring, regular tests, and excellent results.',
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_IN',
    countryName: 'India',
    emails: ['info@dwarakaacademy.com'],
    phoneNumbers: ['+91-9876543210'],
    images: [
      {
        url: '/images/logo/logo.png',
        width: 600,
        height: 331,
        alt: 'Dwaraka Academy Logo',
      },
    ],
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — CBSE | JEE | NEET Coaching`,
    description: 'Premium coaching for CBSE, JEE and NEET aspirants.',
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
    canonical: SITE_URL,
  },
  verification: {
    google:
      // ⚠️ Replace with your Google Search Console verification code before deploying to production.
      // Get it from https://search.google.com/search-console
      process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || 'verification-code',
  },
  category: 'education',
  classification: 'Education',
  other: {
    'og:phone_number': '+91-9876543210',
    'og:country-name': 'India',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}#organization`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo/logo.png`,
      telephone: '+91-9876543210',
      email: 'info@dwarakaacademy.com',
      foundingDate: '2020',
      founder: { '@type': 'Person', name: 'Ram Kumar' },
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123, Academic Block, Education City',
        addressRegion: 'Karnataka',
        addressCountry: 'IN',
      },
      areaServed: 'India',
      availableLanguage: ['English', 'Hindi', 'Kannada'],
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9876543210',
        contactType: 'admissions',
        availableLanguage: ['English', 'Hindi', 'Kannada'],
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '500',
        bestRating: '5',
        worstRating: '1',
      },
      knowsAbout: [
        'CBSE Coaching',
        'JEE Coaching',
        'NEET Coaching',
        'Board Exam Preparation',
        'Competitive Exam Preparation',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE_URL}#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Course',
      name: 'CBSE Coaching Classes 6-12',
      description:
        'Comprehensive CBSE coaching with expert faculty, weekly tests, and personalized attention for Classes 6 to 12.',
      provider: { '@id': `${SITE_URL}#organization` },
      educationalCredentialAwarded: 'CBSE Board Certification',
      offers: { '@type': 'Offer', price: 'Contact for pricing', priceCurrency: 'INR' },
      hasCourseInstance: [
        { '@type': 'CourseInstance', courseMode: 'Onsite', location: { '@type': 'Place', name: 'Dwaraka Academy' } },
      ],
    },
    {
      '@type': 'Course',
      name: 'JEE Main & Advanced Coaching',
      description: 'Intensive JEE preparation with problem-solving sessions, mock tests, and personalized mentoring.',
      provider: { '@id': `${SITE_URL}#organization` },
      offers: { '@type': 'Offer', price: 'Contact for pricing', priceCurrency: 'INR' },
      hasCourseInstance: [
        { '@type': 'CourseInstance', courseMode: 'Onsite', location: { '@type': 'Place', name: 'Dwaraka Academy' } },
      ],
    },
    {
      '@type': 'Course',
      name: 'NEET Medical Entrance Coaching',
      description:
        'Focused NEET coaching with daily practice, comprehensive subject coverage, and mock examinations.',
      provider: { '@id': `${SITE_URL}#organization` },
      offers: { '@type': 'Offer', price: 'Contact for pricing', priceCurrency: 'INR' },
      hasCourseInstance: [
        { '@type': 'CourseInstance', courseMode: 'Onsite', location: { '@type': 'Place', name: 'Dwaraka Academy' } },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${inter.variable} ${plusJakartaSans.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
