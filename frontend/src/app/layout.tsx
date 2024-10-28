import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/context/AuthContext'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'LLM App Boilerplate',
    description: 'A Next.js frontend for the LLM App Boilerplate',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <main>{children}</main>
                    <Toaster />
                </AuthProvider>
            </body>
        </html>
    )
}
