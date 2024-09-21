import { useEffect } from 'react'
import { Outlet, useNavigate, Link } from '@remix-run/react'
import { json, LoaderFunctionArgs } from '@remix-run/node'

export const loader = async ({ request }: LoaderFunctionArgs) => {
    // You can add server-side authentication check here if needed
    return json({})
}

export default function AppLayout() {
    const navigate = useNavigate()

    useEffect(() => {
        const checkAuth = () => {
            const accessToken = sessionStorage.getItem('accessToken')
            if (!accessToken) {
                navigate('/login')
            }
        }

        checkAuth()
    }, [navigate])

    const handleLogout = () => {
        sessionStorage.removeItem('accessToken')
        navigate('/login')
    }

    return (
        <main>
            <Outlet />
        </main>
    )
}
