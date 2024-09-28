import { useState, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'

interface Message {
    content: string
    isUser: boolean
    isStreaming?: boolean
}

export function useSSE(baseUrl: string) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { getAuthTokens } = useAuth()
    const abortControllerRef = useRef<AbortController | null>(null)

    const { accessToken } = getAuthTokens()

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
                    setIsLoading(false)
                    setIsStreaming(false)
                    return
                }

                const content = parsedData.data

                if (isLoading) {
                    setIsLoading(false)
                }

                updateMessages(content, false)
            } catch (err) {
                console.error('Error parsing SSE data:', err)
                setError('Error parsing server response')
                setIsLoading(false)
                setIsStreaming(false)
            }
        },
        [isLoading, updateMessages],
    )

    const sendMessage = useCallback(
        async (
            message: string,
            modelType: string = 'openai',
            modelName: string = 'gpt-3.5-turbo',
            temperature: number = 0.7,
        ) => {
            setIsLoading(true)
            setIsStreaming(false)
            setMessages((prev) => [...prev, { content: message, isUser: true }])

            try {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort()
                }
                abortControllerRef.current = new AbortController()

                const response = await fetch(`${baseUrl}/api/streaming/ask`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        message,
                        model_type: modelType,
                        model_name: modelName,
                        temperature,
                    }),
                    signal: abortControllerRef.current.signal,
                })

                if (!response.ok) {
                    throw new Error('Failed to send message')
                }

                const reader = response.body?.getReader()
                if (!reader) {
                    throw new Error('Failed to read response')
                }

                setIsLoading(false)
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
            } catch (err: unknown) {
                if (err instanceof Error) {
                    if (err.name === 'AbortError') {
                        console.log('Request aborted')
                    } else {
                        console.error('Error sending message:', err.message)
                        setError('Failed to send message')
                    }
                } else {
                    console.error('Unknown error:', err)
                    setError('An unknown error occurred')
                }
                setIsLoading(false)
                setIsStreaming(false)
            }
        },
        [baseUrl, accessToken, handleEventData],
    )

    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setIsStreaming(false)
            setIsLoading(false)
        }
    }, [])

    return {
        messages,
        isLoading,
        isStreaming,
        error,
        sendMessage,
        setMessages,
        cancelStream,
    }
}
