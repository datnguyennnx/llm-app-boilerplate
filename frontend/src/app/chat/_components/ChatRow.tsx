'use client'

import { useQuery } from '@tanstack/react-query'
import { Message } from '@/_lib/types/chat'
import { MarkdownRenderer } from '@/_components/common/MarkdownRenderer'
import { Logo } from '@/_components/common/Logo'
import { ScrollArea } from '@/_components/ui/scroll-area'

interface ChatRowProps {
    conversationId: string
    streamingContent?: string
}

interface MessagesResponse {
    messages: Message[]
    total_count: number
}

export function ChatRow({ conversationId, streamingContent }: ChatRowProps) {
    const { data: messagesData } = useQuery<MessagesResponse>({
        queryKey: ['messages', conversationId],
        staleTime: 30000, // Consider messages fresh for 30 seconds
    })

    const messages = messagesData?.messages || []

    // Only add streaming content if it's not already in messages
    const lastMessage = messages[messages.length - 1]
    const shouldAddStreaming = streamingContent && (!lastMessage || lastMessage.role === 'user')

    const allMessages = shouldAddStreaming
        ? [
              ...messages,
              {
                  id: 'streaming',
                  content: streamingContent,
                  role: 'llm' as const,
              },
          ]
        : messages

    return (
        <div className="flex flex-col gap-4 h-full overflow-y-auto no-scrollbar">
            {allMessages.map((message: Message) => (
                <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-shrink-0 h-8 w-8">
                        {message.role === 'user' ? <Logo type="user" /> : <Logo type="robot" />}
                    </div>
                    <div
                        className={`border overflow-hidden rounded-lg p-4 max-w-[70%] ${
                            message.role === 'user' ? 'bg-gray-200' : 'bg-blue-50'
                        }`}>
                        <MarkdownRenderer content={message.content} />
                    </div>
                </div>
            ))}
        </div>
    )
}
