import { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { v4 as uuidv4 } from "uuid";

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

  const handleSendMessage = (content: string) => {
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

    // Simular resposta da IA
    setIsLoading(true);
    setTimeout(() => {
      const aiMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "Esta é uma resposta simulada da IA.",
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConversationId
            ? { ...c, messages: [...c.messages, aiMessage] }
            : c
        )
      );
      setIsLoading(false);
    }, 1000);
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
