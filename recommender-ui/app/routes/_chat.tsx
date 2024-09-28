import { Outlet } from '@remix-run/react'

export default function ChatLayout() {
    return (
        <div className="flex min-h-screen">
            {/* You can add a sidebar or any other layout elements here */}
            <main className="flex-grow">
                <Outlet />
            </main>
        </div>
    )
}
