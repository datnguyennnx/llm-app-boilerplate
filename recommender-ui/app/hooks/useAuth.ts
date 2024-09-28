import { useEffect, useCallback } from 'react'
import { useNavigate } from '@remix-run/react'

const isServer = typeof window === 'undefined'

export function useAuth() {
    const navigate = useNavigate()

    useEffect(() => {
        if (!isServer) {
            const accessToken = localStorage.getItem('accessToken')
            if (!accessToken) {
                navigate('/login')
            }
        }
    }, [navigate])

    const getAuthTokens = useCallback(() => {
        if (isServer) {
            return { accessToken: null }
        }
        return {
            accessToken: localStorage.getItem('accessToken'),
        }
    }, [])

    const logout = useCallback(() => {
        if (!isServer) {
            localStorage.removeItem('accessToken')
        }
        navigate('/login')
    }, [navigate])

    const authenticatedFetch = useCallback(
        async (url: string, options: RequestInit = {}) => {
            if (isServer) {
                throw new Error(
                    'authenticatedFetch is not available on the server',
                )
            }

            const accessToken = localStorage.getItem('accessToken')
            if (!accessToken) {
                throw new Error('No access token found')
            }

            const headers = new Headers(options.headers)
            headers.set('Authorization', `Bearer ${accessToken}`)

            const response = await fetch(url, {
                ...options,
                headers,
            })

            if (response.status === 401) {
                logout()
                throw new Error('Unauthorized')
            }

            return response
        },
        [logout],
    )

    return { getAuthTokens, logout, authenticatedFetch }
}
