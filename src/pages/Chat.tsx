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
          if (e.key === "Enter") saveEdit();
          if (e.key === "Escape") cancelEdit();
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

      {/* --- Botões laterais --- */}
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
              onClick={() => onDuplicateConversation(conversation.id)}
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
