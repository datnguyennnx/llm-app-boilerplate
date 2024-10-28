'use client'

import { useParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { ChatInput } from '../_components/ChatInput'
import { ChatRow } from '../_components/ChatRow'
import { ChatRequest } from '@/_lib/types/chat'
import { useSSE } from '../_lib/useSSE'

export default function ChatPage() {
    const { id } = useParams()
    const conversationId = Array.isArray(id) ? id[0] : id

    const [input, setInput] = useState('')
    const [streamingContent, setStreamingContent] = useState('')
    const { streamMessage, isStreaming, cancelStream } = useSSE()

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            if (!input.trim() || isStreaming) return

            const chatRequest: ChatRequest = {
                message: input,
                conversation_id: conversationId,
            }

            setInput('')
            setStreamingContent('')

            streamMessage({
                request: chatRequest,
                onProgress: (content) => {
                    setStreamingContent((prev) => prev + content)
                },
            })
        },
        [input, isStreaming, conversationId, streamMessage],
    )

    return (
        <div className="flex flex-col h-full w-4/5 mx-auto bg-white p-8 border rounded-lg">
            <div className="flex-1 overflow-y-auto min-h-0">
                <ChatRow conversationId={conversationId} streamingContent={streamingContent} />
            </div>
            <div className="flex-shrink-0 mt-4">
                <ChatInput
                    input={input}
                    setInput={setInput}
                    handleSubmit={handleSubmit}
                    isStreaming={isStreaming}
                    isChatLoading={false}
                    cancelStream={cancelStream}
                />
            </div>
        </div>
    )
}
