import { Send, Paperclip, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { sendMessageToBackend } from "../Integrações/Supabase/backendClient";

interface ChatInputProps {
  onSendMessage: (content: string, files?: File[], isUser?: boolean) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  // Atualiza a mensagem quando o transcript muda
  useEffect(() => {
    if (transcript) setMessage(transcript);
  }, [transcript]);

  const handleMicClick = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Valida tamanho dos arquivos (max 20MB)
    const invalidFiles = files.filter(f => f.size > 20 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast({ title: "Arquivo muito grande", description: "Cada arquivo deve ter no máximo 20MB.", variant: "destructive" });
      return;
    }

    // Valida número de arquivos (max 10)
    if (selectedFiles.length + files.length > 10) {
      toast({ title: "Muitos arquivos", description: "Você pode enviar no máximo 10 arquivos por vez.", variant: "destructive" });
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && selectedFiles.length === 0) || isLoading) return;

    // 1️⃣ Envia a mensagem do usuário
    onSendMessage(message, selectedFiles, true);

    setMessage("");
    setSelectedFiles([]);
    resetTranscript();

    // 2️⃣ Envia para o backend e recebe a resposta da IA
    try {
      const aiResponse = await sendMessageToBackend("Igor", message);
      onSendMessage(aiResponse, [], false);
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível se comunicar com a IA.", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-card p-4">
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
              <Paperclip className="h-4 w-4" />
              <span className="max-w-[200px] truncate">{file.name}</span>
              <button type="button" onClick={() => removeFile(index)} className="text-muted-foreground hover:text-destructive transition-smooth">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-2">
        <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />

        <Button type="button" variant="ghost" size="icon" className="shrink-0 transition-smooth hover:scale-105" disabled={isLoading} onClick={() => fileInputRef.current?.click()}>
          <Paperclip className="h-5 w-5" />
        </Button>

        <Button type="button" variant="ghost" size="icon" className={`shrink-0 transition-smooth hover:scale-105 ${isListening ? 'text-destructive animate-pulse' : ''}`} disabled={isLoading} onClick={handleMicClick} title={isListening ? "Parar gravação" : "Gravar áudio"}>
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFiles.length > 0 ? "Adicione uma mensagem (opcional)..." : "Digite sua mensagem ou envie um arquivo..."}
          className="min-h-[60px] max-h-[200px] resize-none bg-background"
          disabled={isLoading}
        />

        <Button type="submit" size="icon" className="shrink-0 gradient-primary hover:opacity-90 transition-smooth shadow-glow hover:scale-105" disabled={isLoading || (!message.trim() && selectedFiles.length === 0)}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </form>
  );
}
