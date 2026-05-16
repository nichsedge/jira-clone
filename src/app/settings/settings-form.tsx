
"use client";

import { useState, useTransition, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Trash2,
  Plus,
  Workflow,
  GripVertical,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { useToast } from "@/hooks/use-toast";
import { User, TicketStatus } from "@/lib/types";

import { syncEmailsAction } from "@/app/actions";
import { EmailSettingsForm } from "./email-settings-form";
import { MainLayout } from "@/components/main-layout";

interface SortableStatusItemProps {
    id: string;
    onDelete: (id: string) => void;
}

function SortableStatusItem({ id, onDelete }: SortableStatusItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border/50 group hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab h-8 w-8 hover:bg-primary/10">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </Button>
                <span className="font-bold text-sm tracking-tight">{id}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500" onClick={() => onDelete(id)}>
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
}

export function SettingsForm() {
  const [isSyncing, startSyncTransition] = useTransition();
  const { toast } = useToast();

  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  useEffect(() => {
    setIsClient(true);
    const loadData = async () => {
      try {
        const statusesRes = await fetch('/api/statuses');
        if (statusesRes.ok) {
          const statusesData = await statusesRes.json();
          setStatuses(statusesData.map((s: any) => s.id));
        }

        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const users = await usersRes.json();
          setAllUsers(users);
        }
      } catch (error) {
        console.error('Error loading settings data:', error);
      }
    };

    loadData();
  }, []);

  const handleAddStatus = () => {
    if (newStatus.trim() && !statuses.includes(newStatus.trim())) {
      setStatuses([...statuses, newStatus.trim()]);
      setNewStatus("");
      toast({
        title: "Status added!",
        description: `"${newStatus.trim()}" has been added to your workflow.`,
      });
    }
  };

  const handleDeleteStatus = (statusToDelete: TicketStatus) => {
    if (statuses.length <= 1) {
        toast({
            variant: "destructive",
            title: "Cannot delete status",
            description: "You must have at least one status in your workflow.",
        });
        return;
    }
    setStatuses(statuses.filter(status => status !== statusToDelete));
     toast({
        title: "Status removed!",
        description: `"${statusToDelete}" has been removed from your workflow.`,
      });
  };

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (active.id !== over?.id) {
      setStatuses((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over!.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleSyncEmails = async () => {
      startSyncTransition(async () => {
          try {
              const syncResult = await syncEmailsAction(allUsers, {} as any);
              if (syncResult.error) {
                  toast({
                      variant: "destructive",
                      title: "Sync Failed",
                      description: syncResult.error,
                  });
              } else {
                  toast({
                      title: "Sync Complete!",
                      description: `${syncResult.count || 0} new tickets found.`,
                  });
              }
          } catch (error) {
              toast({
                  variant: "destructive",
                  title: "Sync Error",
                  description: "An unexpected error occurred.",
              });
          }
      });
  };

  if (!isClient) return null;

  return (
    <MainLayout headerTitle="Settings">
      <div className="max-w-4xl space-y-10">
        <section>
           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary/50 mb-6 flex items-center gap-3">
             <Mail className="h-4 w-4" />
             Communication
           </h3>
           <EmailSettingsForm onSync={handleSyncEmails} isSyncing={isSyncing} />
        </section>

        <section>
           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary/50 mb-6 flex items-center gap-3">
             <Workflow className="h-4 w-4" />
             Workflow
           </h3>
           <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader className="border-b border-border/50 pb-6">
                    <CardTitle className="text-lg font-bold">Workflow Statuses</CardTitle>
                    <CardDescription className="text-xs font-medium italic">
                    Customize and reorder the columns on your ticket board.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                    <div className="space-y-3">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={statuses} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3">
                                    {statuses.map(status => (
                                        <SortableStatusItem key={status} id={status} onDelete={handleDeleteStatus} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t border-border/50 p-6 mt-4">
                    <div className="flex w-full items-center gap-3">
                        <Input 
                            placeholder="Add new status (e.g. In Review)" 
                            className="bg-background/50 border-border/50 focus-visible:ring-primary/20 h-11"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                        />
                        <Button onClick={handleAddStatus} className="h-11 px-6 premium-gradient shadow-lg shadow-primary/10">
                          <Plus className="mr-2 h-4 w-4" /> Add
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </section>
      </div>
    </MainLayout>
  );
}
