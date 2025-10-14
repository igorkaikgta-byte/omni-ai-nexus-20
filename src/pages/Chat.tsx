import { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Nova Conversa",
      messages: [],
    },
  ]);
  const [currentConversationId, setCurrentConversationId] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);

  const currentConversation = conversations.find(
    (c) => c.id === currentConversationId
  );

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: uuidv4(),
      title: "Nova Conversa",
      messages: [],
    };
    setConversations([...conversations, newConv]);
    setCurrentConversationId(newConv.id);
  };

  const handleDeleteConversation = (id: string) => {
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    
    if (currentConversationId === id) {
      setCurrentConversationId(filtered[0]?.id || "");
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(
      conversations.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleDuplicateConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;

    const duplicate: Conversation = {
      id: uuidv4(),
      title: `${conv.title} (Cópia)`,
      messages: [...conv.messages],
    };
    setConversations([...conversations, duplicate]);
  };

  const { toast } = useToast();

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!currentConversationId) return;

    const newMessage: Message = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setConversations(
      conversations.map((c) =>
        c.id === currentConversationId
          ? {
              ...c,
              messages: [...c.messages, newMessage],
              title: c.messages.length === 0 ? content.slice(0, 30) : c.title,
            }
          : c
      )
    );

    setIsLoading(true);

    // Criar mensagem de assistente vazia para streaming
    const assistantMessageId = uuidv4();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConversationId
          ? { ...c, messages: [...c.messages, assistantMessage] }
          : c
      )
    );

    try {
      // Preparar arquivos para envio
      let processedFiles: any[] = [];
      if (files && files.length > 0) {
        processedFiles = await Promise.all(
          files.map(async (file) => {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
              };
              reader.readAsDataURL(file);
            });

            return {
              name: file.name,
              type: file.type,
              data: base64,
            };
          })
        );
      }

      // Obter histórico de mensagens
      const currentConv = conversations.find(c => c.id === currentConversationId);
      const messageHistory = currentConv?.messages.map(m => ({
        role: m.role,
        content: m.content,
      })) || [];

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messageHistory, { role: 'user', content }],
          files: processedFiles.length > 0 ? processedFiles : undefined,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Falha ao iniciar streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulatedContent += content;
              
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === currentConversationId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantMessageId
                            ? { ...m, content: accumulatedContent }
                            : m
                        ),
                      }
                    : c
                )
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
      
      // Remover a mensagem de assistente vazia em caso de erro
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConversationId
            ? {
                ...c,
                messages: c.messages.filter((m) => m.id !== assistantMessageId),
              }
            : c
        )
      );
      
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0">
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversationId}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onDuplicateConversation={handleDuplicateConversation}
        />
      </div>

      {/* Área principal do chat */}
      <div className="flex flex-1 flex-col">
        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentConversation?.messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                Envie uma mensagem para começar
              </p>
            </div>
          ) : (
            currentConversation?.messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))
          )}
        </div>

        {/* Input de mensagem */}
        <div className="border-t bg-background p-4">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
