'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
    const router = useRouter()

    useEffect(() => {
        router.push('/chat')
    }, [router])

    // Render nothing or a loading state while redirecting
    return null
}
