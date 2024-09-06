import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { nightOwl } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Components } from 'react-markdown'

interface MarkdownRendererProps {
    content: string
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
    const components: Components = {
        h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold text-indigo-600" {...props} />
        ),
        h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-semibold text-indigo-500" {...props} />
        ),
        h3: ({ node, ...props }) => (
            <h3 className="text-xl font-medium text-indigo-400" {...props} />
        ),
        p: ({ node, ...props }) => (
            <p className=" leading-relaxed text-gray-700" {...props} />
        ),
        ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 " {...props} />
        ),
        ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 " {...props} />
        ),
        li: ({ node, ...props }) => <li className="" {...props} />,
        blockquote: ({ node, ...props }) => (
            <blockquote
                className="border-l-4 border-indigo-500 pl-4 italic my-4 text-gray-600"
                {...props}
            />
        ),
        a: ({ node, ...props }) => (
            <a className="text-blue-500 hover:underline" {...props} />
        ),
        code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
                <SyntaxHighlighter
                    style={nightOwl}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md overflow-hidden my-4"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code
                    className="bg-gray-100 rounded px-1 py-0.5 text-sm"
                    {...props}
                >
                    {children}
                </code>
            )
        },
        img: ({ node, ...props }) => (
            <img
                className="max-w-full h-auto rounded-lg shadow-md my-4"
                {...props}
                alt={props.alt || ''}
            />
        ),
        hr: ({ node, ...props }) => (
            <hr className="my-8 border-t-2 border-gray-200" {...props} />
        ),
    }

    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
        </ReactMarkdown>
    )
}
