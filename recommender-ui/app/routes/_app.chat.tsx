import { useState, useEffect, useRef, useCallback } from 'react'
import { json, LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node'
import {
    useLoaderData,
    useActionData,
    useSubmit,
    useNavigation,
    useNavigate,
} from '@remix-run/react'
import { BackgroundDots } from '~/components/BackgroundDot'
import { Dot } from '~/components/Dot'
import { ChatRow } from '~/components/ChatRow'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'

interface Message {
    content: string
    isUser: boolean
    isStreaming: boolean
}

const WEBSOCKET_URL = 'ws://localhost:8000/ws/chat'

export const loader = async ({ request }: LoaderFunctionArgs) => {
    return json({
        initialMessage: 'Hi there. May I help you with anything?',
    })
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const message = formData.get('message')
    return json({ response: `You said: ${message}` })
}

export default function Chat() {
    const { initialMessage } = useLoaderData<typeof loader>()
    const navigate = useNavigate()

    const [messages, setMessages] = useState<Message[]>([
        { content: initialMessage, isUser: false, isStreaming: false },
    ])
    const [input, setInput] = useState('')
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const socketRef = useRef<WebSocket | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const connectWebSocket = useCallback(() => {
        const token = sessionStorage.getItem('accessToken')
        if (!token) {
            navigate('/login')
            return
        }

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            return
        }

        socketRef.current = new WebSocket(`${WEBSOCKET_URL}?token=${token}`)

        socketRef.current.onopen = () => {
            console.log('WebSocket connection established')
            setIsConnected(true)
        }

        socketRef.current.onmessage = (event) => {
            if (event.data === '[END]') {
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages]
                    updatedMessages[updatedMessages.length - 1].isStreaming =
                        false
                    return updatedMessages
                })
                setIsLoading(false)
            } else {
                setIsLoading(false)
                setMessages((prevMessages) => {
                    const lastMessage = prevMessages[prevMessages.length - 1]
                    if (!lastMessage || lastMessage.isUser) {
                        return [
                            ...prevMessages,
                            {
                                content: event.data,
                                isUser: false,
                                isStreaming: true,
                            },
                        ]
                    } else {
                        const updatedMessages = [...prevMessages]
                        updatedMessages[updatedMessages.length - 1] = {
                            ...lastMessage,
                            content: lastMessage.content + event.data,
                            isStreaming: true,
                        }
                        return updatedMessages
                    }
                })
            }
        }

        socketRef.current.onerror = (error) => {
            console.error('WebSocket error:', error)
            setIsConnected(false)
        }

        socketRef.current.onclose = (event) => {
            console.log(
                'WebSocket connection closed:',
                event.code,
                event.reason,
            )
            setIsConnected(false)
            if (event.code === 1008) {
                console.error('Authentication failed. Redirecting to login.')
                sessionStorage.removeItem('accessToken')
                navigate('/login')
            } else {
                setTimeout(connectWebSocket, 3000)
            }
        }
    }, [navigate])

    useEffect(() => {
        connectWebSocket()

        return () => {
            if (socketRef.current) {
                socketRef.current.close()
            }
        }
    }, [connectWebSocket])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (input.trim() && isConnected) {
            sendMessage(input)
            setInput('')
            setIsLoading(true)
        }
    }

    const sendMessage = (message: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            setMessages((prev) => [
                ...prev,
                { content: message, isUser: true, isStreaming: false },
            ])
            socketRef.current.send(message)
        } else {
            console.error('WebSocket is not connected')
            setMessages((prev) => [
                ...prev,
                {
                    content: 'Error: Unable to send message. Please try again.',
                    isUser: false,
                    isStreaming: false,
                },
            ])
            setIsLoading(false)
            connectWebSocket()
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center p-8 relative">
            <BackgroundDots className="absolute inset-0 z-0" />
            <div className="w-full max-w-5xl z-10 relative">
                <div className="drop-shadow-lg rounded-lg overflow-hidden">
                    <div className="h-[calc(100vh-11rem)] overflow-y-auto p-8 bg-white no-scrollbar">
                        {messages.map((message, index) => (
                            <ChatRow
                                key={index}
                                message={message.content}
                                isUser={message.isUser}
                                bgColor={
                                    message.isUser
                                        ? 'bg-blue-100'
                                        : 'bg-gray-100'
                                }
                                isStreaming={message.isStreaming}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSubmit} className="p-4 bg-white ">
                        <div className="flex bg-white">
                            <Input
                                type="text"
                                name="message"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask for anything"
                                className="flex-grow mr-2 bg-gray-100"
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !isConnected}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                Send
                            </Button>
                        </div>
                    </form>
                    <div className="px-6 py-2 space-x-4 text-sm text-gray-500 border-gray-200 bg-white flex items-center">
                        <div className="flex items-center">
                            <Dot status={isConnected} />
                            <p>Connection</p>
                        </div>
                        <div className="flex items-center">
                            <Dot status={isLoading} />
                            <p>Generating</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
