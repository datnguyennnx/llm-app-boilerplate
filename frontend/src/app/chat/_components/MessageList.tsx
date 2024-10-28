'use client'

import { Message, MessageListProps } from '@/_lib/types/chat'
import { ChatRow } from './ChatRow'

export function MessageList({ messages, isStreaming, streamingState }: MessageListProps) {
    return (
        <div className="flex flex-col">
            {messages.map((message) => (
                <ChatRow
                    key={message.id}
                    conversationId={message.id}
                    streamingContent={message.content}
                />
            ))}
            {isStreaming && streamingState && (
                <ChatRow conversationId="streaming" streamingContent={streamingState.content} />
            )}
        </div>
    )
}
