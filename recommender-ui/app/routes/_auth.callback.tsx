import { useEffect } from 'react'
import { useNavigate, useSearchParams } from '@remix-run/react'
import { json, LoaderFunctionArgs } from '@remix-run/node'
import { useAuth } from '~/hooks/useAuth'

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url)
    const accessToken = url.searchParams.get('access_token')

    if (!accessToken) {
        return json({ error: 'Missing access token' }, { status: 400 })
    }

    return json({ accessToken })
}

export default function Callback() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { getAuthTokens, logout } = useAuth()

    useEffect(() => {
        const accessToken = searchParams.get('access_token')

        if (accessToken) {
            // Store the access token using the useAuth hook
            localStorage.setItem('accessToken', accessToken)

            // Verify that the token was stored correctly
            const { accessToken: storedToken } = getAuthTokens()
            if (storedToken === accessToken) {
                console.log('Access token stored successfully')
                navigate('/chat')
            } else {
                console.error('Failed to store access token')
                logout()
                navigate('/login')
            }
        } else {
            console.error('Access token not found in URL parameters')
            logout()
            navigate('/login')
        }
    }, [searchParams, navigate, getAuthTokens, logout])

    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Authenticating...</p>
        </div>
    )
}
