
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Ticket } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Activity, Zap } from "lucide-react";

interface RecentActivityProps {
  tickets: Ticket[];
  className?: string;
}

export function RecentActivity({ tickets, className }: RecentActivityProps) {
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10); // Show more when in sheet

  return (
    <div className={`flex flex-col h-full bg-card/40 backdrop-blur-xl relative group ${className}`}>
      <div className="absolute top-0 left-0 w-full h-1 premium-gradient opacity-50" />
      
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          Live Stream
        </h2>
        <Zap className="h-4 w-4 text-amber-500 fill-amber-500 opacity-20" />
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-10 relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/20 via-border to-transparent" />
          
          {recentTickets.map((ticket, i) => (
            <motion.div 
              key={ticket.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
              className="flex items-start gap-4 relative z-10 group/item"
            >
              <div className="relative">
                <Avatar className="h-8 w-8 ring-4 ring-background shadow-lg transition-transform group-hover/item:scale-110 duration-300">
                  <AvatarImage src={ticket.assignee?.avatarUrl || ticket.assignee?.image || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                    {ticket.assignee?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
              </div>
              
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold truncate">
                    <span className="text-foreground/90 group-hover/item:text-primary transition-colors">
                      {ticket.assignee?.name || "System"}
                    </span>
                  </p>
                  <span className="text-[9px] font-black uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0 shadow-sm">
                    {ticket.id.split('-')[0]}
                  </span>
                </div>
                
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                  "{ticket.title}"
                </p>
                
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                   <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                    {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {recentTickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="p-4 rounded-full bg-muted/50 shadow-inner">
                <Activity className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Quiet for now</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
