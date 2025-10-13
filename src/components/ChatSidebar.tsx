"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  Plus,
  Check,
  X,
} from "lucide-react"

interface Conversation {
  id: string
  title: string
}

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversationId?: string
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, newTitle: string) => void
  onDuplicateConversation: (id: string) => void
}

export default function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onDuplicateConversation,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim())
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    setTimeout(() => {
      onDeleteConversation(id)
      setDeletingId(null)
    }, 300)
  }

  return (
    <div className="flex h-full w-full flex-col bg-sidebar p-3 text-sidebar-foreground border-r border-sidebar-border">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Conversas</h2>
        <Button
          onClick={onNewConversation}
          size="icon"
          variant="ghost"
          className="hover:bg-sidebar-accent/50 hover:text-primary transition"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma conversa ainda.
          </p>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-300 border cursor-pointer",
                currentConversationId === conversation.id
                  ? "bg-sidebar-accent border-primary/20 shadow-sm"
                  : "hover:bg-sidebar-accent/50 border-transparent hover:border-sidebar-border",
                deletingId === conversation.id && "opacity-0 scale-95"
              )}
              onClick={() => onSelectConversation(conversation.id)}
            >
              {editingId === conversation.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit()
                      if (e.key === "Escape") cancelEdit()
                    }}
                    className="h-7 text-sm bg-background"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 hover:bg-muted hover:text-primary"
                    onClick={saveEdit}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 hover:bg-muted hover:text-destructive"
                    onClick={cancelEdit}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5 shrink-0 text-primary" />
                  <span className="flex-1 truncate text-left text-base font-medium text-sidebar-foreground">
                    {conversation.title}
                  </span>

                  {/* Menu de três pontinhos */}
                  <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-popover z-[9999]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem
                          onClick={() => startEditing(conversation)}
                          className="cursor-pointer hover:bg-muted focus:bg-muted"
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Renomear
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            onDuplicateConversation(conversation.id)
                          }
                          className="cursor-pointer hover:bg-muted focus:bg-muted"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleDelete(conversation.id)}
                          className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
