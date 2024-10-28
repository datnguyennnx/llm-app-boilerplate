'use client'

import { useEffect } from 'react'
import { useConversation } from '../_lib/useConversation'
import { Message } from '@/lib/types/chat'

interface HistoryMessagesProps {
    conversationId: string
    onMessagesLoaded: (messages: Message[]) => void
}

export function HistoryMessages({ conversationId, onMessagesLoaded }: HistoryMessagesProps) {
    const { messages, isLoading } = useConversation(conversationId)

    useEffect(() => {
        if (!isLoading && messages) {
            onMessagesLoaded(messages)
        }
    }, [messages, isLoading, onMessagesLoaded])

    // This component doesn't render anything visible
    return null
}
