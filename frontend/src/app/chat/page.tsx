'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConversation } from './_lib/useConversation'
import { ConversationAside } from './_components/ConversationAside'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '@/lib/context/AuthContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function ChatPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
    const {
        conversations,
        isLoading: isConversationsLoading,
        hasNextPage,
        isFetchingNextPage,
        loadMoreConversations,
        addConversation,
    } = useConversation()

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [isAuthLoading, isAuthenticated, router])

    useEffect(() => {
        if (!isConversationsLoading && conversations.length > 0) {
            router.push(`/chat/${conversations[0].id}`)
        }
    }, [conversations, isConversationsLoading, router])

    const handleSelectConversation = (id: string) => {
        router.push(`/chat/${id}`)
    }

    const handleNewConversation = async () => {
        try {
            const newConversation = await addConversation('New Conversation')
            router.push(`/chat/${newConversation.id}`)
        } catch (error) {
            console.error('Failed to create new conversation:', error)
        }
    }

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingSpinner className="w-8 h-8" />
            </div>
        )
    }

    return (
        <div className="flex h-full">
            <SidebarProvider>
                <ConversationAside
                    conversations={conversations}
                    currentConversationId={null}
                    onSelectConversation={handleSelectConversation}
                    onNewConversation={handleNewConversation}
                    isLoading={isConversationsLoading}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    loadMoreConversations={loadMoreConversations}
                />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        {isConversationsLoading ? (
                            <div className="flex flex-col items-center gap-2">
                                <LoadingSpinner className="w-6 h-6" />
                                <p>Loading conversations...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-lg">No conversations yet</p>
                                <p className="text-sm">Start a new one!</p>
                            </div>
                        )}
                    </div>
                </div>
            </SidebarProvider>
        </div>
    )
}
