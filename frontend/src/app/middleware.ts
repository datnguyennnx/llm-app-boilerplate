import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/auth/callback']

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Check if the path is public
    if (PUBLIC_PATHS.includes(path) || path.startsWith('/api/')) {
        return NextResponse.next()
    }

    // Check for the presence of an Authorization header
    const authHeader = request.headers.get('Authorization')

    // If there's no Authorization header, redirect to login
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    const accessToken = authHeader.split(' ')[1]

    // For authenticated routes, we'll pass the token to the backend for verification
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/user`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!response.ok) {
            // If token verification fails, redirect to login
            return NextResponse.redirect(new URL('/login', request.url))
        }
    } catch (error) {
        console.error('Error verifying token:', error)
        // In case of an error, we'll redirect to login as a safety measure
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If everything is okay, continue with the request
    return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
