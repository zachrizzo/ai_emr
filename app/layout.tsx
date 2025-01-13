import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { FloatingAIChat } from '@/components/messaging/floating-ai-chat'
import { AppointmentProvider } from '@/contexts/AppointmentContext'

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
        <AppointmentProvider>
          <ClientProviders>
            {children}
            <FloatingAIChat />
          </ClientProviders>
        </AppointmentProvider>
      </body>
    </html>
  )
}

function ClientProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}

