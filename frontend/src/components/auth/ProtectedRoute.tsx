import { ReactNode, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
    children: ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()
    const redirectInitiated = useRef(false)

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !redirectInitiated.current) {
            redirectInitiated.current = true
            router.push('/login')
        }
    }, [isLoading, isAuthenticated, router])

    if (isLoading) {
        return <div>Loading...</div> // You can replace this with a proper loading component
    }

    if (!isAuthenticated) {
        return null // Don't render anything while redirecting
    }

    return <>{children}</>
}
