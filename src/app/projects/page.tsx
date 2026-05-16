
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { MainLayout } from "@/components/main-layout";
import { Project } from "@/lib/types";
import { AddProjectDialog } from "@/components/add-project-dialog";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | undefined>(undefined);
  const [projectToDelete, setProjectToDelete] = useState<Project | undefined>(undefined);

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const projectsRes = await fetch('/api/projects');

        if (projectsRes.ok) {
          const prjs = await projectsRes.json();
          setProjects(prjs);
        } else {
          toast({
            variant: "destructive",
            title: "Error loading projects",
            description: "Failed to load projects.",
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "Failed to load data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [status, session?.user?.id, router]);

  const refetchProjects = async () => {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const prjs = await res.json();
      setProjects(prjs);
    }
  };

  const handleProjectAdded = async (newProject: Omit<Project, 'id'>) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        toast({
          title: "Project created",
          description: `Project ${newProject.name} has been successfully created.`,
        });
        await refetchProjects();
      } else {
        toast({
          variant: "destructive",
          title: "Error creating project",
          description: "Failed to create project.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating project",
        description: "Failed to create project.",
      });
    }
  };

  const handleProjectUpdated = async (updatedProject: Project) => {
    try {
      const res = await fetch(`/api/projects/${updatedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });
      if (res.ok) {
        toast({
          title: "Project updated",
          description: `Project ${updatedProject.name} has been successfully updated.`,
        });
        await refetchProjects();
      } else {
        toast({
          variant: "destructive",
          title: "Error updating project",
          description: "Failed to update project.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating project",
        description: "Failed to update project.",
      });
    }
  };

  const handleProjectDeleted = async () => {
    if (!projectToDelete) return;
    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast({
          title: "Project deleted",
          description: `Project ${projectToDelete.name} has been deleted.`,
        });
        await refetchProjects();
      } else {
        toast({
          variant: "destructive",
          title: "Error deleting project",
          description: "Failed to delete project.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting project",
        description: "Failed to delete project.",
      });
    }
    setProjectToDelete(undefined);
  };
   
  const openEditDialog = (project: Project) => {
    setProjectToEdit(project);
    setIsAddProjectDialogOpen(true);
  }

  const openAddDialog = () => {
    setProjectToEdit(undefined);
    setIsAddProjectDialogOpen(true);
  }

  const headerActions = (
    <Button onClick={openAddDialog} className="premium-gradient shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Project
    </Button>
  );

  return (
    <MainLayout headerTitle="Projects" headerActions={headerActions}>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
            [...Array(3)].map((_, i) => (
                <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-xl h-48">
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6 mt-2" />
                    </CardContent>
                </Card>
            ))
        ) : projects.map(project => (
            <Card key={project.id} className="group overflow-hidden border-border/50 bg-card/40 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full group-hover:bg-primary/10 transition-colors" />
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{project.name}</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <FolderKanban className="h-3 w-3" />
                            {project.id.split('-')[0]}
                        </CardDescription>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background/80 backdrop-blur-xl border-border/50">
                            <DropdownMenuItem onSelect={() => openEditDialog(project)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setProjectToDelete(project)} className="text-rose-500 hover:bg-rose-500/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="pb-6">
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed italic line-clamp-2">
                        {project.description || "No description provided."}
                    </p>
                    <div className="mt-6 flex items-center gap-4 text-[10px] font-black uppercase tracking-tighter text-muted-foreground/50">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            Active Project
                        </div>
                    </div>
                </CardContent>
                <div className="h-1 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
            </Card>
        ))}
      </div>
      
      <AddProjectDialog
          isOpen={isAddProjectDialogOpen}
          onOpenChange={setIsAddProjectDialogOpen}
          projectToEdit={projectToEdit}
          onProjectAdded={handleProjectAdded}
          onProjectUpdated={handleProjectUpdated}
      />
      
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(undefined)}>
          <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border/50">
              <AlertDialogHeader>
              <AlertDialogTitle className="font-bold">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium">
                  This action cannot be undone. This will permanently delete the project <span className="font-bold text-foreground">"{projectToDelete?.name}"</span>.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleProjectDeleted} className="bg-rose-500 hover:bg-rose-600 text-white">
                  Delete
              </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
