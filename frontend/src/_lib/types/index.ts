// Centralized type definitions
export interface User {
    id: string
    name?: string
    email?: string
    image?: string
}

export interface AuthContextType {
    user: User | null
    loading: boolean
    error: Error | null
    login: () => Promise<void>
    logout: () => Promise<void>
}

export interface ChatMessage {
    id: string
    content: string
    role: 'user' | 'assistant'
    createdAt: string
}

export interface Conversation {
    id: string
    title: string
    messages: ChatMessage[]
    createdAt: string
    updatedAt: string
}
