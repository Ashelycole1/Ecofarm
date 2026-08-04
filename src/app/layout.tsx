// Deployment Heartbeat: 2026-05-09 17:40
import type { Metadata, Viewport } from 'next'
import { Newsreader, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { AppProvider } from '@/context/AppContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#061412',
}

export const metadata: Metadata = {
  title: 'EcoFarm — Climate-Resilient Farming for Ugandan Farmers',
  description: 'EcoFarm helps Ugandan farmers track climate-resilient planting dates, get pest alerts, and monitor their farm health with real-time weather data. Built for the National Appropriate Technologies Expo.',
  keywords: ['Uganda farming', 'planting calendar', 'pest alerts', 'climate resilient', 'EcoFarm', 'agriculture'],
  authors: [{ name: 'EcoFarm' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'EcoFarm — Climate-Resilient Farming',
    description: 'Smart planting calendars and pest alerts for Ugandan farmers.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${newsreader.variable} ${plusJakarta.variable}`}>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#06260a" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </head>
        <body className="font-sans antialiased">
          <ErrorBoundary>
            <AppProvider>
              {children}
            </AppProvider>
          </ErrorBoundary>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  registration.unregister();
                  console.log('[SW] Unregistered to ensure latest updates');
                }
              });
            }
          `
        }} />
      </body>
      </html>
    </ClerkProvider>
  )
}
