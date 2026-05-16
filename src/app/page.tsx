

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { db } from "@/lib/db";
import { DashboardClient } from "@/components/dashboard-client";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Fetch data in parallel for performance
  const [dbTickets, dbUsers, dbStatuses] = await Promise.all([
    db.query.tickets.findMany({
      with: {
        status: true,
        assignee: true,
        project: true,
      },
      orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
    }),
    db.query.users.findMany(),
    db.query.statuses.findMany(),
  ]);

  return (
    <DashboardClient 
      initialTickets={dbTickets as any} 
      initialUsers={dbUsers as any} 
      initialStatuses={dbStatuses as any} 
    />
  );
}

