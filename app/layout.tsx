import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { FloatingAIChat } from '@/components/messaging/floating-ai-chat'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI EMR',
  description: 'AI-powered Electronic Medical Records System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          {children}
          <FloatingAIChat />
        </ClientProviders>
      </body>
    </html>
  )
}

function ClientProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}

