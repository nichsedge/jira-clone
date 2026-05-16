
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Home,
  Ticket as TicketIcon,
  Users,
  Settings,
  FolderKanban,
  Search,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { usePathname } from "next/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
  headerTitle: string;
  headerActions?: React.ReactNode;
}

export function MainLayout({ children, headerTitle, headerActions }: MainLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/tickets", label: "All Tickets", icon: TicketIcon },
    { href: "/users", label: "Users", icon: Users },
  ];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar-background/50 backdrop-blur-xl">
        <SidebarHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-xl premium-gradient p-2 shadow-lg shadow-primary/20">
              <Logo />
            </div>
            <span className="font-bold text-xl tracking-tight text-gradient">ProFlow</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-4">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href} className="hover:bg-primary/10 transition-colors">
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-border/50 p-4">
            <div className="flex items-center gap-3 mb-4">
                 {session && <UserNav session={session} />}
            </div>
             <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/settings"} className="hover:bg-primary/5 transition-colors">
                    <Link href="/settings" className="flex items-center gap-3">
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="mt-2">
                    <ThemeToggle />
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background relative overflow-hidden">
        {/* Abstract background blobs for depth */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
        
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border/50 bg-background/60 px-6 sticky top-0 z-20 backdrop-blur-xl">
          <div className="flex items-center gap-4 flex-1">
            <SidebarTrigger className="hover:bg-primary/10 transition-colors" />
            <h1 className="text-xl font-bold tracking-tight hidden md:flex mr-4">{headerTitle}</h1>
             <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full bg-muted/50 border-border/50 pl-10 h-10 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all"
                  />
              </div>
          </div>
          <div className="flex items-center gap-3">
              {headerActions}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-8 p-6 lg:p-10 relative z-10">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
