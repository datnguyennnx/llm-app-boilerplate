export interface User {
    email: string
    id: string
    google_id: string
    picture: string
}

export interface AuthContextType {
    user: User | null
    login: () => Promise<void>
    logout: () => Promise<void>
    isAuthenticated: boolean
    isLoading: boolean
    isAuthenticating: boolean
    error: Error | null
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>
}
