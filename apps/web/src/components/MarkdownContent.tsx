import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';

const customTheme = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'rgba(0, 0, 0, 0.4)',
    margin: '8px 0',
    borderRadius: '8px',
    border: '1px solid rgba(234, 179, 8, 0.08)',
    fontSize: '0.8rem',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.8rem',
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute right-2 top-2 rounded-md border border-hermes-500/20 bg-void-600/80 p-1.5 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-hermes-500/10 hover:text-hermes-300"
      title="Copy code"
    >
      {copied ? <Check size={13} className="text-terminal-green" /> : <Copy size={13} />}
    </button>
  );
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-stream">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...rest }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (match) {
              return (
                <div className="group relative">
                  <CopyButton text={codeString} />
                  <SyntaxHighlighter
                    style={customTheme}
                    language={match[1]}
                    PreTag="div"
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
