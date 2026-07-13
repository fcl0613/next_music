// app/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AntdRegistry } from '@ant-design/nextjs-registry'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white">
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  )
}
