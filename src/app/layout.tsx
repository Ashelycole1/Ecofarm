import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { FirebaseProvider } from '@/context/FirebaseContext'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#06260a',
}

export const metadata: Metadata = {
  title: 'EcoFarm — Climate-Resilient Farming for Ugandan Farmers',
  description: 'EcoFarm helps Ugandan farmers track climate-resilient planting dates, get pest alerts, and monitor their farm health with real-time weather data. Built for the National Appropriate Technologies Expo.',
  keywords: ['Uganda farming', 'planting calendar', 'pest alerts', 'climate resilient', 'EcoFarm', 'agriculture'],
  authors: [{ name: 'EcoFarm' }],
  manifest: '/manifest.json',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌿</text></svg>",
  },
  openGraph: {
    title: 'EcoFarm — Climate-Resilient Farming',
    description: 'Smart planting calendars and pest alerts for Ugandan farmers.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06260a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans antialiased">
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(reg) { console.log('[SW] Registered:', reg.scope); },
                  function(err) { console.warn('[SW] Registration failed:', err); }
                );
              });
            }
          `
        }} />
      </body>
    </html>
  )
}
