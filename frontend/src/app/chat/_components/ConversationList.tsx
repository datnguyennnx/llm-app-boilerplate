import { ScrollArea } from '@/components/ui/scroll-area'
import {
    SidebarMenu,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from '@/components/ui/sidebar'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ConversationItem } from './ConversationItem'

interface Conversation {
    id: string
    title: string
    created_at: string
}

export interface ConversationListProps {
    conversations: Conversation[]
    currentConversationId: string | null
    onSelectConversation: (id: string) => void
    hasNextPage?: boolean
    isFetchingNextPage?: boolean
    loadMoreConversations?: () => void
}

interface GroupedConversations {
    last7Days: Conversation[]
    last30Days: Conversation[]
    older: Conversation[]
}

const groupConversationsByDate = (conversations: Conversation[]): GroupedConversations => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return conversations.reduce(
        (groups, conversation) => {
            const conversationDate = new Date(conversation.created_at)

            if (conversationDate >= sevenDaysAgo) {
                groups.last7Days.push(conversation)
            } else if (conversationDate >= thirtyDaysAgo) {
                groups.last30Days.push(conversation)
            } else {
                groups.older.push(conversation)
            }

            return groups
        },
        { last7Days: [], last30Days: [], older: [] } as GroupedConversations,
    )
}

export const ConversationList = ({
    conversations,
    currentConversationId,
    onSelectConversation,
    hasNextPage,
    isFetchingNextPage,
    loadMoreConversations,
}: ConversationListProps) => {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!hasNextPage || isFetchingNextPage || !loadMoreConversations) return

        const element = e.currentTarget
        const scrollPosition = element.scrollTop + element.clientHeight
        const scrollThreshold = element.scrollHeight * 0.8 // Load more when 80% scrolled

        if (scrollPosition >= scrollThreshold) {
            loadMoreConversations()
        }
    }

    const groupedConversations = groupConversationsByDate(conversations)

    return (
        <ScrollArea onScroll={handleScroll} className="h-full">
            <SidebarMenu className="p-4 space-y-4">
                {groupedConversations.last7Days.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>7 days ago</SidebarGroupLabel>
                        <SidebarGroupContent className="space-y-2">
                            {groupedConversations.last7Days.map((conversation) => (
                                <ConversationItem
                                    key={conversation.id}
                                    conversation={conversation}
                                    isActive={conversation.id === currentConversationId}
                                    onClick={() => onSelectConversation(conversation.id)}
                                />
                            ))}
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {groupedConversations.last30Days.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>30 days ago</SidebarGroupLabel>
                        <SidebarGroupContent className="space-y-2">
                            {groupedConversations.last30Days.map((conversation) => (
                                <ConversationItem
                                    key={conversation.id}
                                    conversation={conversation}
                                    isActive={conversation.id === currentConversationId}
                                    onClick={() => onSelectConversation(conversation.id)}
                                />
                            ))}
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {groupedConversations.older.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Older</SidebarGroupLabel>
                        <SidebarGroupContent className="space-y-2">
                            {groupedConversations.older.map((conversation) => (
                                <ConversationItem
                                    key={conversation.id}
                                    conversation={conversation}
                                    isActive={conversation.id === currentConversationId}
                                    onClick={() => onSelectConversation(conversation.id)}
                                />
                            ))}
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {isFetchingNextPage && (
                    <div className="flex justify-center p-2">
                        <LoadingSpinner className="w-6 h-6" />
                    </div>
                )}
                {!hasNextPage && conversations.length > 0 && (
                    <div className="text-center py-2 text-sm text-gray-500">
                        No more conversations
                    </div>
                )}
            </SidebarMenu>
        </ScrollArea>
    )
}
