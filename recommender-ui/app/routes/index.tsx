import React, { useState } from 'react';
import { ChatRow } from '~/components/ChatRow';
import { LogoDwarves } from '~/components/Logo';

export default function Index() {
    const [messages, setMessages] = useState<
        Array<{ content: string; isUser: boolean }>
    >([]);
    const [inputMessage, setInputMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputMessage.trim()) {
            setMessages([...messages, { content: inputMessage, isUser: true }]);
            // Here you would typically send the message to your backend and get a response
            // For now, we'll just simulate a response
            setTimeout(() => {
                setMessages((prev) => [
                    ...prev,
                    { content: 'This is a simulated response.', isUser: false },
                ]);
            }, 1000);
            setInputMessage('');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-white shadow-sm p-4">
                <div className="container mx-auto flex items-center">
                    <LogoDwarves />
                    <h1 className="ml-4 text-xl font-semibold text-gray-800">
                        Recommender Chat
                    </h1>
                </div>
            </header>
            <main className="flex-grow container mx-auto p-4 overflow-auto">
                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <ChatRow
                            key={index}
                            message={message.content}
                            isUser={message.isUser}
                            bgColor={
                                message.isUser ? 'bg-blue-100' : 'bg-gray-100'
                            }
                        />
                    ))}
                </div>
            </main>
            <footer className="bg-white border-t border-gray-200 p-4">
                <form
                    onSubmit={handleSubmit}
                    className="container mx-auto flex"
                >
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-grow mr-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type your message..."
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Send
                    </button>
                </form>
            </footer>
        </div>
    );
}
