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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: "Loot — What's happening around you, right now",
  description: 'Discover offers, drops and opportunities from businesses near you, in real time.',
  keywords: ['local offers', 'deals', 'nearby', 'discovery', 'drops'],
  authors: [{ name: 'Loot Team' }],
  openGraph: {
    title: "Loot — What's happening around you, right now",
    description: 'Discover offers, drops and opportunities from businesses near you, in real time.',
    type: 'website',
  },
}

// Script to prevent flash of wrong theme
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('loot-theme');
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
