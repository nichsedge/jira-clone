import { pgTable, text, timestamp, boolean, integer, pgEnum, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userPriorityEnum = pgEnum("user_priority", ["LOW", "MEDIUM", "HIGH"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["LOW", "MEDIUM", "HIGH"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  hashedPassword: text("hashed_password"),
  statusId: text("status_id"),
  priority: userPriorityEnum("priority").default("MEDIUM"),
  imapHost: text("imap_host"),
  imapPort: integer("imap_port"),
  imapUser: text("imap_user"),
  imapPass: text("imap_pass"),
  imapUseTls: boolean("imap_use_tls"),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: text("smtp_user"),
  smtpPass: text("smtp_pass"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectMembers = pgTable("project_members", {
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.projectId, t.userId] }),
}));

export const statuses = pgTable("statuses", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  statusId: text("status_id"),
  priority: ticketPriorityEnum("priority").default("MEDIUM"),
  category: text("category"),
  projectId: text("project_id").notNull(),
  assigneeId: text("assignee_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  status: one(statuses, { fields: [users.statusId], references: [statuses.id] }),
  ownedProjects: many(projects, { relationName: "ProjectOwner" }),
  memberProjects: many(projectMembers),
  assignedTickets: many(tickets, { relationName: "TicketAssignee" }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id], relationName: "ProjectOwner" }),
  members: many(projectMembers),
  tickets: many(tickets),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const statusesRelations = relations(statuses, ({ many }) => ({
  tickets: many(tickets),
  users: many(users),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  status: one(statuses, { fields: [tickets.statusId], references: [statuses.id] }),
  project: one(projects, { fields: [tickets.projectId], references: [projects.id] }),
  assignee: one(users, { fields: [tickets.assigneeId], references: [users.id], relationName: "TicketAssignee" }),
}));
