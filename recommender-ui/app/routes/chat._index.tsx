import { useEffect, useRef, useCallback } from 'react'
import { json, LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { BackgroundDots } from '~/components/BackgroundDot'
import { Dot } from '~/components/Dot'
import { ChatRow } from '~/components/ChatRow'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { useAuth } from '~/hooks/useAuth'
import { useSSE } from '~/hooks/useSSE'

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const BACKEND_URL = process.env.BACKEND_URL
    if (!BACKEND_URL) {
        throw new Error('BACKEND_URL is not defined in environment variables')
    }
    return json({
        initialMessage: 'Hi there. May I help you with anything?',
        BACKEND_URL,
    })
}

export default function Chat() {
    const { initialMessage, BACKEND_URL } = useLoaderData<typeof loader>()
    const navigate = useNavigate()
    const { getAuthTokens } = useAuth()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const {
        messages,
        isLoading,
        isStreaming,
        error: connectionError,
        sendMessage,
        setMessages,
        cancelStream,
    } = useSSE(BACKEND_URL)

    useEffect(() => {
        const { accessToken } = getAuthTokens()
        if (!accessToken) {
            navigate('/login')
        }
    }, [getAuthTokens, navigate])

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ content: initialMessage, isUser: false }])
        }
    }, [initialMessage, messages.length, setMessages])

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const message = formData.get('message') as string
            if (message.trim() && !isLoading && !isStreaming) {
                sendMessage(message)
                e.currentTarget.reset()
            }
        },
        [isLoading, isStreaming, sendMessage],
    )

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
                                isLoading={
                                    !message.isUser &&
                                    index === messages.length - 1 &&
                                    isLoading
                                }
                                isStreaming={
                                    !message.isUser &&
                                    index === messages.length - 1 &&
                                    isStreaming
                                }
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSubmit} className="p-4 bg-white ">
                        <div className="flex bg-white">
                            <Input
                                type="text"
                                name="message"
                                placeholder="Ask for anything"
                                className="flex-grow mr-2 bg-gray-100"
                                disabled={isLoading || isStreaming}
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || isStreaming}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                Send
                            </Button>
                        </div>
                    </form>
                    <div className="px-6 py-2 space-x-4 text-sm text-gray-800 border-gray-200 bg-white flex items-center">
                        <div className="flex items-center">
                            <Dot status={!connectionError} />
                            <p>Connection</p>
                        </div>
                        <div className="flex items-center">
                            <Dot status={isLoading || isStreaming} />
                            <p>
                                {isLoading
                                    ? 'Loading'
                                    : isStreaming
                                      ? 'Streaming'
                                      : 'Idle'}
                            </p>
                        </div>
                        {connectionError && (
                            <div className="flex items-center text-red-500">
                                <p>{connectionError}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
