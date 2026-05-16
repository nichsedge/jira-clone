
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/main-layout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const priorityDisplayMap: Record<string, string> = {
  'LOW': 'Low',
  'MEDIUM': 'Medium',
  'HIGH': 'High',
};

const getPriorityDisplay = (priority: string) => priorityDisplayMap[priority] || priority;

export default function TicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const ticketsRes = await fetch('/api/tickets');
        if (ticketsRes.ok) {
          const fetchedTickets = await ticketsRes.json();
          setTickets(fetchedTickets);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <MainLayout headerTitle="All Tickets">
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="font-bold uppercase tracking-wider text-[10px] py-4">ID</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[10px] py-4">Title</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[10px] py-4">Status</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[10px] py-4">Priority</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[10px] py-4">Project</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[10px] py-4">Assignee</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[10px] py-4">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const statusValue = ticket.status as any;
                const priority = getPriorityDisplay(ticket.priority);
                
                return (
                  <TableRow key={ticket.id} className="hover:bg-primary/5 transition-colors border-border/30">
                    <TableCell className="font-bold text-xs text-primary/70">{ticket.id.split('-')[0]}</TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate">{ticket.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-none">
                        {typeof statusValue === 'object' ? statusValue?.name || 'Unknown' : statusValue}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize font-bold text-[10px] px-2 py-0 h-5 border-none",
                          priority === "High" && "bg-rose-500/10 text-rose-500",
                          priority === "Medium" && "bg-amber-500/10 text-amber-500",
                          priority === "Low" && "bg-emerald-500/10 text-emerald-500"
                        )}
                      >
                        {priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">{ticket.project?.name || 'No Project'}</TableCell>
                    <TableCell>
                      {ticket.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 ring-2 ring-background shadow-sm">
                            <AvatarImage src={ticket.assignee.image} alt={ticket.assignee.name} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                              {ticket.assignee.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{ticket.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground/60">{format(new Date(ticket.updatedAt), "PP")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </MainLayout>
  );
}
