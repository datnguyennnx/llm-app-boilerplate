import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ClipboardCopy } from 'lucide-react';
import { Components } from 'react-markdown';
import { CopyToClipboard } from 'react-copy-to-clipboard';

interface MarkdownRendererProps {
    content: string;
    isStreaming?: boolean;
}

interface CodeBlockProps {
    language: string;
    value: string;
}

export const MarkdownRenderer = ({
    content,
    isStreaming,
}: MarkdownRendererProps) => {
    const [processedContent, setProcessedContent] = useState('');

    useEffect(() => {
        if (isStreaming) {
            const lines = content.split('\n');
            const uniqueLines = lines.filter(
                (line, index) => lines.indexOf(line) === index
            );
            setProcessedContent(uniqueLines.join('\n'));
        } else {
            setProcessedContent(content);
        }
    }, [content, isStreaming]);

    const CodeBlock = useCallback(({ language, value }: CodeBlockProps) => {
        const [copyTip, setCopyTip] = useState("Copy code");
        
        return (
            <div className="relative my-4 overflow-x-auto">
                <CopyToClipboard
                    text={value}
                    onCopy={() => {
                        setCopyTip("Copied");
                        setTimeout(() => setCopyTip("Copy code"), 2000);
                    }}
                >
                    <button
                        className="absolute right-4 z-10 p-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600"
                        title={copyTip}
                    >
                        <ClipboardCopy size={18} />
                    </button>
                </CopyToClipboard>
                <SyntaxHighlighter
                    style={atomDark}
                    language={language}
                    PreTag="div"
                    className="mockup-code scrollbar-thin scrollbar-track-base-content/5 scrollbar-thumb-base-content/40 scrollbar-track-rounded-md scrollbar-thumb-rounded"
                    showLineNumbers={true}
                    useInlineStyles={true}
                >
                    {value}
                </SyntaxHighlighter>
                <span
                    style={{
                    bottom: 0,
                    right: 0,
                    }}
                    className="absolute z-40 mb-5 mr-1 rounded-lg bg-base-content/40 p-1 text-xs uppercase text-base-300 backdrop-blur-sm"
                >
                    {language}
                </span>
            </div>
        );
    }, []);

    const components: Components = {
        h1: ({ node, ...props }) => (
            <h1
                className="text-3xl font-bold my-0 text-pink-700"
                {...props}
            />
        ),
        h2: ({ node, ...props }) => (
            <h2
                className="text-2xl font-semibold my-0 text-pink-600"
                {...props}
            />
        ),
        h3: ({ node, ...props }) => (
            <h3
                className="text-xl font-medium my-0 text-pink-500"
                {...props}
            />
        ),
        h4: ({ node, ...props }) => (
            <h4
                className="text-lg font-medium my-0 text-pink-400"
                {...props}
            />
        ),
        p: ({ node, ...props }) => (
            <p className="leading-relaxed text-gray-700" {...props} />
        ),
        ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6" {...props} />
        ),
        ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6" {...props} />
        ),
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        blockquote: ({ node, ...props }) => (
            <blockquote
                className="border-l-4 border-indigo-500 pl-4 italic my-4 text-gray-600"
                {...props}
            />
        ),
        a: ({ node, ...props }) => (
            <a className="text-blue-500 hover:underline" {...props} />
        ),

        code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const value = String(children).replace(/\n$/, '');

            if (!inline && match) {
                return <CodeBlock language={language} value={value} />;
            }

            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        hr: ({ node, ...props }) => (
            <hr className="my-4 border-t-2 border-gray-200" {...props} />
        ),
        table: ({ node, ...props }) => (
            <div className="overflow-x-auto ">
                <table className="my-0" {...props} />
            </div>
        ),
        thead: ({ node, ...props }) => <thead {...props} />,
        tbody: ({ node, ...props }) => <tbody {...props} />,
        tr: ({ node, ...props }) => <tr {...props} />,
        th: ({ node, ...props }) => <th {...props} />,
        td: ({ node, ...props }) => <td {...props} />,
    };

    return (
        <div className="prose prose-zinc dark:prose-invert max-w-none scroll-smooth focus:scroll-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};
