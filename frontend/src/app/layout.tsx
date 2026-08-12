import './globals.css';

import type { Metadata, Viewport } from 'next';
import {
  Inter,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from 'next/font/google';

import { AuthProvider } from '@/context/AuthContext';

// ============================================================
// FONTS
// ============================================================

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
  preload: false,
  fallback: ['monospace'],
});

// ============================================================
// SITE CONFIGURATION
// IMPORTANT: Keep this fixed to the real production domain.
// ============================================================

const SITE_URL = 'https://dwarakaacademy.in';
const SITE_NAME = 'Dwaraka Academy';

const SITE_DESCRIPTION =
  'Dwaraka Academy provides quality coaching and academic support for students.';

// ============================================================
// VIEWPORT
// ============================================================

export const viewport: Viewport = {
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: '#1E40AF',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#0F172A',
    },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  applicationName: SITE_NAME,

  title: {
    default: 'Dwaraka Academy — CBSE | JEE | NEET Coaching Institute',
    template: '%s | Dwaraka Academy',
  },

  description: SITE_DESCRIPTION,

  keywords: [
    'Dwaraka Academy',
    'CBSE Coaching',
    'JEE Coaching',
    'NEET Coaching',
    'Class 11 Tuition',
    'Class 12 Tuition',
    'Board Exam Preparation',
    'Competitive Exam Preparation',
    'JEE Main',
    'JEE Advanced',
    'NEET',
    'Academic Coaching',
  ],

  authors: [
    {
      name: SITE_NAME,
    },
  ],

  creator: SITE_NAME,
  publisher: SITE_NAME,

  generator: 'Next.js',

  referrer: 'origin-when-cross-origin',

  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },

  // ==========================================================
  // ICONS
  // ==========================================================

  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],

    shortcut: '/favicon-32x32.png',

    apple: '/apple-touch-icon.png',
  },

  // ==========================================================
  // OPEN GRAPH
  // ==========================================================

  openGraph: {
    type: 'website',

    locale: 'en_IN',

    url: SITE_URL,

    siteName: SITE_NAME,

    title: 'Dwaraka Academy — CBSE | JEE | NEET Coaching',

    description:
      'Dwaraka Academy provides academic coaching and preparation support for CBSE, JEE and NEET students.',

    images: [
      {
        url: `${SITE_URL}/images/logo/logo.png`,
        width: 600,
        height: 331,
        alt: 'Dwaraka Academy',
      },
    ],
  },

  // ==========================================================
  // TWITTER / X
  // ==========================================================

  twitter: {
    card: 'summary_large_image',

    title: 'Dwaraka Academy — CBSE | JEE | NEET Coaching',

    description:
      'Dwaraka Academy provides academic coaching and preparation support for CBSE, JEE and NEET students.',

    images: [`${SITE_URL}/images/logo/logo.png`],
  },

  // ==========================================================
  // ROBOTS
  // ==========================================================

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

  // ==========================================================
  // CANONICAL
  //
  // VERY IMPORTANT:
  // This is deliberately hard-coded to the real domain.
  // ==========================================================

  alternates: {
    canonical: `${SITE_URL}/`,
  },

  // ==========================================================
  // GOOGLE SEARCH CONSOLE VERIFICATION
  //
  // Your verification token from Google Search Console.
  // ==========================================================

  verification: {
    google:
      'IU34oHS8GTe7CxDm-ftJdzMs4nb1GEeDBN6nc0PzxDU',
  },

  category: 'education',

  classification: 'Education',
};

// ============================================================
// STRUCTURED DATA
// ============================================================
//
// IMPORTANT:
// Only include information that is actually true for Dwaraka
// Academy. Do NOT use fake ratings, addresses, founders,
// phone numbers, etc.
// ============================================================

const jsonLd = {
  '@context': 'https://schema.org',

  '@graph': [
    {
      '@type': 'EducationalOrganization',

      '@id': `${SITE_URL}/#organization`,

      name: SITE_NAME,

      url: SITE_URL,

      description: SITE_DESCRIPTION,

      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/logo/logo.png`,
      },

      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
    },

    {
      '@type': 'WebSite',

      '@id': `${SITE_URL}/#website`,

      url: SITE_URL,

      name: SITE_NAME,

      description: SITE_DESCRIPTION,

      inLanguage: 'en-IN',

      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
  ],
};

// ============================================================
// ROOT LAYOUT
// ============================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${inter.variable} ${plusJakartaSans.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        {/* Performance hints */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />

        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        <link
          rel="dns-prefetch"
          href="https://fonts.googleapis.com"
        />

        {/* PWA */}
        <link
          rel="manifest"
          href="/manifest.json"
        />

        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <meta
          name="mobile-web-app-capable"
          content="yes"
        />

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </head>

      <body className="min-h-screen antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}