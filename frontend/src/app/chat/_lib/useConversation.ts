import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/context/AuthContext'
import { useToast } from '@/lib/hooks/use-toast'
import {
    Conversation,
    Message,
    PaginatedResponse,
    ConversationResult,
    ConversationResponse,
    MessageResponse,
} from '@/lib/types/chat'

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

const DEFAULT_PAGINATED_RESPONSE: PaginatedResponse<any> = {
    data: [],
    page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 10,
}

export function useConversation(initialConversationId?: string): ConversationResult {
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(
        initialConversationId || null,
    )
    const [conversationsPage, setConversationsPage] = useState(1)
    const { authenticatedFetch } = useAuth()
    const queryClient = useQueryClient()
    const { toast } = useToast()

    useEffect(() => {
        if (initialConversationId && initialConversationId !== currentConversationId) {
            setCurrentConversationId(initialConversationId)
        }
    }, [initialConversationId, currentConversationId])

    const conversationsQuery = useQuery({
        queryKey: ['conversations', conversationsPage],
        queryFn: async () => {
            try {
                const url = new URL(`${baseUrl}/api/conversations`)
                url.searchParams.append('page', conversationsPage.toString())
                url.searchParams.append('per_page', '10')

                const response = await authenticatedFetch(url.toString())
                if (!response.ok) {
                    const errorData = await response.json()
                    toast({
                        title: 'Error',
                        description: errorData.detail || 'Failed to fetch conversations',
                        variant: 'error',
                    })
                    return DEFAULT_PAGINATED_RESPONSE
                }

                const data: ConversationResponse = await response.json()
                return {
                    data: data.conversations.map((conv) => ({
                        id: conv.id,
                        title: conv.title,
                        created_at: conv.created_at,
                    })),
                    page: data.page,
                    total_pages: data.total_pages,
                    total_count: data.total_count,
                    per_page: data.per_page,
                }
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to fetch conversations',
                    variant: 'error',
                })
                return DEFAULT_PAGINATED_RESPONSE
            }
        },
        staleTime: 30000,
        placeholderData: (previousData) => previousData,
    })

    const messagesQuery = useQuery({
        queryKey: ['messages', currentConversationId],
        queryFn: async () => {
            try {
                if (!currentConversationId) {
                    return { messages: [], total_count: 0 }
                }

                const url = new URL(`${baseUrl}/api/messages/${currentConversationId}`)
                const response = await authenticatedFetch(url.toString())

                if (!response.ok) {
                    const errorData = await response.json()
                    toast({
                        title: 'Error',
                        description: errorData.detail || 'Failed to fetch messages',
                        variant: 'error',
                    })
                    return { messages: [], total_count: 0 }
                }

                const data = await response.json()
                console.log('Messages response:', data) // Debug log

                // Ensure we're getting the messages array from the response
                const messages = data.messages || []
                return {
                    messages: messages.map((msg: any) => ({
                        id: msg.id,
                        content: msg.content,
                        role: msg.role === 'user' ? 'user' : 'llm',
                        created_at: msg.created_at,
                    })),
                    total_count: messages.length,
                }
            } catch (error) {
                console.error('Error fetching messages:', error) // Debug log
                toast({
                    title: 'Error',
                    description: 'Failed to fetch messages',
                    variant: 'error',
                })
                return { messages: [], total_count: 0 }
            }
        },
        enabled: !!currentConversationId,
        staleTime: 30000,
    })

    const addConversationMutation = useMutation({
        mutationFn: async (title: string): Promise<Conversation> => {
            const response = await authenticatedFetch(`${baseUrl}/api/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Failed to create conversation')
            }
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
            setConversationsPage(1)
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'error',
            })
        },
    })

    const loadMoreConversations = useCallback(() => {
        const currentPage = conversationsQuery.data?.page ?? 1
        const totalPages = conversationsQuery.data?.total_pages ?? 1
        if (currentPage < totalPages) {
            setConversationsPage((prev) => prev + 1)
        }
    }, [conversationsQuery.data])

    const selectConversation = useCallback(
        (id: string) => {
            if (id !== currentConversationId) {
                setCurrentConversationId(id)
                // Prefetch messages for the new conversation
                queryClient.prefetchQuery({
                    queryKey: ['messages', id],
                    queryFn: async () => {
                        const url = new URL(`${baseUrl}/api/messages/${id}`)
                        const response = await authenticatedFetch(url.toString())
                        if (!response.ok) throw new Error('Failed to fetch messages')
                        return response.json()
                    },
                })
            }
        },
        [currentConversationId, queryClient, authenticatedFetch],
    )

    // Combine all loaded conversations
    const allConversations = conversationsQuery.data?.data || []

    // Get all messages
    const messages = messagesQuery.data?.messages || []
    console.log('Current messages:', messages) // Debug log

    const hasNextPage =
        (conversationsQuery.data?.page ?? 0) < (conversationsQuery.data?.total_pages ?? 0)
    const isFetchingNextPage = conversationsQuery.isFetching && conversationsPage > 1

    return {
        conversations: allConversations,
        currentConversationId,
        messages,
        isLoading: conversationsQuery.isLoading || messagesQuery.isLoading,
        hasMoreConversations: hasNextPage,
        isLoadingMoreConversations: isFetchingNextPage,
        hasNextPage,
        isFetchingNextPage,
        loadMoreConversations,
        addConversation: addConversationMutation.mutateAsync,
        selectConversation,
    }
}
