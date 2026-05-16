import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:mysecretpassword@localhost:5432/postgres";

// For migrations and one-off queries
export const migrationClient = postgres(connectionString, { max: 1 });

// For regular queries
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { 
  schema: {
    users: schema.users,
    projects: schema.projects,
    projectMembers: schema.projectMembers,
    statuses: schema.statuses,
    tickets: schema.tickets,
    usersRelations: schema.usersRelations,
    projectsRelations: schema.projectsRelations,
    projectMembersRelations: schema.projectMembersRelations,
    statusesRelations: schema.statusesRelations,
    ticketsRelations: schema.ticketsRelations,
    userPriorityEnum: schema.userPriorityEnum,
    ticketPriorityEnum: schema.ticketPriorityEnum,
  } 
});
