export interface Message {
    id: string
    content: string
    role: 'user' | 'llm'
}

export interface ChatRequest {
    message: string
    conversation_id?: string
    model_type?: string
    model_name?: string
    temperature?: number
}

export interface StreamResponse {
    data?: string
    error?: string
}

export interface StreamingState {
    content: string
    isComplete: boolean
    userMessage?: string
}

export interface Conversation {
    id: string
    title: string
    created_at: string
}

export interface PaginatedResponse<T> {
    data: T[]
    page: number
    total_pages: number
    total_count: number
    per_page: number
}

export interface ConversationResponse {
    conversations: Conversation[]
    page: number
    total_pages: number
    total_count: number
    per_page: number
}

export interface MessageResponse {
    messages: Message[]
    total_count: number
}

export interface ConversationResult {
    conversations: Conversation[]
    currentConversationId: string | null
    messages: Message[]
    isLoading: boolean
    hasMoreConversations: boolean
    isLoadingMoreConversations: boolean
    hasNextPage: boolean
    isFetchingNextPage: boolean
    loadMoreConversations: () => void
    addConversation: (title: string) => Promise<Conversation>
    selectConversation: (id: string) => void
}

export interface ChatInputProps {
    input: string
    setInput: (value: string) => void
    handleSubmit: (e: React.FormEvent) => void
    isStreaming: boolean
    isChatLoading: boolean
    cancelStream: () => void
}

export interface SSEResult {
    isLoading: boolean
    isStreaming: boolean
    streamingContent: string | null
    streamingState: StreamingState
    error: string | null
    startStream: (request: ChatRequest) => Promise<void>
    sendMessage: (request: ChatRequest) => void
    cancelStream: () => void
}

export interface ChatLogicResult {
    input: string
    setInput: (value: string) => void
    messages: Message[]
    isStreaming: boolean
    streamingContent: string | null
    isChatLoading: boolean
    isConversationLoading: boolean
    conversations: Conversation[]
    currentConversationId: string | null
    streamingState: StreamingState
    loadMoreConversations: () => void
    handleNewConversation: () => Promise<void>
    handleSubmit: (e: React.FormEvent) => Promise<void>
    handleSelectConversation: (id: string) => void
    cancelStream: () => void
    isLoading: boolean
    hasMoreConversations: boolean
    isLoadingMoreConversations: boolean
    hasNextPage: boolean
    isFetchingNextPage: boolean
}

export interface MessageListProps {
    messages: Message[]
    isStreaming: boolean
    streamingState?: StreamingState
}
