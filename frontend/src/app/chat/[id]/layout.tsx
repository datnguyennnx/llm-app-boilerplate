'use client'

import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { BackgroundDots } from '@/components/layout/BackgroundDots'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ConversationAside } from '../_components/ConversationAside'
import { useConversation } from '../_lib/useConversation'
import { useToast } from '@/lib/hooks/use-toast'

interface ChatLayoutProps {
    children: React.ReactNode
    params: {
        id: string
    }
}

export default function ChatLayout({ children, params }: ChatLayoutProps) {
    const router = useRouter()
    const { toast } = useToast()
    const {
        conversations,
        isLoading: isConversationLoading,
        hasNextPage,
        isFetchingNextPage,
        loadMoreConversations,
        addConversation,
    } = useConversation(params.id)

    const handleNewConversation = async () => {
        try {
            const newConversation = await addConversation('New Conversation')
            router.push(`/chat/${newConversation.id}`)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create new conversation',
                variant: 'error',
            })
        }
    }

    const handleSelectConversation = (id: string) => {
        if (id === params.id) return
        router.push(`/chat/${id}`)
    }

    return (
        <ProtectedRoute>
            <div className="relative flex h-screen w-full bg-gray-50">
                <SidebarProvider>
                    <BackgroundDots className="absolute inset-0 z-0 opacity-50" />
                    <div className="z-10 flex h-full w-full">
                        <ConversationAside
                            conversations={conversations}
                            currentConversationId={params.id}
                            onSelectConversation={handleSelectConversation}
                            onNewConversation={handleNewConversation}
                            isLoading={isConversationLoading}
                            hasNextPage={hasNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                            loadMoreConversations={loadMoreConversations}
                        />
                        <div className="flex w-full justify-center items-center p-8">
                            {children}
                        </div>
                    </div>
                </SidebarProvider>
            </div>
        </ProtectedRoute>
    )
}
