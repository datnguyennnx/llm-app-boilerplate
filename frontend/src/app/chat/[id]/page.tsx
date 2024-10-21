'use client'

import { FC, useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { ChatRow } from '@/components/chat/ChatRow'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BackgroundDots } from '@/components/layout/BackgroundDots'
import { Dot } from '@/components/common/Dot'
import { useSSE } from '@/hooks/useSSE'
import { useConversation } from '@/hooks/useConversation'
import { ConversationAside } from '@/components/chat/ConversationAside'

interface ChatPageProps {
    params: {
        id: string
    }
}

interface UnifiedMessage {
    id?: string
    content: string
    sender: 'user' | 'llm'
    isStreaming?: boolean
    created_at?: string
}

const ChatPage: FC<ChatPageProps> = ({ params }) => {
    const router = useRouter()
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const {
        messages: sseMessages,
        isLoading: isChatLoading,
        isStreaming,
        error: chatError,
        sendMessage,
    } = useSSE(baseUrl)
    const {
        conversations,
        currentConversationId,
        messages: conversationMessages,
        isLoading: isConversationLoading,
        error: conversationError,
        addConversation,
        loadMoreConversations,
        pagination,
        selectConversation,
    } = useConversation(baseUrl)
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (params.id && params.id !== currentConversationId) {
            selectConversation(params.id)
        }
    }, [params.id, currentConversationId, selectConversation])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversationMessages, sseMessages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const chatRequest = {
            message: input,
            conversation_id: currentConversationId || undefined,
            model_type: 'openai',
            model_name: 'gpt-3.5-turbo',
            temperature: 0.7,
        }

        await sendMessage(chatRequest)
        setInput('')
    }

    const handleNewConversation = async () => {
        try {
            const newConversation = await addConversation('New Conversation')
            router.push(`/chat/${newConversation.id}`)
        } catch (error) {
            console.error('Error creating new conversation:', error)
        }
    }

    const hasMoreConversations = conversations.length < pagination.totalConversations

    const allMessages: UnifiedMessage[] = [
        ...conversationMessages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender as 'user' | 'llm',
            created_at: msg.created_at,
        })),
        ...sseMessages.map(
            (msg) =>
                ({
                    content: msg.content,
                    sender: msg.isUser ? 'user' : 'llm',
                    isStreaming: msg.isStreaming,
                }) as UnifiedMessage,
        ),
    ]

    return (
        <ProtectedRoute>
            <main className="flex min-h-screen relative">
                <BackgroundDots className="absolute inset-0 z-0" />
                <ConversationAside
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onSelectConversation={(id) => router.push(`/chat/${id}`)}
                    onNewConversation={handleNewConversation}
                    isLoading={isConversationLoading}
                    error={conversationError?.message || null}
                    onLoadMore={loadMoreConversations}
                    hasMoreConversations={hasMoreConversations}
                />
                <div className="flex w-full z-10 justify-center items-center">
                    <div className="w-4/5 drop-shadow-lg rounded-lg overflow-hidden">
                        <div className="h-[calc(100vh-11rem)] overflow-y-auto p-8 bg-white no-scrollbar">
                            {allMessages.map((message, index) => (
                                <ChatRow
                                    key={message.id || index}
                                    message={message.content}
                                    isUser={message.sender === 'user'}
                                    bgColor={
                                        message.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                                    }
                                    isLoading={false}
                                    isStreaming={message.isStreaming || false}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 bg-white">
                            <div className="flex bg-white">
                                <Input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask for anything"
                                    className="flex-grow mr-2 bg-gray-100"
                                    disabled={isChatLoading || isStreaming}
                                />
                                <Button
                                    type="submit"
                                    disabled={isChatLoading || isStreaming}
                                    className="bg-blue-500 hover:bg-blue-600 text-white">
                                    Send
                                </Button>
                            </div>
                        </form>
                        <div className="px-6 py-2 space-x-4 text-sm text-gray-500 border-gray-200 bg-white flex items-center">
                            <div className="flex items-center">
                                <Dot status={!chatError} />
                                <p>Connection</p>
                            </div>
                            <div className="flex items-center">
                                <Dot status={isChatLoading || isStreaming} />
                                <p>Generating</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    )
}

export default ChatPage
