
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { GripVertical, Calendar, Hash, Layers } from "lucide-react";
import { motion } from "framer-motion";

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
  isOverlay?: boolean;
}

export function TicketCard({ ticket, onClick, isOverlay }: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id, data: { type: "Ticket", ticket } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')?.dataset?.dndKitCore === 'true') {
      return;
    }
    onClick?.(ticket);
  };

  const project = ticket.project;
  
  const priorityColors = {
    high: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  };

  const priority = (ticket.priority?.toLowerCase() || 'medium') as keyof typeof priorityColors;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      layoutId={ticket.id}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick ? handleCardClick : undefined}
      className={cn(
        "group relative",
        onClick ? "cursor-pointer" : "",
        isOverlay && "z-50 shadow-2xl scale-105"
      )}
    >
      <Card
        className={cn(
          "overflow-hidden border border-border/50 bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20",
          isDragging && "opacity-20 grayscale",
          isOverlay && "border-primary ring-1 ring-primary/20 bg-background shadow-2xl"
        )}
      >
        <CardContent className="p-4 relative">
          <button
            {...listeners}
            data-dnd-kit-core="true"
            className="absolute right-3 top-3 p-1 text-muted-foreground/20 hover:text-primary transition-all cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 bg-background/80 rounded-md border border-border/50 shadow-sm"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 mr-6">
              <Badge 
                variant="outline" 
                className={cn("text-[9px] uppercase tracking-[0.1em] font-black py-0 h-5 border-none", priorityColors[priority])}
              >
                {ticket.priority}
              </Badge>
              {ticket.category && (
                <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.1em]">
                  {ticket.category}
                </span>
              )}
            </div>

            <h3 className="font-bold text-sm leading-snug line-clamp-2 min-h-[2.5rem] text-foreground/90 group-hover:text-primary transition-colors">
              {ticket.title}
            </h3>

            <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Hash className="h-3 w-3 text-primary/40" />
                <span>{ticket.id.split('-')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-primary/40" />
                <span>
                  {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1 pt-4 border-t border-border/30">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1 rounded-md bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <Layers className="h-3 w-3 text-primary/60" />
                </div>
                <div className="text-[10px] font-black text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  {project?.name || "Global"}
                </div>
              </div>
              
              <div className="flex -space-x-2 shrink-0">
                {ticket.assignee ? (
                  <Avatar className="h-7 w-7 border-2 border-card ring-2 ring-transparent transition-all group-hover:ring-primary/20 group-hover:scale-110">
                    <AvatarImage src={ticket.assignee.avatarUrl || ticket.assignee.image || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                      {ticket.assignee.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-7 w-7 border-2 border-card opacity-30 grayscale">
                    <AvatarFallback className="text-[10px]">?</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
