import React from "react";
import { LogoDwarves, LogoUser } from "./Logo";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";

interface ChatRowProps {
  message: string;
  isUser: boolean;
  bgColor?: string;
}

const ChatRow: React.FC<ChatRowProps> = ({ message, isUser, bgColor }) => {
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 w-full`}
    >
      <div
        className={`flex items-start ${
          isUser ? "flex-row-reverse" : ""
        } max-w-[80%]`}
      >
        <div className="w-8 h-8 flex-shrink-0 mt-1">
          {isUser ? <LogoUser /> : <LogoDwarves />}
        </div>
        <div
          className={`mx-2 py-3 px-4 ${bgColor} rounded-lg ${
            isUser ? "rounded-tr-none" : "rounded-tl-none"
          } break-words flex-grow`}
        >
          <ReactMarkdown
            className="text-sm prose prose-sm max-w-none"
            remarkPlugins={[gfm]}
            components={{
              p: ({ children, ...props }) => (
                <p className="mb-2 last:mb-0" {...props}>
                  {children}
                </p>
              ),
              ul: ({ children, ...props }) => (
                <ul className="list-disc pl-4 mb-2" {...props}>
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="list-decimal pl-4 mb-2" {...props}>
                  {children}
                </ol>
              ),
              li: ({ children, ...props }) => (
                <li className="mb-1" {...props}>
                  {children}
                </li>
              ),
              a: ({ children, ...props }) => (
                <a className="text-blue-500 hover:underline" {...props}>
                  {children}
                </a>
              ),
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                return className ? (
                  <pre className="bg-gray-100 rounded p-2 my-2 whitespace-pre-wrap">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-gray-100 rounded px-1 py-0.5" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatRow;
