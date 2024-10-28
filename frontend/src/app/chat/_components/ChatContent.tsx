'use client'

import { useEffect, useRef } from 'react'
import { Message, StreamingState } from '@/lib/types/chat'
import { MessageList } from './MessageList'

interface ChatContentProps {
    messages: Message[]
    isStreaming: boolean
    streamingState: StreamingState
    isLoading: boolean
}

export function ChatContent({
    messages,
    isStreaming,
    streamingState,
    isLoading,
}: ChatContentProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
            })
        }
    }, [messages, streamingState])

    return (
        <MessageList
            messages={messages}
            isStreaming={isStreaming}
            streamingState={streamingState}
        />
    )
}
