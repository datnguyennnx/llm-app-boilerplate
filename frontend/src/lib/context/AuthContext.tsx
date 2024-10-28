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
import { useToast } from '@/lib/hooks/use-toast'
import { User, AuthContextType } from '@/lib/types/auth'

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
    const { toast } = useToast()

    const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem('accessToken')
        const headers = new Headers(options.headers)

        if (token) {
            headers.set('Authorization', `Bearer ${token}`)
        }

        if (options.method && options.method !== 'GET') {
            headers.set('X-HTTP-Method', options.method)
        }

        const response = await fetch(url, {
            ...options,
            headers,
        })

        if (response.status === 401) {
            localStorage.removeItem('accessToken')
            queryClient.setQueryData(['user'], null)
            toast({
                title: 'Session Expired',
                description: 'Please log in again',
                variant: 'error',
            })
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
            if (!token) return null

            try {
                const response = await authenticatedFetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/user`,
                    { method: 'GET' },
                )
                if (response.ok) {
                    const userData = await response.json()
                    localStorage.setItem('user', JSON.stringify(userData))
                    return userData
                }
                return null
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to fetch user data',
                    variant: 'error',
                })
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
                        localStorage.setItem('accessToken', decodedData.access_token)
                        await queryClient.invalidateQueries({
                            queryKey: ['user'],
                        })
                        router.push('/')
                    } catch (err) {
                        toast({
                            title: 'Authentication Failed',
                            description: 'An error occurred during login. Please try again.',
                            variant: 'error',
                        })
                        router.push('/login')
                    } finally {
                        setIsAuthenticating(false)
                    }
                } else {
                    toast({
                        title: 'Authentication Failed',
                        description: 'Invalid callback data. Please try again.',
                        variant: 'error',
                    })
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
            toast({
                title: 'Login Success',
                description: 'Failed to initiate login. Please try again.',
                variant: 'success',
            })
        } catch (error) {
            toast({
                title: 'Login Failed',
                description: 'Failed to initiate login. Please try again.',
                variant: 'error',
            })
            throw error
        } finally {
            setIsAuthenticating(false)
        }
    }

    const logout = async () => {
        try {
            setIsAuthenticating(true)
            await logoutMutation.mutateAsync()
            toast({
                title: 'Logged Out',
                description: 'You have been successfully logged out.',
                variant: 'success',
            })
            router.push('/login')
        } catch (error) {
            toast({
                title: 'Logout Failed',
                description: 'An error occurred during logout. Please try again.',
                variant: 'error',
            })
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
