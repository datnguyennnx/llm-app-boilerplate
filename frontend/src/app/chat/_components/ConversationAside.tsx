import { Button } from '@/_components/ui/button'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/_components/ui/sidebar'
import { LoadingSpinner } from '@/_components/common/LoadingSpinner'
import { useAuth } from '@/_lib/context/AuthContext'
import { ConversationList } from './ConversationList'
import { UserProfile } from './UserProfile'

interface Conversation {
    id: string
    title: string
    created_at: string
}

export interface ConversationAsideProps {
    conversations: Conversation[]
    currentConversationId: string | null
    onSelectConversation: (id: string) => void
    onNewConversation: () => void
    isLoading: boolean
    hasNextPage?: boolean
    isFetchingNextPage?: boolean
    loadMoreConversations?: () => void
}

export const ConversationAside = ({
    conversations,
    currentConversationId,
    onSelectConversation,
    onNewConversation,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    loadMoreConversations,
}: ConversationAsideProps) => {
    const { user, logout, isLoading: isLoadingUser } = useAuth()

    return (
        <Sidebar collapsible="icon" className="h-screen border-r border-border flex flex-col">
            <SidebarHeader className="flex-shrink-0 border-b border-border p-4">
                <Button
                    onClick={onNewConversation}
                    disabled={isLoading}
                    variant="default"
                    className="w-full justify-start bg-black text-white border rounded-md">
                    <span className="truncate">New Conversation</span>
                </Button>
            </SidebarHeader>
            <SidebarContent className="flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <LoadingSpinner />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p className="text-sm">No conversations yet</p>
                        <p className="text-xs">Start a new conversation</p>
                    </div>
                ) : (
                    <ConversationList
                        conversations={conversations}
                        currentConversationId={currentConversationId}
                        onSelectConversation={onSelectConversation}
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        loadMoreConversations={loadMoreConversations}
                    />
                )}
            </SidebarContent>
            <SidebarFooter className="flex-shrink-0 border-t border-border p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <UserProfile
                                user={user}
                                isLoadingUser={isLoadingUser}
                                logout={logout}
                            />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
