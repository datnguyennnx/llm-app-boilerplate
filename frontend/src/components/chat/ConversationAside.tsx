import React from 'react'
import { Button } from '@/components/ui/button'

interface Conversation {
    id: string
    title: string
    created_at: string
}

interface ConversationAsideProps {
    conversations: Conversation[]
    currentConversationId: string | null
    onSelectConversation: (id: string) => void
    onNewConversation: () => void
    isLoading: boolean
    error: string | null
    onLoadMore: () => void
    hasMoreConversations: boolean
}

export const ConversationAside: React.FC<ConversationAsideProps> = ({
    conversations,
    currentConversationId,
    onSelectConversation,
    onNewConversation,
    isLoading,
    error,
    onLoadMore,
    hasMoreConversations,
}) => {
    return (
        <aside className="w-64 p-4 z-10 flex flex-col min-h-screen border-r-2 bg-white">
            <Button onClick={onNewConversation} disabled={isLoading} className="w-full mb-4">
                New Conversation
            </Button>
            {isLoading && conversations.length === 0 && <div>Loading conversations...</div>}
            {error && <div className="text-red-500">Error: {error}</div>}
            <div className="flex-grow overflow-y-auto">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelectConversation(conv.id)}
                        className={`p-2 mb-2 rounded cursor-pointer hover:bg-gray-200 ${
                            conv.id === currentConversationId ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                        {conv.title} - {new Date(conv.created_at).toLocaleString()}
                    </div>
                ))}
            </div>
            {hasMoreConversations && (
                <Button onClick={onLoadMore} disabled={isLoading} className="w-full mt-4">
                    {isLoading ? 'Loading...' : 'Load More'}
                </Button>
            )}
        </aside>
    )
}
