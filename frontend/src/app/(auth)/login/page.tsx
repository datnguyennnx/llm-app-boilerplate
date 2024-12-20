'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { FcGoogle } from 'react-icons/fc'

export default function LoginPage() {
    const { login, isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/')
        }
    }, [isAuthenticated, router])

    const handleGoogleLogin = async () => {
        await login()
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>
    }

    return (
        <div className="flex flex-col min-h-screen items-center justify-center">
            <h1 className="text-2xl font-bold text-center mb-8 text-nowrap">
                Log in to LLM Boilerplate
            </h1>

            <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full max-w-md bg-white hover:bg-gray-100 border text-black flex items-center justify-center space-x-2 rounded-md transition duration-300 ease-in-out">
                <FcGoogle className="w-5 h-5" />
                <span>{isLoading ? 'Loading...' : 'Continue with Google'}</span>
            </Button>
        </div>
    )
}
