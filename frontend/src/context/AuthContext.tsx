'use client'

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    QueryClient,
    QueryClientProvider,
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query'

interface User {
    email: string
    id: string
    google_id: string
}

interface AuthContextType {
    user: User | null
    login: () => Promise<void>
    logout: () => Promise<void>
    isAuthenticated: boolean
    isLoading: boolean
    isAuthenticating: boolean
    error: Error | null
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

const queryClient = new QueryClient()

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthContextContent>{children}</AuthContextContent>
        </QueryClientProvider>
    )
}

const AuthContextContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isAuthenticating, setIsAuthenticating] = useState(false)

    const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem('accessToken')
        console.log(
            'AuthContext: Token retrieved from localStorage:',
            token ? `${token.substring(0, 10)}...` : 'null',
        )
        const headers = new Headers(options.headers)

        if (token) {
            headers.set('Authorization', `Bearer ${token}`)
            console.log('AuthContext: Authorization header set:', headers.get('Authorization'))
        } else {
            console.log('AuthContext: No token found in localStorage')
        }

        if (options.method && options.method !== 'GET') {
            headers.set('X-HTTP-Method', options.method)
        }

        console.log('AuthContext: Request URL:', url)
        console.log('AuthContext: Request method:', options.method || 'GET')
        console.log('AuthContext: Request headers:', Object.fromEntries(headers.entries()))

        const response = await fetch(url, {
            ...options,
            headers,
        })

        console.log('AuthContext: Response status:', response.status)
        console.log(
            'AuthContext: Response headers:',
            Object.fromEntries(response.headers.entries()),
        )

        if (response.status === 401) {
            console.log('AuthContext: Unauthorized response received, clearing token')
            localStorage.removeItem('accessToken')
            queryClient.setQueryData(['user'], null)
            router.push('/login')
        }

        return response
    }

    const {
        data: user,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const token = localStorage.getItem('accessToken')
            console.log(
                'AuthContext: Token in user query:',
                token ? `${token.substring(0, 10)}...` : 'null',
            )
            if (!token) return null

            try {
                const response = await authenticatedFetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/user`,
                    { method: 'GET' },
                )
                if (response.ok) {
                    const userData = await response.json()
                    console.log('AuthContext: User data retrieved:', userData)
                    localStorage.setItem('user', JSON.stringify(userData))
                    return userData
                }
                return null
            } catch (error) {
                console.error('AuthContext: Error fetching user data:', error)
                return null
            }
        },
        retry: false,
    })

    const loginMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, {
                method: 'GET',
            })
            if (response.ok) {
                const data = await response.json()
                return data.url
            } else {
                throw new Error('Failed to initiate Google login')
            }
        },
    })

    const logoutMutation = useMutation({
        mutationFn: async () => {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('user')
            await queryClient.invalidateQueries({ queryKey: ['user'] })
        },
    })

    useEffect(() => {
        const handleCallback = async () => {
            if (window.location.pathname === '/auth/callback') {
                setIsAuthenticating(true)
                const urlParams = new URLSearchParams(window.location.search)
                const encodedData = urlParams.get('data')
                if (encodedData) {
                    try {
                        const decodedData = JSON.parse(decodeURIComponent(encodedData))
                        console.log('AuthContext: Decoded data:', decodedData)
                        localStorage.setItem('accessToken', decodedData.access_token)
                        console.log('AuthContext: Access token stored in localStorage')
                        await queryClient.invalidateQueries({
                            queryKey: ['user'],
                        })
                        router.push('/')
                    } catch (err) {
                        console.error('AuthContext: Authentication error:', err)
                        router.push('/login')
                    } finally {
                        setIsAuthenticating(false)
                    }
                } else {
                    console.error('AuthContext: No encoded data found in callback URL')
                    router.push('/login')
                    setIsAuthenticating(false)
                }
            }
        }

        handleCallback()
    }, [router, queryClient])

    const login = async () => {
        try {
            setIsAuthenticating(true)
            const loginUrl = await loginMutation.mutateAsync()
            window.location.href = loginUrl
        } catch (error) {
            console.error('AuthContext: Login failed:', error)
            throw error
        } finally {
            setIsAuthenticating(false)
        }
    }

    const logout = async () => {
        try {
            setIsAuthenticating(true)
            await logoutMutation.mutateAsync()
            router.push('/login')
        } catch (error) {
            console.error('AuthContext: Logout failed:', error)
            throw error
        } finally {
            setIsAuthenticating(false)
        }
    }

    const contextValue = useMemo(
        () => ({
            user,
            login,
            logout,
            isAuthenticated: !!user,
            isLoading,
            isAuthenticating,
            error,
            authenticatedFetch,
        }),
        [user, login, logout, isLoading, isAuthenticating, error, authenticatedFetch],
    )

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export default AuthProvider
