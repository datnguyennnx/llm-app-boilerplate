import { useState, useEffect } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { ClipboardCopy } from 'lucide-react'
import CopyToClipboard from 'react-copy-to-clipboard'

interface MarkdownRendererProps {
    content: string
    isStreaming?: boolean
}

export const MarkdownRenderer = ({
    content,
    isStreaming,
}: MarkdownRendererProps) => {
    const [processedContent, setProcessedContent] = useState('')

    useEffect(() => {
        if (isStreaming) {
            const lines = content.split('\n')
            const uniqueLines = lines.filter(
                (line, index) => lines.indexOf(line) === index,
            )
            setProcessedContent(uniqueLines.join('\n'))
        } else {
            setProcessedContent(content)
        }
    }, [content, isStreaming])

    const components: Components = {
        h1: ({...props }) => (
            <h1 className="text-3xl font-bold my-0 text-indigo-800" {...props} />
        ),

        h2: ({...props }) => (
            <h2
                className="text-2xl font-semibold my-0 text-indigo-700"
                {...props}
            />
        ),

        h3: ({...props }) => (
            <h3 className="text-xl font-medium my-0 text-indigo-600" {...props} />
        ),

        h4: ({...props }) => (
            <h4 className="text-lg font-medium my-0 text-indigo-500" {...props} />
        ),

        p: ({...props }) => (
            <p className="leading-relaxed text-gray-700 my-0" {...props} />
        ),

        ul: ({...props }) => (
            <ul className="list-disc pl-6" {...props} />
        ),

        ol: ({...props }) => (
            <ol className="list-decimal pl-6" {...props} />
        ),

        li: ({...props }) => <li className="mb-1" {...props} />,

        blockquote: ({...props }) => (
            <blockquote
                className="border-l-2 border-indigo-500 pl-4 italic my-4 text-gray-600"
                {...props}
            />
        ),

        a: ({...props }) => (
            <a className="text-blue-500 hover:underline" {...props} />
        ),

        code({inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    className="mockup-code scrollbar-thin scrollbar-track-base-content/5 scrollbar-thumb-base-content/40 scrollbar-track-rounded-md scrollbar-thumb-rounded"
                    showLineNumbers={true}
                    useInlineStyles={true}
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },

        pre({ children, ...props }: any) {
            const codeElement = children && children.length > 0 ? children[0] : null;
            const codeChildren = codeElement && codeElement.props ? codeElement.props.children : '';
            const codeChunk = String(codeChildren).replace(/\n$/, '');
            const [copyTip, setCopyTip] = useState("Copy code");

            return (
                <div className="relative overflow-x-auto">
                    <CopyToClipboard
                        text={codeChunk}
                        onCopy={() => {
                            setCopyTip("Copied");
                            setTimeout(() => setCopyTip("Copy code"), 2000);
                        }}
                    >
                        <button
                            className="absolute right-2 top-4 z-50 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600"
                            title={copyTip}
                        >
                            <ClipboardCopy size={18} />
                        </button>
                    </CopyToClipboard>
                    {children}
                </div>
            );
        },


        hr: ({...props }) => (
            <hr className="my-4 border-t-2 border-gray-200" {...props} />
        ),

        table: ({...props }) => (
            <div className="overflow-x-auto ">
                <table className="my-0" {...props} />
            </div>
        ),
        
        thead: ({...props }) => <thead {...props} />,
        tbody: ({...props }) => <tbody {...props} />,
        tr: ({...props }) => <tr {...props} />,
        th: ({...props }) => <th {...props} />,
        td: ({...props }) => <td {...props} />,
    }

    return (
        <div className="prose prose-zinc dark:prose-invert max-w-none scroll-smooth focus:scroll-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {processedContent}
            </ReactMarkdown>
        </div>
    )
}
