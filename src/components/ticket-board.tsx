
"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  type UniqueIdentifier,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { type Ticket, type User, type EmailSettings, type Status } from "@/lib/types";

 // Status interface already defined in types.ts
 
 import { TicketColumn } from "./ticket-column";
import { TicketCard } from "./ticket-card";
import { TicketDetailsDialog } from "./ticket-details-dialog";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { updateTicketAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { getEmailSettings } from "@/lib/email-settings";

interface TicketBoardProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  onTicketUpdated: (ticket: Ticket) => void;
  onTicketDeleted: (ticketId: string) => void;
}

export function TicketBoard({ tickets, setTickets, onTicketUpdated, onTicketDeleted }: TicketBoardProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isClient, setIsClient] = useState(false)
  const [statuses, setStatuses] = useState<Status[]>([]);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);

  useEffect(() => {
    setIsClient(true)
    const loadStatuses = async () => {
      try {
        const response = await fetch('/api/statuses');
        if (response.ok) {
          const statusesData = await response.json();
          setStatuses(statusesData);
        } else {
          // Fallback to default statuses matching seed data
          console.warn('Failed to fetch statuses, using seed defaults');
          setStatuses([
            { id: 'status-todo', name: 'To Do', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
            { id: 'status-open', name: 'Open', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
            { id: 'status-in-progress', name: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
            { id: 'status-done', name: 'Done', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' }
          ]);
        }
      } catch (error) {
        console.error('Error loading statuses:', error);
        // Fallback to default statuses matching seed data
        setStatuses([
          { id: 'status-todo', name: 'To Do', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
          { id: 'status-open', name: 'Open', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
          { id: 'status-in-progress', name: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
          { id: 'status-done', name: 'Done', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' }
        ]);
      }
      setEmailSettings(getEmailSettings());
    };
  
    loadStatuses();
  }, [])

  const ticketsByStatus = useMemo(() => {
    const grouped: Record<string, Ticket[]> = {};
    
    // Initialize all status columns
    statuses.forEach(status => {
      grouped[status.id] = [];
    });
    
    tickets.forEach(ticket => {
      let statusId: string = '';
      
      if (ticket.status && typeof ticket.status === 'object' && 'id' in ticket.status) {
        statusId = (ticket.status as any).id;
      } else if (typeof ticket.status === 'string') {
        statusId = ticket.status;
      }
      
      if (statusId && statuses.some(s => s.id === statusId)) {
        grouped[statusId].push(ticket);
      } else {
        const firstStatusId = statuses[0]?.id || '';
        if (firstStatusId) {
          grouped[firstStatusId].push(ticket);
        }
      }
    });
    
    return grouped;
  }, [tickets, statuses]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = tickets.find((t) => t.id === active.id);
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
  
    if (!over) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    if (activeId === overId) return;

    const originalActiveTicket = tickets.find((t) => t.id === activeId);
    if (!originalActiveTicket) return;
  
    setTickets((prevTickets) => {
      const activeTicketIndex = prevTickets.findIndex((t) => t.id === activeId);
      const overTicketIndex = prevTickets.findIndex((t) => t.id === overId);
  
      let newTickets = [...prevTickets];
      const activeTicket = newTickets[activeTicketIndex];
  
      // Dropping on a column
      const targetStatus = statuses.find(s => s.id === overId);
      if (targetStatus) {
        const newStatusId = targetStatus.id;
        const currentStatusId = (typeof activeTicket.status === 'object' ? activeTicket.status?.id : activeTicket.status) || '';
        if (currentStatusId !== newStatusId) {
            activeTicket.status = targetStatus;
            
            const otherTickets = newTickets.filter(t => t.id !== activeId);
            const columnTickets = otherTickets.filter(t => {
              const tStatusId = (typeof t.status === 'object' ? t.status?.id : t.status) || '';
              return tStatusId === newStatusId;
            });
            const lastTicketInColumn = columnTickets[columnTickets.length - 1];
            
            let newIndex;
            if (lastTicketInColumn) {
                const lastTicketIndex = newTickets.findIndex(t => t.id === lastTicketInColumn.id);
                newIndex = lastTicketIndex + 1;
            } else {
                const columnIndex = statuses.findIndex(s => s.id === newStatusId);
                let nextColumnTicketIndex = -1;
                for(let i = columnIndex + 1; i < statuses.length; i++) {
                    const foundTicket = newTickets.find(t => {
                      const tStatusId = (typeof t.status === 'object' ? t.status?.id : t.status) || '';
                      return tStatusId === statuses[i].id;
                    });
                    if (foundTicket) {
                        nextColumnTicketIndex = newTickets.indexOf(foundTicket);
                        break;
                    }
                }
                if (nextColumnTicketIndex !== -1) {
                    newIndex = nextColumnTicketIndex;
                } else {
                    newIndex = newTickets.length;
                }
            }
            
            newTickets = arrayMove(newTickets, activeTicketIndex, newIndex > activeTicketIndex ? newIndex - 1 : newIndex);
        }
      }
      // Dropping on another ticket
      else if (overTicketIndex !== -1) {
        const overTicket = newTickets[overTicketIndex];
        const activeStatusId = (typeof activeTicket.status === 'object' ? activeTicket.status?.id : activeTicket.status) || '';
        const overStatusId = (typeof overTicket.status === 'object' ? overTicket.status?.id : overTicket.status) || '';
        if (activeStatusId !== overStatusId) {
          activeTicket.status = overTicket.status;
          newTickets = arrayMove(newTickets, activeTicketIndex, overTicketIndex);
        } else {
          newTickets = arrayMove(newTickets, activeTicketIndex, overTicketIndex);
        }
      }

      const updatedTicket = newTickets.find(t => t.id === activeId);
      if (updatedTicket && (updatedTicket.status !== originalActiveTicket.status || JSON.stringify(updatedTicket) !== JSON.stringify(originalActiveTicket))) {
        startTransition(async () => {
          const result = await updateTicketAction({
            id: updatedTicket.id,
            statusId: typeof updatedTicket.status === 'object' ? (updatedTicket.status as any).id : undefined,
            reporter: updatedTicket.reporter,
            createdAt: updatedTicket.createdAt,
            emailSettings: emailSettings,
          });

          if (result.error && !result.ticket) {
            toast({
              variant: "destructive",
              title: "Uh oh! Something went wrong.",
              description: result.error,
            });
            setTickets(prevTickets);
          } else if (result.ticket) {
              if (result.error) {
                toast({
                  variant: "destructive",
                  title: "Ticket Updated, Email Failed",
                  description: result.error,
                });
              } else {
                toast({
                  title: "Ticket Updated!",
                  description: `Ticket ${result.ticket.id} moved to ${(result.ticket.status as any)?.name || result.ticket.status}.`,
                });
              }
              onTicketUpdated(result.ticket);
          }
        });
      }

      return newTickets;
    });
  };
  

  if (!isClient) {
    return null;
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTicket(null)}
    >
      <ScrollArea className="w-full whitespace-nowrap rounded-3xl border-none bg-muted/5 backdrop-blur-sm shadow-inner relative overflow-hidden">
        {/* Background texture for the board */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        <div className="flex gap-10 p-8 min-h-[calc(100vh-340px)] relative z-10">
          {statuses.map((status) => {
            const statusTickets = ticketsByStatus[status.id] || [];
            return (
              <TicketColumn
                key={status.id}
                status={status}
                tickets={statusTickets}
                onTicketClick={handleTicketClick}
              />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="bg-transparent" />
      </ScrollArea>


      <DragOverlay>
        {activeTicket ? <TicketCard ticket={activeTicket} isOverlay /> : null}
      </DragOverlay>
      <TicketDetailsDialog
        isOpen={!!selectedTicket}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedTicket(null);
          }
        }}
        ticket={selectedTicket}
        onTicketUpdated={(updatedTicket) => {
          onTicketUpdated(updatedTicket);
          setSelectedTicket(current => current ? {...current, ...updatedTicket} : null);
        }}
        onTicketDeleted={onTicketDeleted}
      />
    </DndContext>
  );
}
