import { useState, useCallback } from 'react'
import { useConversation } from './useConversation'
import { useSSE } from './useSSE'
import { ChatLogicResult, ChatRequest } from '@/_lib/types/chat'

export function useChatLogic(initialConversationId?: string): ChatLogicResult {
    const [input, setInput] = useState('')
    const [streamingContent, setStreamingContent] = useState('')
    const { streamMessage, isStreaming, cancelStream } = useSSE()
    const {
        conversations,
        currentConversationId,
        messages,
        isLoading,
        hasMoreConversations,
        isLoadingMoreConversations,
        hasNextPage,
        isFetchingNextPage,
        loadMoreConversations,
        addConversation,
        selectConversation,
    } = useConversation(initialConversationId)

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            if (!input.trim() || isStreaming) return

            const chatRequest: ChatRequest = {
                message: input,
                conversation_id: currentConversationId || undefined,
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
        [input, isStreaming, currentConversationId, streamMessage],
    )

    const handleNewConversation = useCallback(async () => {
        const newConversation = await addConversation('New Chat')
        selectConversation(newConversation.id)
    }, [addConversation, selectConversation])

    return {
        input,
        setInput,
        messages,
        isStreaming,
        streamingContent,
        isChatLoading: false,
        isConversationLoading: isLoading,
        conversations,
        currentConversationId,
        streamingState: {
            content: streamingContent,
            isComplete: !isStreaming,
        },
        loadMoreConversations,
        handleNewConversation,
        handleSubmit,
        handleSelectConversation: selectConversation,
        cancelStream,
        isLoading,
        hasMoreConversations,
        isLoadingMoreConversations,
        hasNextPage,
        isFetchingNextPage,
    }
}
