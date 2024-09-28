import { useState, useEffect } from 'react'
import { json, ActionFunctionArgs } from '@remix-run/node'
import { useActionData, Form, useNavigate } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '~/hooks/useAuth'

type ActionData =
    | { success: true; url: string }
    | { success: false; error: string }

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const intent = formData.get('intent')

    if (intent === 'google-login') {
        try {
            const response = await fetch(process.env.AUTH_LOGIN_URL || '')
            const data = await response.json()
            return json<ActionData>({ success: true, url: data.url })
        } catch (error) {
            console.error('Error initiating Google login:', error)
            return json<ActionData>({
                success: false,
                error: 'Failed to initiate Google login',
            })
        }
    }

    return json<ActionData>({ success: false, error: 'Invalid action' })
}

export default function Login() {
    const [isLoading, setIsLoading] = useState(false)
    const actionData = useActionData<typeof action>()
    const navigate = useNavigate()
    const { getAuthTokens, logout } = useAuth()

    useEffect(() => {
        // Clear any existing session
        logout()

        // Check if user is already authenticated
        const { accessToken } = getAuthTokens()
        if (accessToken) {
            navigate('/chat')
        }
    }, [logout, getAuthTokens, navigate])

    const handleGoogleLogin = () => {
        setIsLoading(true)
        if (actionData?.success && actionData.url) {
            window.location.href = actionData.url
        } else {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md p-8 space-y-4">
                <h1 className="text-2xl font-bold text-center mb-8 text-nowrap">
                    Log in to LLM Boilerplate
                </h1>

                <Form method="post" onSubmit={handleGoogleLogin}>
                    <Button
                        type="submit"
                        name="intent"
                        value="google-login"
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-gray-100 border text-black flex items-center justify-center space-x-2 py-6 rounded-md transition duration-300 ease-in-out"
                    >
                        <FcGoogle className="w-5 h-5" />
                        <span>
                            {isLoading ? 'Loading...' : 'Continue with Google'}
                        </span>
                    </Button>
                </Form>

                {actionData?.success === false && actionData.error && (
                    <p className="text-red-500 text-center mt-4">
                        {actionData.error}
                    </p>
                )}
            </div>
        </div>
    )
}
