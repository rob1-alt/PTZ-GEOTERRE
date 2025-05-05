import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PTZ Simulateur Geoterre',
  description: 'Simulateur pour calculer votre éligibilité au Prêt à Taux Zéro 2025',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png'
  },
  openGraph: {
    title: 'PTZ Simulateur Geoterre',
    description: 'Simulateur pour calculer votre éligibilité au Prêt à Taux Zéro 2025',
    url: 'https://simulateur-ptz-2025.fr',
    siteName: 'PTZ Simulateur Geoterre',
    images: [
      {
        url: '/image.png',
        width: 1200,
        height: 630,
        alt: 'PTZ Simulateur Geoterre'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PTZ Simulateur Geoterre',
    description: 'Simulateur pour calculer votre éligibilité au Prêt à Taux Zéro 2025',
    images: ['/image.png'],
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
