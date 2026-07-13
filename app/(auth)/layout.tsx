export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      {children}
    </div>
  )
}
