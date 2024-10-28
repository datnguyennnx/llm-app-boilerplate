import { useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/context/AuthContext'
import { useToast } from '@/lib/hooks/use-toast'
import { ChatRequest, StreamResponse } from '@/lib/types/chat'

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export function useSSE() {
    const { authenticatedFetch } = useAuth()
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const abortControllerRef = useRef<AbortController | null>(null)

    const handleStreamData = useCallback(
        (data: string, onProgress: (content: string) => void) => {
            if (data === '[DONE]') {
                // Invalidate messages query to fetch updated messages
                queryClient.invalidateQueries({ queryKey: ['messages'] })
                return true
            }

            try {
                const parsedData = JSON.parse(data) as StreamResponse
                if (parsedData.error) {
                    toast({
                        title: 'Error',
                        description: parsedData.error,
                        variant: 'error',
                    })
                    return true
                }

                if (parsedData.data !== undefined) {
                    onProgress(parsedData.data)
                }
                return false
            } catch (err) {
                console.error('Error parsing SSE data:', err)
                toast({
                    title: 'Error',
                    description: 'Error parsing server response',
                    variant: 'error',
                })
                return true
            }
        },
        [queryClient, toast],
    )

    const streamMessage = async ({
        request,
        onProgress,
    }: {
        request: ChatRequest
        onProgress: (content: string) => void
    }) => {
        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            abortControllerRef.current = new AbortController()

            const response = await authenticatedFetch(`${baseUrl}/api/streaming/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                signal: abortControllerRef.current.signal,
            })

            if (!response.ok) {
                throw new Error('Failed to send message')
            }

            const reader = response.body?.getReader()
            if (!reader) {
                throw new Error('Failed to read response')
            }

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    if (buffer) {
                        const isComplete = handleStreamData(buffer, onProgress)
                        if (isComplete) break
                    }
                    handleStreamData('[DONE]', onProgress)
                    break
                }

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n\n')
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const isComplete = handleStreamData(line.slice(6), onProgress)
                        if (isComplete) return
                    }
                }
            }
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    console.log('Request aborted')
                    return
                }
                toast({
                    title: 'Error',
                    description: err.message,
                    variant: 'error',
                })
            }
            throw err
        }
    }

    const streamMutation = useMutation({
        mutationFn: streamMessage,
        onMutate: async ({ request }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['messages', request.conversation_id] })

            // Optimistically update messages
            const previousMessages = queryClient.getQueryData(['messages', request.conversation_id])
            queryClient.setQueryData(['messages', request.conversation_id], (old: any) => ({
                ...old,
                messages: [
                    ...(old?.messages || []),
                    {
                        id: 'temp-user-message',
                        content: request.message,
                        role: 'user',
                    },
                ],
            }))

            return { previousMessages }
        },
        onError: (err, variables, context) => {
            // Revert to previous messages on error
            if (context?.previousMessages) {
                queryClient.setQueryData(
                    ['messages', variables.request.conversation_id],
                    context.previousMessages,
                )
            }
        },
        onSettled: (_, __, variables) => {
            // Invalidate messages query to ensure sync with server
            queryClient.invalidateQueries({
                queryKey: ['messages', variables.request.conversation_id],
            })
        },
    })

    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
    }, [])

    return {
        streamMessage: streamMutation.mutate,
        isStreaming: streamMutation.isPending,
        cancelStream,
    }
}
