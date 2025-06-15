
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  return (
    <ReactMarkdown
      className={cn("prose prose-sm max-w-none", className)}
      components={{
        // Customize heading styles
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-foreground">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-foreground">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-foreground">{children}</h3>,
        
        // Customize paragraph styles
        p: ({ children }) => <p className="mb-2 text-foreground leading-relaxed">{children}</p>,
        
        // Customize list styles
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-foreground">{children}</li>,
        
        // Customize emphasis
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic text-foreground">{children}</em>,
        
        // Customize code
        code: ({ children }) => (
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">
            {children}
          </code>
        ),
        
        // Customize blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-2">
            {children}
          </blockquote>
        ),
        
        // Customize horizontal rules
        hr: () => <hr className="border-border my-4" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
