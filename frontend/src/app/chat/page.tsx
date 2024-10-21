'use client'

import { useRouter } from 'next/navigation'
import { useConversation } from '@/hooks/useConversation'
import { ConversationAside } from '@/components/chat/ConversationAside'
import { Button } from '@/components/ui/button'

export default function ChatPage() {
    const router = useRouter()
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const { conversations, isLoading, error, addConversation, loadMoreConversations, pagination } =
        useConversation(baseUrl)

    const handleNewConversation = async () => {
        try {
            const newConversation = await addConversation('New Conversation')
            router.push(`/chat/${newConversation.id}`)
        } catch (error) {
            console.error('Error creating new conversation:', error)
        }
    }

    const hasMoreConversations = conversations.length < pagination.totalConversations

    return (
        <div className="flex min-h-screen">
            <ConversationAside
                conversations={conversations}
                currentConversationId={null}
                onSelectConversation={(id) => router.push(`/chat/${id}`)}
                onNewConversation={handleNewConversation}
                isLoading={isLoading}
                error={error?.message || null}
                onLoadMore={loadMoreConversations}
                hasMoreConversations={hasMoreConversations}
            />
            <div className="flex-grow flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Welcome to the Chat</h1>
                    <p className="mb-4">
                        Select a conversation from the sidebar or start a new one.
                    </p>
                    <Button
                        onClick={handleNewConversation}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        Start New Conversation
                    </Button>
                </div>
            </div>
        </div>
    )
}
