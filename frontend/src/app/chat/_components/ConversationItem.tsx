import { MessageSquare } from 'lucide-react'
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

interface Conversation {
    id: string
    title: string
    created_at: string
}

export interface ConversationItemProps {
    conversation: Conversation
    isActive: boolean
    onClick: () => void
}

export const ConversationItem = ({ conversation, isActive, onClick }: ConversationItemProps) => {
    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive}>
                <Button
                    onClick={onClick}
                    variant="ghost"
                    className="w-full justify-start text-black border gap-2">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <p className="truncate">{conversation.title}</p>
                </Button>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}
