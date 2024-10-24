import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'

interface Conversation {
    id: string
    title: string
    created_at: string
}

interface Message {
    id: string
    sender: string
    content: string
    created_at: string
}

interface PaginationState {
    page: number
    limit: number
    totalConversations: number
}

interface ConversationsResponse {
    conversations: Conversation[]
    total: number
}

export function useConversation(baseUrl: string) {
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 20,
        totalConversations: 0,
    })
    const { authenticatedFetch } = useAuth()
    const queryClient = useQueryClient()

    const fetchConversations = useCallback(
        async ({ queryKey }: { queryKey: (string | number)[] }): Promise<ConversationsResponse> => {
            const [, page] = queryKey
            const skip = (Number(page) - 1) * pagination.limit
            console.log(
                `Fetching conversations: page ${page}, skip ${skip}, limit ${pagination.limit}`,
            )
            try {
                const response = await authenticatedFetch(
                    `${baseUrl}/api/conversations?skip=${skip}&limit=${pagination.limit}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                )
                console.log(`Fetch conversations response status: ${response.status}`)
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(
                        errorData.detail || `Failed to fetch conversations: ${response.statusText}`,
                    )
                }
                const data = await response.json()
                console.log(`Fetched ${data.conversations.length} conversations`)
                setPagination((prev) => ({ ...prev, totalConversations: data.total }))
                return data
            } catch (error) {
                console.error('Error fetching conversations:', error)
                throw error
            }
        },
        [baseUrl, authenticatedFetch, pagination.limit],
    )

    const {
        data: conversationsData,
        isLoading: isLoadingConversations,
        error: conversationsError,
    }: UseQueryResult<ConversationsResponse, Error> = useQuery({
        queryKey: ['conversations', pagination.page],
        queryFn: fetchConversations,
        placeholderData: (previousData) => previousData,
    })

    const {
        data: messages,
        isLoading: isLoadingMessages,
        error: messagesError,
    }: UseQueryResult<Message[], Error> = useQuery({
        queryKey: ['messages', currentConversationId],
        queryFn: async () => {
            if (!currentConversationId) return []
            console.log(`Fetching messages for conversation: ${currentConversationId}`)
            try {
                const response = await authenticatedFetch(
                    `${baseUrl}/api/messages/${currentConversationId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                )
                console.log(`Fetch messages response status: ${response.status}`)
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(
                        errorData.detail || `Failed to fetch messages: ${response.statusText}`,
                    )
                }
                const data = await response.json()
                console.log(`Fetched ${data.length} messages`)
                return data
            } catch (error) {
                console.error('Error fetching messages:', error)
                throw error
            }
        },
        enabled: !!currentConversationId,
    })

    const addConversationMutation = useMutation<Conversation, Error, string>({
        mutationFn: async (title: string): Promise<Conversation> => {
            console.log(`Adding new conversation with title: ${title}`)
            try {
                const response = await authenticatedFetch(`${baseUrl}/api/conversations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title }),
                })
                console.log(`Add conversation response status: ${response.status}`)
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(
                        errorData.detail || `Failed to create conversation: ${response.statusText}`,
                    )
                }
                const data = await response.json()
                console.log('New conversation added:', data)
                return data
            } catch (error) {
                console.error('Error adding conversation:', error)
                throw error
            }
        },
        onSuccess: (newConversation) => {
            queryClient.setQueryData<ConversationsResponse>(
                ['conversations', pagination.page],
                (oldData) => {
                    if (!oldData) return { conversations: [newConversation], total: 1 }
                    return {
                        ...oldData,
                        conversations: [newConversation, ...oldData.conversations],
                        total: oldData.total + 1,
                    }
                },
            )
        },
    })

    const selectConversation = useCallback((id: string) => {
        console.log(`Selecting conversation: ${id}`)
        setCurrentConversationId(id)
    }, [])

    const loadMoreConversations = useCallback(() => {
        if (
            !isLoadingConversations &&
            conversationsData &&
            conversationsData.conversations.length < pagination.totalConversations
        ) {
            console.log('Loading more conversations')
            setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
        }
    }, [isLoadingConversations, conversationsData, pagination.totalConversations])

    return {
        conversations: conversationsData?.conversations || [],
        currentConversationId,
        messages: messages || [],
        isLoading: isLoadingConversations || isLoadingMessages,
        error: conversationsError || messagesError,
        pagination,
        addConversation: addConversationMutation.mutateAsync,
        selectConversation,
        loadMoreConversations,
        setCurrentConversationId,
    }
}
