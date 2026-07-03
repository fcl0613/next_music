import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import Header from '@/components/Header'
import Player from '@/components/Player'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white">
        <AntdRegistry>
          <Header />
          <main className="flex-1 pt-16 pb-20">
            {children}
          </main>
          <Player />
        </AntdRegistry>
      </body>
    </html>
  )
}
