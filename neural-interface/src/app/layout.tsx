import './globals.css'

export const metadata = {
  title: 'Neural Interface v2.1',
  description: 'AI Neural Network Interface',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}