import { Plus, MessageSquare, MoreVertical, Edit2, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDuplicateConversation: (id: string) => void;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onDuplicateConversation,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      onDeleteConversation(id);
      setDeletingId(null);
    }, 300);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar-background border-r border-sidebar-border shadow-lg">
      <div className="p-4 border-b border-sidebar-border bg-sidebar-background">
        <Button
          onClick={onNewConversation}
          className="w-full gradient-primary hover:opacity-90 transition-smooth shadow-glow text-base font-semibold"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nova Conversa
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 scrollbar-thin">
        <div className="space-y-2 py-3">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-300 border",
                currentConversationId === conversation.id
                  ? "bg-sidebar-accent border-primary/20 shadow-sm"
                  : "hover:bg-sidebar-accent/50 border-transparent hover:border-sidebar-border",
                deletingId === conversation.id && "opacity-0 scale-95"
              )}
            >
              {editingId === conversation.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="h-7 text-sm bg-background"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={saveEdit}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={cancelEdit}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5 shrink-0 text-primary" />
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className="flex-1 truncate text-left text-base font-medium text-sidebar-foreground"
                  >
                    {conversation.title}
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => startEditing(conversation)}
                          className="cursor-pointer"
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Renomear conversa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDuplicateConversation(conversation.id)}
                          className="cursor-pointer"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar conversa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(conversation.id)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir conversa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
