import React from 'react'
import { Input } from '@/_components/ui/input'
import { Button } from '@/_components/ui/button'

interface ChatInputProps {
    input: string
    setInput: (value: string) => void
    handleSubmit: (e: React.FormEvent) => void
    isStreaming: boolean
    isChatLoading: boolean
    cancelStream: () => void
}

export const ChatInput: React.FC<ChatInputProps> = ({
    input,
    setInput,
    handleSubmit,
    isStreaming,
    isChatLoading,
    cancelStream,
}) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            const form = e.currentTarget.form
            if (form) form.requestSubmit()
        }
    }

    return (
        <form onSubmit={handleSubmit} className=" bg-white">
            <div className="flex bg-white space-x-4">
                <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask for anything"
                    className=" bg-gray-100 px-2"
                    disabled={isStreaming || isChatLoading}
                />
                <Button
                    type="submit"
                    disabled={isStreaming || isChatLoading || !input.trim()}
                    className="px-4 bg-blue-500 hover:bg-blue-600 text-white">
                    {isStreaming ? 'Generating...' : 'Send'}
                </Button>
                {isStreaming && (
                    <Button
                        type="button"
                        onClick={cancelStream}
                        className="px-4 bg-gray-500 hover:bg-gray-600 text-white">
                        Stop
                    </Button>
                )}
            </div>
        </form>
    )
}
