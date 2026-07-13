// app/(main)/layout.tsx
import Header from '@/components/Header'
import Player from '@/components/Player'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 pt-16 pb-20">{children}</main>
      <Player />
    </>
  )
}
