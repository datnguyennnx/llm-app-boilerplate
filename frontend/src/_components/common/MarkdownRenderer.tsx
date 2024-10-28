import { memo } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { ClipboardCopy, Check } from 'lucide-react'
import { useState, useRef } from 'react'

interface MarkdownRendererProps {
    content: string
    isStreaming?: boolean
}

export const MarkdownRenderer = memo(({ content, isStreaming }: MarkdownRendererProps) => {
    const [isCopied, setIsCopied] = useState(false)
    const codeRef = useRef<HTMLDivElement>(null)

    const components: Components = {
        h3: ({ ...props }) => (
            <h3 className="text-xl font-semibold my-2 text-indigo-600" {...props} />
        ),
        h4: ({ ...props }) => (
            <h4 className="text-lg font-semibold my-2 text-indigo-500" {...props} />
        ),
        h5: ({ ...props }) => (
            <h5 className="text-md font-semibold my-2 text-indigo-400" {...props} />
        ),
        p: ({ ...props }) => <p className="leading-relaxed text-gray-700 my-0" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc pl-12" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-12" {...props} />,
        li: ({ ...props }) => <li className="mb-1" {...props} />,
        blockquote: ({ ...props }) => (
            <blockquote
                className="border-l-2 border-indigo-500 pl-4 italic my-4 text-gray-600"
                {...props}
            />
        ),
        a: ({ ...props }) => <a className="text-blue-500 hover:underline" {...props} />,
        code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = String(children).replace(/\n$/, '')

            if (!inline && match && !isStreaming) {
                return (
                    <SyntaxHighlighter
                        style={atomDark}
                        language={match[1]}
                        PreTag="div"
                        className="mockup-code scrollbar-thin scrollbar-track-base-content/5 scrollbar-thumb-base-content/40 scrollbar-track-rounded-md scrollbar-thumb-rounded"
                        showLineNumbers={true}
                        useInlineStyles={true}
                        {...props}>
                        {codeString}
                    </SyntaxHighlighter>
                )
            }

            return (
                <code
                    className={`${className} ${
                        inline
                            ? 'bg-gray-100 px-1 rounded'
                            : 'block bg-gray-800 text-white p-4 rounded-md'
                    }`}
                    {...props}>
                    {children}
                </code>
            )
        },
        pre({ children }: any) {
            const handleCopy = async () => {
                if (codeRef.current) {
                    const codeElement = codeRef.current.querySelector('code')
                    if (codeElement) {
                        const codeText = codeElement.innerText
                        const cleanedCode = codeText.replace(/^\s*\d+\s*|^\s*/gm, '').trim()
                        try {
                            await navigator.clipboard.writeText(cleanedCode)
                            setIsCopied(true)
                            setTimeout(() => setIsCopied(false), 2000)
                        } catch (err) {
                            console.error('Failed to copy text: ', err)
                        }
                    }
                }
            }

            return (
                <div className="relative overflow-x-auto" ref={codeRef}>
                    {!isStreaming && (
                        <button
                            onClick={handleCopy}
                            className="absolute right-2 top-4 z-50 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 p-2 transition-all duration-200 ease-in-out"
                            title={isCopied ? 'Copied!' : 'Copy code'}>
                            {isCopied ? <Check size={18} /> : <ClipboardCopy size={18} />}
                        </button>
                    )}
                    {children}
                </div>
            )
        },
        hr: ({ ...props }) => <hr className="my-4 border-t-2 border-gray-200" {...props} />,
        table: ({ ...props }) => (
            <div className="overflow-x-auto">
                <table className="my-0" {...props} />
            </div>
        ),
        thead: ({ ...props }) => <thead {...props} />,
        tbody: ({ ...props }) => <tbody {...props} />,
        tr: ({ ...props }) => <tr {...props} />,
        th: ({ ...props }) => <th {...props} />,
        td: ({ ...props }) => <td {...props} />,
    }

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
            className="prose prose-zinc dark:prose-invert max-w-none scroll-smooth focus:scroll-auto">
            {content}
        </ReactMarkdown>
    )
})

MarkdownRenderer.displayName = 'MarkdownRenderer'
