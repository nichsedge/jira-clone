
"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { type Ticket, type Status } from "@/lib/types";
import { TicketCard } from "./ticket-card";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "./ui/button";

interface TicketColumnProps {
  status: Status;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
}

export function TicketColumn({ status, tickets, onTicketClick }: TicketColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: {
      type: "Column",
      status: status.id,
    },
  });

  const getStatusColor = (statusId: string) => {
    switch (statusId) {
      case 'status-todo': return 'bg-slate-400';
      case 'status-open': return 'bg-blue-500';
      case 'status-in-progress': return 'bg-amber-500';
      case 'status-done': return 'bg-emerald-500';
      default: return 'bg-primary';
    }
  };

  const statusColor = getStatusColor(status.id);

  return (
    <div className="flex flex-col gap-4 w-[320px] flex-shrink-0 group/column h-full">
      <div className="flex items-center justify-between px-3 py-1">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-3 h-3 rounded-full shadow-sm ring-4 ring-background", statusColor)} />
          <h2 className="font-black text-xs uppercase tracking-[0.15em] text-foreground/70 group-hover/column:text-primary transition-colors">
            {status.name}
          </h2>
          <span className="text-[10px] font-black bg-muted/80 text-muted-foreground/80 rounded-full px-2 py-0.5 min-w-[24px] text-center shadow-inner">
            {tickets.length}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover/column:opacity-100 transition-opacity">
           <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
             <Plus className="h-3.5 w-3.5 text-muted-foreground" />
           </Button>
           <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
             <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
           </Button>
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-4 rounded-2xl p-4 transition-all duration-300 border",
          isOver 
            ? "bg-primary/5 border-primary/30 ring-4 ring-primary/5 scale-[1.02]" 
            : "bg-muted/20 border-border/40 hover:border-border/80"
        )}
      >
        <SortableContext
          items={tickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={onTicketClick}/>
            ))}
          </div>
        </SortableContext>
        
        {tickets.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl py-12 px-4 opacity-40 group-hover/column:opacity-70 transition-opacity gap-2">
            <div className={cn("w-8 h-8 rounded-full opacity-20", statusColor)} />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
}
