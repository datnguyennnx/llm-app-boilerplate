import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
    content: string;
    isStreaming?: boolean;
}

const SimpleCodeHighlighter = ({
    language,
    children,
}: {
    language?: string;
    children: string;
}) => {
    const highlightCode = (code: string) => {
        // Basic syntax highlighting
        return code
            .replace(
                /\b(const|let|var|function|return|if|else|for|while)\b/g,
                '<span class="keyword">$1</span>'
            )
            .replace(
                /\b(true|false|null|undefined)\b/g,
                '<span class="builtin">$1</span>'
            )
            .replace(
                /(["'`])(?:(?=(\\?))\2.)*?\1/g,
                '<span class="string">$&</span>'
            )
            .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
            .replace(/\/\/.*/g, '<span class="comment">$&</span>')
            .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    };

    return (
        <pre className={`language-${language || 'text'}`}>
            <code
                dangerouslySetInnerHTML={{ __html: highlightCode(children) }}
            />
        </pre>
    );
};

export const MarkdownRenderer = ({
    content,
    isStreaming,
}: MarkdownRendererProps) => {
    const [processedContent, setProcessedContent] = useState('');

    useEffect(() => {
        if (isStreaming) {
            // Simple deduplication logic
            const lines = content.split('\n');
            const uniqueLines = lines.filter(
                (line, index) => lines.indexOf(line) === index
            );
            setProcessedContent(uniqueLines.join('\n'));
        } else {
            setProcessedContent(content);
        }
    }, [content, isStreaming]);

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
        h4: ({ node, ...props }) => (
            <h4 className="text-lg font-medium text-indigo-300" {...props} />
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
            return !inline && match ? (
                <SimpleCodeHighlighter language={match[1]}>
                    {String(children).replace(/\n$/, '')}
                </SimpleCodeHighlighter>
            ) : (
                <code
                    className="bg-gray-100 rounded px-1 py-0.5 text-sm"
                    {...props}
                >
                    {children}
                </code>
            );
        },
        img: ({ node, ...props }) => (
            <img
                className="max-w-full h-auto rounded-lg shadow-md my-4"
                {...props}
                alt={props.alt || ''}
            />
        ),
        hr: ({ node, ...props }) => (
            <hr className="my-4 border-t-2 border-gray-200" {...props} />
        ),
        table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
                <table
                    className="min-w-full divide-y divide-gray-200 border"
                    {...props}
                />
            </div>
        ),
        thead: ({ node, ...props }) => (
            <thead className="bg-gray-50" {...props} />
        ),
        tbody: ({ node, ...props }) => (
            <tbody className="bg-white divide-y divide-gray-200" {...props} />
        ),
        tr: ({ node, ...props }) => (
            <tr className="hover:bg-gray-50" {...props} />
        ),
        th: ({ node, ...props }) => (
            <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r last:border-r-0"
                {...props}
            />
        ),
        td: ({ node, ...props }) => (
            <td
                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r last:border-r-0"
                {...props}
            />
        ),
    };

    return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={components}
                >
                    {processedContent}
                </ReactMarkdown>
        </div>
    );
};
