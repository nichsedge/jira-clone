
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  PlusCircle,
  MoreHorizontal,
  Trash2,
  Pencil,
  Mail,
  Fingerprint,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/main-layout";
import { User } from "@/lib/types";
import { AddUserDialog } from "@/components/add-user-dialog";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);
  const [userToDelete, setUserToDelete] = useState<User | undefined>(undefined);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const users = await usersRes.json();
          setAllUsers(users);
        } else {
          toast({
            variant: "destructive",
            title: "Error loading users",
            description: "Failed to load users.",
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

  const handleUserAdded = async (newUser: Omit<User, "id">) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        const createdUser = await res.json();
        setAllUsers(prev => [...prev, createdUser]);
        toast({
          title: "User created",
          description: `User ${newUser.name} has been successfully created.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error creating user",
          description: "Failed to create user.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating user",
        description: "Failed to create user.",
      });
    }
  };

  const handleUserUpdated = async (updatedUser: User) => {
    try {
      const res = await fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      if (res.ok) {
        setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        toast({
          title: "User updated",
          description: `User ${updatedUser.name} has been successfully updated.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error updating user",
          description: "Failed to update user.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating user",
        description: "Failed to update user.",
      });
    }
  };

  const handleUserDeleted = async () => {
    if (!userToDelete) return;

    if(userToDelete.id === session?.user?.id) {
        toast({
            variant: "destructive",
            title: "Cannot delete current user",
            description: "You cannot delete the user you are currently logged in as.",
        });
        setUserToDelete(undefined);
        return;
    }

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAllUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        toast({
          title: "User deleted",
          description: `User ${userToDelete.name} has been deleted.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error deleting user",
          description: "Failed to delete user.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting user",
        description: "Failed to delete user.",
      });
    }
    setUserToDelete(undefined);
  }

  const openEditDialog = (user: User) => {
    setUserToEdit(user);
    setIsAddUserDialogOpen(true);
  }

  const openAddDialog = () => {
    setUserToEdit(undefined);
    setIsAddUserDialogOpen(true);
  }

  const headerActions = (
    <Button onClick={openAddDialog} className="premium-gradient shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
      <PlusCircle className="mr-2 h-4 w-4" />
      Add User
    </Button>
  );

  return (
    <MainLayout headerTitle="User Management" headerActions={headerActions}>
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
        {isLoading || status === 'loading' ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="font-bold uppercase tracking-wider text-[10px] py-4">User</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[10px] py-4">Security ID</TableHead>
                <TableHead className="font-bold uppercase tracking-wider text-[10px] py-4">Email Address</TableHead>
                <TableHead className="text-right font-bold uppercase tracking-wider text-[10px] py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-primary/5 transition-colors border-border/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 ring-2 ring-background shadow-md">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{user.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Team Member</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/70 bg-muted/30 px-2 py-1 rounded-md w-fit">
                        <Fingerprint className="h-3 w-3" />
                        {user.id.split('-')[0]}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Mail className="h-3 w-3 opacity-40" />
                        {user.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10">
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background/80 backdrop-blur-xl border-border/50">
                              <DropdownMenuItem onSelect={() => openEditDialog(user)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setUserToDelete(user)} className="text-rose-500 hover:bg-rose-500/10">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      
      <AddUserDialog
        isOpen={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        userToEdit={userToEdit}
        onUserAdded={handleUserAdded}
        onUserUpdated={handleUserUpdated}
      />
      
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(undefined)}>
          <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border/50">
              <AlertDialogHeader>
              <AlertDialogTitle className="font-bold">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium">
                  This action cannot be undone. This will permanently delete the user <span className="font-bold text-foreground">"{userToDelete?.name}"</span>.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUserDeleted} className="bg-rose-500 hover:bg-rose-600 text-white">
                  Delete
              </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
