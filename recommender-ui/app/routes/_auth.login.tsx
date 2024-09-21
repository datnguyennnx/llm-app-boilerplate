import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from '@remix-run/react'
import { json, LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node'
import { Button } from '~/components/ui/button'
import { FcGoogle } from 'react-icons/fc'

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')

    if (code) {
        try {
            const tokenResponse = await fetch(
                'http://localhost:8000/auth/google/callback?code=' + code,
                {
                    method: 'GET',
                },
            )

            if (tokenResponse.ok) {
                const { access_token } = await tokenResponse.json()
                // In a real application, you should store the token securely
                // For this example, we'll use sessionStorage
                return json({ success: true, access_token })
            } else {
                return json(
                    { error: 'Failed to get access token' },
                    { status: 400 },
                )
            }
        } catch (error) {
            console.error('Error during token exchange:', error)
            return json({ error: 'Internal server error' }, { status: 500 })
        }
    }

    return json({})
}

export const action = async ({ request }: ActionFunctionArgs) => {
    // Handle POST requests if needed
    return null
}

export default function Login() {
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const access_token = searchParams.get('access_token')
        if (access_token) {
            sessionStorage.setItem('accessToken', access_token)
            navigate('/chat')
        }
    }, [searchParams, navigate])

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('http://localhost:8000/auth/login')
            const data = await response.json()
            window.location.href = data.url
        } catch (error) {
            console.error('Error initiating Google login:', error)
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md p-8 space-y-4 ">
                <h1 className="text-2xl font-bold text-center mb-8 text-nowrap">
                    Log in to LLM Boilerplate
                </h1>

                <Button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white hover:bg-gray-100 border text-black flex items-center justify-center space-x-2 py-6 rounded-md transition duration-300 ease-in-out"
                >
                    <FcGoogle className="w-5 h-5 " />
                    <span>Continue with Google</span>
                </Button>
            </div>
        </div>
    )
}
