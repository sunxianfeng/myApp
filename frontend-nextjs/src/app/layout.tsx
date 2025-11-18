import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import ReduxProvider from '@/components/providers/ReduxProvider'
import ErrorBoundary from '@/components/common/ErrorBoundary'

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: {
    default: 'Question Generator - AI-Powered OCR Question Creation',
    template: '%s | Question Generator'
  },
  description: 'Advanced AI-powered question generator with OCR capabilities. Convert images and documents into structured questions instantly. Perfect for educators, content creators, and assessment designers.',
  keywords: [
    'question generator',
    'OCR',
    'AI questions',
    'assessment creation',
    'educational tools',
    'document analysis',
    'image to text',
    'question bank',
    'test creation',
    'learning management'
  ],
  authors: [{ name: 'Question Generator Team' }],
  creator: 'Question Generator',
  publisher: 'Question Generator',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: './',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    title: 'Question Generator - AI-Powered OCR Question Creation',
    description: 'Advanced AI-powered question generator with OCR capabilities. Convert images and documents into structured questions instantly.',
    siteName: 'Question Generator',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Question Generator - AI-Powered OCR Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Question Generator - AI-Powered OCR Question Creation',
    description: 'Advanced AI-powered question generator with OCR capabilities. Convert images and documents into structured questions instantly.',
    images: ['/twitter-image.jpg'],
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={plusJakartaSans.className}>
        <ErrorBoundary>
          <ReduxProvider>
            {children}
          </ReduxProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
