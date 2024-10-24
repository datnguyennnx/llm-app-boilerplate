import { Logo } from '@/components/common/Logo'
import { LoadingDots } from '@/components/common/LoadingDots'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'

interface ChatRowProps {
    message: string
    isUser: boolean
    bgColor: string
    isLoading: boolean
    isStreaming: boolean
}

export const ChatRow = ({ message, isUser, bgColor, isLoading, isStreaming }: ChatRowProps) => {
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 w-full`}>
            <div className={`flex items-start ${isUser ? 'flex-row-reverse' : ''} max-w-[75%]`}>
                <div className="w-8 h-8 flex-shrink-0 mt-1">
                    {isUser ? <Logo type="user" /> : <Logo type="robot" />}
                </div>
                <div
                    className={`mx-2 py-3 px-4 ${bgColor} rounded-lg ${
                        isUser ? 'rounded-tr-none' : 'rounded-tl-none'
                    } break-words flex-grow`}
                >
                    {isLoading && !isStreaming ? (
                        <LoadingDots />
                    ) : (
                        <MarkdownRenderer content={message} isStreaming={isStreaming} />
                    )}
                </div>
            </div>
        </div>
    )
}
