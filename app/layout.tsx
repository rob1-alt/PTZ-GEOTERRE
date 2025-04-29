import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PTZ Simulateur Geoterre',
  description: 'Geoterre',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png'
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
