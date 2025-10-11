import { User, Bot, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";
  const [isDark, setIsDark] = useState(false);
  const { isSpeaking, speak, stop } = useSpeechSynthesis();

  const handlePlayAudio = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(content);
    }
  };

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "flex gap-4 p-6 animate-fade-in transition-smooth group",
        isUser ? "bg-background" : "bg-card"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-message",
          isUser
            ? "bg-primary text-primary-foreground"
            : "gradient-primary text-white"
        )}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <p className="text-sm font-medium">
          {isUser ? "Você" : "Assistente IA"}
        </p>
        {isUser ? (
          <div className="text-sm text-foreground whitespace-pre-wrap break-words">
            {content}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const { node, className, children, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match;
                    
                    return !isInline ? (
                      <SyntaxHighlighter
                        style={isDark ? oneDark : oneLight}
                        language={match[1]}
                        PreTag="div"
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...rest}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content || ""}
              </ReactMarkdown>
              {isStreaming && !content && (
                <div className="flex gap-1 items-center py-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" />
                  <span
                    className="w-2 h-2 bg-primary rounded-full animate-pulse-dot"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="w-2 h-2 bg-primary rounded-full animate-pulse-dot"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              )}
            </div>
            {content && !isStreaming && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-muted-foreground hover:text-foreground transition-smooth"
                onClick={handlePlayAudio}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="h-4 w-4" />
                    <span className="text-xs">Parar áudio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span className="text-xs">Ouvir resposta</span>
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
