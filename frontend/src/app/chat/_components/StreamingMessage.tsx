'use client'

import { useEffect } from 'react'
import { ChatRequest } from '@/lib/types/chat'
import { useSSE } from '../_lib/useSSE'

interface StreamingMessageProps {
    onStreamUpdate: (content: string, isComplete: boolean) => void
    chatRequest?: ChatRequest | null
}

export function StreamingMessage({ onStreamUpdate, chatRequest }: StreamingMessageProps) {
    const { streamMessage, isStreaming, cancelStream } = useSSE()

    useEffect(() => {
        if (chatRequest) {
            streamMessage({
                request: chatRequest,
                onProgress: (content: string) => {
                    onStreamUpdate(content, false)
                },
            })
        }
    }, [chatRequest, streamMessage, onStreamUpdate])

    useEffect(() => {
        return () => {
            if (isStreaming) {
                cancelStream()
            }
        }
    }, [isStreaming, cancelStream])

    return null
}
