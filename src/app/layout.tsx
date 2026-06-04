import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/Sidebar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FinanceTrack',
  description: 'Investment portfolio tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen bg-background`}>
        <Sidebar />
        <main className="flex-1 min-h-screen bg-background overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
