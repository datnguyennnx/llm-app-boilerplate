import { useState, useCallback, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'

interface Message {
    content: string
    isUser: boolean
    isStreaming?: boolean
}

interface ChatRequest {
    message: string
    conversation_id?: string
    model_type?: string
    model_name?: string
    temperature?: number
}

export function useSSE(baseUrl: string) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { authenticatedFetch } = useAuth()
    const abortControllerRef = useRef<AbortController | null>(null)
    const queryClient = useQueryClient()

    const updateMessages = useCallback((newContent: string, isEnd: boolean) => {
        setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1]
            if (!lastMessage?.isUser) {
                return [
                    ...prevMessages.slice(0, -1),
                    {
                        ...lastMessage,
                        content: lastMessage.content + newContent,
                        isStreaming: !isEnd,
                    },
                ]
            } else {
                return [
                    ...prevMessages,
                    {
                        content: newContent,
                        isUser: false,
                        isStreaming: !isEnd,
                    },
                ]
            }
        })
    }, [])

    const handleEventData = useCallback(
        (data: string) => {
            if (data === '[DONE]') {
                setIsStreaming(false)
                return
            }

            try {
                const parsedData = JSON.parse(data)
                if (parsedData.error) {
                    setError(parsedData.error)
                    setIsStreaming(false)
                    return
                }

                const content = parsedData.data
                updateMessages(content, false)
            } catch (err) {
                console.error('Error parsing SSE data:', err)
                setError('Error parsing server response')
                setIsStreaming(false)
            }
        },
        [updateMessages],
    )

    const sendMessageMutation = useMutation({
        mutationFn: async (chatRequest: ChatRequest) => {
            setIsStreaming(false)
            setError(null)
            setMessages((prev) => [...prev, { content: chatRequest.message, isUser: true }])

            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            abortControllerRef.current = new AbortController()

            const response = await authenticatedFetch(`${baseUrl}/api/streaming/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chatRequest),
                signal: abortControllerRef.current.signal,
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error(
                    `Error response from server: ${response.status} ${response.statusText}`,
                )
                console.error(`Error details: ${errorText}`)
                try {
                    const errorJson = JSON.parse(errorText)
                    throw new Error(errorJson.detail || 'Failed to send message')
                } catch (e) {
                    throw new Error(`Failed to send message: ${errorText}`)
                }
            }

            const reader = response.body?.getReader()
            if (!reader) {
                throw new Error('Failed to read response')
            }

            setIsStreaming(true)

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    if (buffer) {
                        handleEventData(buffer)
                    }
                    setIsStreaming(false)
                    break
                }
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n\n')
                buffer = lines.pop() ?? ''
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        handleEventData(data)
                    }
                }
            }
        },
        onError: (err: unknown) => {
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    console.log('Request aborted')
                } else {
                    console.error('Error sending message:', err.message)
                    setError(err.message)
                }
            } else {
                console.error('Unknown error:', err)
                setError('An unknown error occurred')
            }
            setIsStreaming(false)
        },
        onSettled: () => {
            // Invalidate and refetch any relevant queries
            queryClient.invalidateQueries({ queryKey: ['messages'] })
        },
    })

    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setIsStreaming(false)
        }
    }, [])

    return {
        messages,
        isLoading: sendMessageMutation.isPending,
        isStreaming,
        error,
        sendMessage: sendMessageMutation.mutate,
        setMessages,
        cancelStream,
    }
}
