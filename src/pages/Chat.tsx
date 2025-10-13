import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Sparkles, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      loadConversations(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async (uid: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      return;
    }

    setConversations(data || []);
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages((data || []).map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    })));
  };

  const createConversation = async () => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar uma nova conversa.",
        variant: "destructive",
      });
      return null;
    }

    setConversations([data, ...conversations]);
    setCurrentConversationId(data.id);
    setMessages([]);
    return data.id;
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    loadMessages(id);
  };

  const handleDeleteConversation = async (id: string) => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar a conversa.",
        variant: "destructive",
      });
      return;
    }

    setConversations(conversations.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ title: newTitle })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível renomear a conversa.",
        variant: "destructive",
      });
      return;
    }

    setConversations(
      conversations.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleDuplicateConversation = async (id: string) => {
    if (!userId) return;

    const originalConversation = conversations.find((c) => c.id === id);
    if (!originalConversation) return;

    // Load messages from original conversation
    const { data: originalMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    // Create new conversation
    const { data: newConversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        title: `${originalConversation.title} (cópia)`,
      })
      .select()
      .single();

    if (convError || !newConversation) {
      toast({
        title: "Erro",
        description: "Não foi possível duplicar a conversa.",
        variant: "destructive",
      });
      return;
    }

    // Copy messages to new conversation
    if (originalMessages && originalMessages.length > 0) {
      const messagesToInsert = originalMessages.map((msg) => ({
        conversation_id: newConversation.id,
        role: msg.role,
        content: msg.content,
      }));

      await supabase.from("messages").insert(messagesToInsert);
    }

    // Update conversations list
    await loadConversations(userId);
    setCurrentConversationId(newConversation.id);
    setMessages((originalMessages || []).map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    })));

    toast({
      title: "Conversa duplicada",
      description: "A conversa foi duplicada com sucesso.",
    });
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    // Prevenir envio se já estiver carregando
    if (isLoading) return;

    // Criar conversa se necessário
    let conversationId = currentConversationId;
    if (!conversationId && userId) {
      const newConvId = await createConversation();
      if (!newConvId) return; // Falhou ao criar conversa
      conversationId = newConvId;
    }

    if (!conversationId || !userId) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar uma conversa. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    // Preparar mensagem do usuário
    let userMessageContent = content;
    
    // Se houver arquivos, adicionar informação sobre eles
    if (files && files.length > 0) {
      const fileList = files.map((f) => `📎 ${f.name}`).join("\n");
      userMessageContent = content
        ? `${content}\n\n${fileList}`
        : fileList;
    }

    const userMessage: Message = { role: "user", content: userMessageContent };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setIsLoading(true);

    try {
      // Save user message
      const { error: insertError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: userMessageContent,
      });

      if (insertError) throw insertError;

      // Processar arquivos para base64
      let processedFiles = [];
      if (files && files.length > 0) {
        toast({
          title: "Processando arquivos...",
          description: "Extraindo conteúdo dos arquivos enviados.",
        });

        processedFiles = await Promise.all(
          files.map(async (file) => {
            return new Promise<{ name: string; type: string; data: string }>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve({
                  name: file.name,
                  type: file.type,
                  data: base64,
                });
              };
              reader.readAsDataURL(file);
            });
          })
        );
      }

      // Call AI with files
      const response = await supabase.functions.invoke("chat", {
        body: { 
          messages: currentMessages,
          files: processedFiles 
        },
      });

      if (response.error) {
        console.error("Edge function error:", response.error);
        throw new Error(response.error.message || "Erro ao chamar a IA");
      }

      if (!response.data?.body) {
        throw new Error("Resposta inválida da IA");
      }

      const reader = response.data.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;

          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantMessage += delta;
              setMessages((prev) => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length - 1]?.role === "assistant") {
                  newMessages[newMessages.length - 1].content = assistantMessage;
                }
                return newMessages;
              });
            }
          } catch (e) {
            console.error("Error parsing SSE:", e);
          }
        }
      }

      // Save assistant message
      if (assistantMessage) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: assistantMessage,
        });

        // Update conversation title if it's the first exchange
        if (currentMessages.length <= 1) {
          const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
          await handleRenameConversation(conversationId, title);
          await loadConversations(userId);
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
      // Remove a mensagem do assistente vazia em caso de erro
      setMessages((prev) => {
        const filtered = prev.filter((msg, idx) => {
          if (idx === prev.length - 1 && msg.role === "assistant" && !msg.content) {
            return false;
          }
          return true;
        });
        return filtered;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="flex h-screen">
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={createConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onDuplicateConversation={handleDuplicateConversation}
        />

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Plataforma IA</h1>
              <p className="text-xs text-muted-foreground">
                Assistente inteligente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary mb-6 shadow-glow">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Como posso ajudar você hoje?
                </h2>
                <p className="text-muted-foreground">
                  Faça perguntas, peça sugestões, ou solicite qualquer tipo de ajuda.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((message, index) => (
                <div key={index} className="mb-6">
                  <ChatMessage
                    {...message}
                    isStreaming={
                      isLoading &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                  />
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
