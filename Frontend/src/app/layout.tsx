import type { Metadata } from 'next'
import { Playfair_Display, Instrument_Sans, Caveat } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/next'
import { AirbridgeAnalytics } from '@/components/analytics/airbridge'

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const instrumentSans = Instrument_Sans({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.momentomemories.com'),
  title: 'Momento — Moments and Network',
  description: 'Create, manage, and share your events seamlessly with Momento.',
  keywords: ['events', 'photos', 'sharing', 'memories', 'gallery'],
  authors: [{ name: 'Momento Team' }],
  openGraph: {
    title: 'Momento — Moments and Network',
    description: 'Create, manage, and share your events seamlessly with Momento.',
    type: 'website',
  },
}

// Script to prevent flash of wrong theme
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('momento-theme');
      var theme = stored || 'system';
      var resolved = theme;
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.classList.add(resolved);
      document.documentElement.style.colorScheme = resolved;
    } catch (e) {}
  })();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${playfairDisplay.variable} ${instrumentSans.variable} ${caveat.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <AirbridgeAnalytics />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
