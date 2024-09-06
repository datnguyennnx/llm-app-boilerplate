import React from 'react'
import { LogoDwarves, LogoUser } from './Logo'
import { MarkdownRenderer } from './MarkdownRenderer'
import { LoadingDots } from './LoadingDots'

interface ChatRowProps {
    message: string
    isUser: boolean
    bgColor: string
    isLoading?: boolean
}

export const ChatRow = ({
    message,
    isUser,
    bgColor,
    isLoading,
}: ChatRowProps) => {
    return (
        <div
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 w-full`}
        >
            <div
                className={`flex items-start ${
                    isUser ? 'flex-row-reverse' : ''
                } max-w-[80%]`}
            >
                <div className="w-8 h-8 flex-shrink-0 mt-1">
                    {isUser ? <LogoUser /> : <LogoDwarves />}
                </div>
                <div
                    className={`mx-2 py-3 px-4 ${bgColor} rounded-lg ${
                        isUser ? 'rounded-tr-none' : 'rounded-tl-none'
                    } break-words flex-grow`}
                >
                    {isLoading ? (
                        <LoadingDots />
                    ) : (
                        <MarkdownRenderer content={message} />
                    )}
                </div>
            </div>
        </div>
    )
}
