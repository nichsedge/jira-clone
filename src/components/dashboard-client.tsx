
"use client";

import { useState, useMemo, useTransition } from "react";
import { useSession } from "next-auth/react";
import {
  Mail,
  Activity as ActivityIcon,
  FolderKanban,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { type Ticket, type User, type EmailSettings, type Status } from "@/lib/types";

import { TicketBoard } from "@/components/ticket-board";
import { CreateTicketDialog } from "@/components/create-ticket-dialog";
import { syncEmailsAction } from "@/app/actions";
import { DashboardStats } from "@/components/dashboard-stats";
import { RecentActivity } from "@/components/recent-activity";
import { MainLayout } from "@/components/main-layout";

interface DashboardClientProps {
  initialTickets: Ticket[];
  initialUsers: User[];
  initialStatuses: Status[];
}

export function DashboardClient({ 
  initialTickets, 
  initialUsers, 
  initialStatuses 
}: DashboardClientProps) {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, startSyncTransition] = useTransition();
  const { toast } = useToast();

  const filteredTickets = useMemo(() => {
    if (!searchTerm) return tickets;
    return tickets.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets((prevTickets) => [newTicket, ...prevTickets]);
  };
  
  const handleTicketUpdated = (updatedTicket: Ticket) => {
     setTickets((prevTickets) => prevTickets.map(ticket => ticket.id === updatedTicket.id ? { ...ticket, ...updatedTicket} : ticket));
  }

  const handleTicketDeleted = (deletedTicketId: string) => {
    setTickets((prevTickets) => prevTickets.filter(ticket => ticket.id !== deletedTicketId));
  };

  const handleSyncEmails = async () => {
    startSyncTransition(async () => {
      const result = await syncEmailsAction(allUsers, {} as any);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: result.error,
        });
      } else {
        toast({
          title: "Sync Complete!",
          description: `${result.count || 0} new tickets found.`,
        });
        if (result.tickets) setTickets(prev => [...result.tickets!, ...prev]);
      }
    });
  };

  const headerActions = (
    <>
      <Button onClick={handleSyncEmails} disabled={isSyncing} variant="outline" className="h-10 px-4 border-border/50 hover:bg-primary/5 hover:text-primary transition-all">
        {isSyncing ? (
            <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Syncing...
            </>
        ) : (
            <>
            <Mail className="mr-2 h-4 w-4" />
            Sync Emails
            </>
        )}
      </Button>
      
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10 border-border/50 hover:bg-primary/5 hover:text-primary transition-all relative">
            <ActivityIcon className="h-4 w-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[500px] p-0 border-l border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="h-full overflow-y-auto">
            <RecentActivity tickets={tickets} />
          </div>
        </SheetContent>
      </Sheet>

       {session && (
         <div className="premium-gradient p-[1px] rounded-lg shadow-lg shadow-primary/20">
           <CreateTicketDialog 
            allUsers={allUsers} 
            onTicketCreated={handleTicketCreated} 
            currentUser={{ id: session.user.id, name: session.user.name || 'User', email: session.user.email || '', avatarUrl: session.user.image || '' }} 
           />
         </div>
       )}
    </>
  );

  return (
    <MainLayout headerTitle="Dashboard" headerActions={headerActions}>
      <DashboardStats tickets={tickets} />
      
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-primary" />
              Project Board
            </h2>
        </div>
        <TicketBoard 
          tickets={filteredTickets} 
          setTickets={setTickets} 
          onTicketUpdated={handleTicketUpdated} 
          onTicketDeleted={handleTicketDeleted} 
        />
      </div>
    </MainLayout>
  );
}
