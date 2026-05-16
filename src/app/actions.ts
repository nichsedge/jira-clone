'use server';

import { type Ticket, type TicketPriority, type User, type EmailSettings } from '@/lib/types';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, or, and, sql, exists, getTableColumns, inArray } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getEmailSettings } from '@/lib/email-settings';
import type { Session } from 'next-auth';
import { createId } from '@paralleldrive/cuid2';


interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}


const priorityMap: Record<string, string> = {
  'Low': 'LOW',
  'Medium': 'MEDIUM',
  'High': 'HIGH',
};

const displayPriorityMap: Record<string, string> = {
  'LOW': 'Low',
  'MEDIUM': 'Medium',
  'HIGH': 'High',
};

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  statusId: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, "Project is required."),
  reporter: z.custom<User>(),
});

const updateTicketSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  statusId: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  assigneeId: z.string().optional(),
  category: z.string().optional(),
  projectId: z.string().optional(),
  reporter: z.any().optional(),
  createdAt: z.string(),
  emailSettings: z.any().optional(),
});

const deleteTicketSchema = z.object({
  id: z.string(),
});

export async function createTicketAction(values: z.infer<typeof createTicketSchema>): Promise<{ ticket?: Ticket, error?: string }> {
  const session = await getServerSession(authOptions) as ExtendedSession;
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = createTicketSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields.",
    };
  }
  
  const { title, description, statusId, priority, assigneeId, projectId, reporter } = validatedFields.data;

  if (!reporter || !reporter.id) {
    return { error: 'Invalid reporter.' };
  }

  try {
    // Check project access
    const project = await db.query.projects.findFirst({
      where: and(
        eq(schema.projects.id, projectId),
        or(
          eq(schema.projects.ownerId, session.user.id),
          exists(
            db.select()
              .from(schema.projectMembers)
              .where(
                and(
                  eq(schema.projectMembers.projectId, projectId),
                  eq(schema.projectMembers.userId, session.user.id)
                )
              )
          )
        )
      ),
    });

    if (!project) {
      return { error: 'Project not found or unauthorized' };
    }

    let finalStatusId = 'status-todo'; // Default to To Do
    if (statusId) {
      const status = await db.query.statuses.findFirst({
        where: eq(schema.statuses.id, statusId),
      });
      if (status) {
        finalStatusId = statusId;
      }
    }

    const now = new Date();
    const ticketId = createId();
    
    await db.insert(schema.tickets).values({
      id: ticketId,
      title,
      description: description || null,
      statusId: finalStatusId,
      priority: priorityMap[priority] as any,
      projectId: projectId,
      assigneeId: assigneeId || null,
      updatedAt: now,
      createdAt: now,
    });

    const newTicket = await db.query.tickets.findFirst({
      where: eq(schema.tickets.id, ticketId),
      with: {
        project: true,
        assignee: true,
        status: true,
      },
    });

    if (!newTicket) {
      return { error: 'Failed to retrieve created ticket.' };
    }

    // Map back to frontend type if needed
    const ticket: Ticket = {
      id: newTicket.id,
      title: newTicket.title || '',
      description: newTicket.description || '',
      status: newTicket.status as any,
      category: 'General',
      priority: priority as any,
      createdAt: newTicket.createdAt,
      updatedAt: newTicket.updatedAt,
      assignee: newTicket.assignee ? { id: newTicket.assignee.id, name: newTicket.assignee.name || 'Unknown', email: newTicket.assignee.email || '', image: newTicket.assignee.image || '', priority: 'MEDIUM' } : undefined,
      reporter: reporter,
      projectId: newTicket.projectId,
      project: newTicket.project as any, // Include project
    };

    return { ticket };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create ticket.' };
  }
}

export async function updateTicketAction(values: z.infer<typeof updateTicketSchema>): Promise<{ ticket?: Ticket, error?: string }> {
  const session = await getServerSession(authOptions) as ExtendedSession;
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = updateTicketSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error('Validation errors:', validatedFields.error.errors);
    console.error('Input values:', values);
    return {
      error: `Invalid fields: ${validatedFields.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`,
    };
  }

  const { id, title, description, status, priority, assigneeId, category, projectId, createdAt, emailSettings } = validatedFields.data;
  
  // Get existing ticket data for base information
  const existingTicket = await db.query.tickets.findFirst({
    where: eq(schema.tickets.id, id),
    with: {
      assignee: true,
      status: true,
      project: true
    }
  });

  if (!existingTicket) {
    return { error: 'Ticket not found' };
  }

  // Check project access
  const project = await db.query.projects.findFirst({
    where: and(
      eq(schema.projects.id, projectId || existingTicket.projectId),
      or(
        eq(schema.projects.ownerId, session.user.id),
        exists(
          db.select()
            .from(schema.projectMembers)
            .where(
              and(
                eq(schema.projectMembers.projectId, projectId || existingTicket.projectId),
                eq(schema.projectMembers.userId, session.user.id)
              )
            )
        )
      )
    ),
  });

  if (!project) {
    return { error: 'Project not found or unauthorized' };
  }

  // Validate assignee exists if provided
  let validAssigneeId = existingTicket.assigneeId;
  if (assigneeId !== undefined) {
    if (assigneeId === null || assigneeId === '') {
      validAssigneeId = null;
    } else {
      const assignee = await db.query.users.findFirst({
        where: eq(schema.users.id, assigneeId),
      });
      if (!assignee) {
        console.warn(`Assignee not found: ${assigneeId}, clearing assignment`);
        validAssigneeId = null;
      } else {
        validAssigneeId = assigneeId;
      }
    }
  }

  let statusToConnectId = null;
  if (status) {
    const statusToUpdate = await db.query.statuses.findFirst({
      where: eq(schema.statuses.name, status),
    });
    if (!statusToUpdate) {
      return { error: `Status "${status}" not found.` };
    }
    statusToConnectId = statusToUpdate.id;
  }

  const updateFields: any = {
    updatedAt: new Date(),
  };

  if (title !== undefined) {
    updateFields.title = title;
  }
  if (description !== undefined) {
    updateFields.description = description;
  }
  if (statusToConnectId) {
    updateFields.statusId = statusToConnectId;
  }
  if (priority !== undefined) {
    updateFields.priority = priorityMap[priority] as any;
  }
  if (validAssigneeId !== undefined) {
    updateFields.assigneeId = validAssigneeId;
  }
  if (category !== undefined) {
    updateFields.category = category;
  }
  if (projectId !== undefined) {
    updateFields.projectId = projectId;
  }

  await db.update(schema.tickets)
    .set(updateFields)
    .where(eq(schema.tickets.id, id));

  const updatedTicket = await db.query.tickets.findFirst({
    where: eq(schema.tickets.id, id),
    with: {
      project: true,
      assignee: true,
      status: true,
    }
  });

  if (!updatedTicket) {
    return { error: 'Failed to retrieve updated ticket.' };
  }

  const frontendStatus = updatedTicket.status as any;
  const currentPriority = existingTicket.priority;
  const providedReporter = validatedFields.data.reporter;
  const reporterData = providedReporter && providedReporter.id ? providedReporter : {
    id: 'SYSTEM',
    name: 'System',
    email: '',
    image: '',
    priority: 'MEDIUM' as const
  };
  const ticketData: Ticket = {
    id: updatedTicket.id,
    title: title !== undefined ? title : updatedTicket.title || '',
    description: description !== undefined ? description : updatedTicket.description || '',
    status: frontendStatus,
    category: category !== undefined ? category : existingTicket.category || 'General',
    priority: (priority !== undefined ? priority : displayPriorityMap[currentPriority] || 'Medium') as any,
    assignee: updatedTicket.assignee ? { id: updatedTicket.assignee.id, name: updatedTicket.assignee.name || 'Unknown', email: updatedTicket.assignee.email || '', image: updatedTicket.assignee.image || '', priority: 'MEDIUM' } : undefined,
    reporter: reporterData,
    projectId: updatedTicket.projectId,
    project: updatedTicket.project,
    createdAt: new Date(createdAt),
    updatedAt: updatedTicket.updatedAt,
  };

  // Email notification if status is DONE (skip if no reporter email)
  if (frontendStatus?.name === 'Done' && emailSettings?.smtp) {
    try {
      const subject = `Ticket Resolved: ${ticketData.id} - ${ticketData.title}`;
      const textBody = `Hello,\n\nYour support ticket "${ticketData.title}" with ID ${ticketData.id} has been marked as resolved.\n\nThank you for using our support system.\n\nThe ProFlow Team`;
      const htmlBody = `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Ticket Resolved: ${ticketData.id}</h2>
          <p>Hello,</p>
          <p>Your support ticket "<strong>${ticketData.title}</strong>" has been marked as resolved.</p>
          <p>If you feel the issue is not resolved, please reply to this email to reopen the ticket.</p>
          <br/>
          <p>Thank you,</p>
          <p><strong>The ProFlow Team</strong></p>
        </div>
      `;

      // Use a default email or skip if no reporter email available
      const { sendMail } = await import('@/services/email-sender');
      await sendMail({
        to: 'support@proflow.com', // Default support email
        subject: subject,
        text: textBody,
        html: htmlBody,
      }, emailSettings.smtp);
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      return { ticket: ticketData, error: "Ticket updated, but failed to send email notification." };
    }
  }

  return { ticket: ticketData };
}




export async function deleteTicketAction(values: z.infer<typeof deleteTicketSchema>): Promise<{ id?: string, error?: string }> {
  const session = await getServerSession(authOptions) as ExtendedSession;
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = deleteTicketSchema.safeParse(values);

  if (!validatedFields.success) {
      return {
          error: "Invalid fields.",
      };
  }

  try {
    const ticket = await db.query.tickets.findFirst({
      where: eq(schema.tickets.id, validatedFields.data.id),
      with: { project: true },
    });

    if (!ticket) {
      return { error: 'Ticket not found' };
    }

    // Check project access
    const project = await db.query.projects.findFirst({
      where: and(
        eq(schema.projects.id, ticket.projectId),
        or(
          eq(schema.projects.ownerId, session.user.id),
          exists(
            db.select()
              .from(schema.projectMembers)
              .where(
                and(
                  eq(schema.projectMembers.projectId, ticket.projectId),
                  eq(schema.projectMembers.userId, session.user.id)
                )
              )
          )
        )
      ),
    });

    if (!project) {
      return { error: 'Project not found or unauthorized' };
    }

    await db.delete(schema.tickets)
      .where(eq(schema.tickets.id, validatedFields.data.id));

    return { id: validatedFields.data.id };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete ticket.' };
  }
}

export async function syncEmailsAction(existingUsers: User[], emailSettings: EmailSettings): Promise<{ tickets?: Ticket[], newUsers?: User[], error?: string, count: number }> {
  const session = await getServerSession(authOptions) as ExtendedSession;
  if (!session?.user?.id) {
    console.log('syncEmailsAction: Unauthorized access');
    return { error: 'Unauthorized', count: 0 };
  }

  console.log('syncEmailsAction: Started for user', session.user.id);
  console.log('syncEmailsAction: Received', existingUsers?.length || 0, 'existing users');
  console.log('syncEmailsAction: Email settings provided:', {
    imap: emailSettings?.imap ? { host: emailSettings.imap.host, user: emailSettings.imap.user, hasPass: !!emailSettings.imap.pass } : 'MISSING',
    smtp: emailSettings?.smtp ? { host: emailSettings.smtp.host, user: emailSettings.smtp.user } : 'MISSING'
  });

  try {
    // Fallback to database settings if client-side settings are incomplete
    let finalEmailSettings = emailSettings;
    if (!finalEmailSettings?.imap?.host || !finalEmailSettings.imap.user) {
      console.log('syncEmailsAction: Client settings incomplete, loading from database');
      const dbSettings = await getEmailSettings();
      if (dbSettings) {
        finalEmailSettings = dbSettings;
        console.log('syncEmailsAction: Loaded complete settings from DB');
      } else {
        return { error: 'No email settings available. Please save your email credentials first.', count: 0 };
      }
    }

    if (!finalEmailSettings?.imap?.host || !finalEmailSettings.imap.port || !finalEmailSettings.imap.user || !finalEmailSettings.imap.pass) {
      console.log('syncEmailsAction: IMAP settings still incomplete after fallback:', finalEmailSettings?.imap);
      return { error: 'IMAP settings are not configured. Please save your email credentials first.', count: 0 };
    }

    console.log('syncEmailsAction: Using IMAP config:', {
      host: finalEmailSettings.imap.host,
      port: finalEmailSettings.imap.port,
      user: finalEmailSettings.imap.user,
      hasPass: !!finalEmailSettings.imap.pass,
      tls: finalEmailSettings.imap.tls
    });

    const { fetchUnreadEmails } = await import('@/services/email-service');
    const emails = await fetchUnreadEmails(finalEmailSettings.imap);
    console.log('syncEmailsAction: Fetched', emails.length, 'unread emails');
    
    const ticketEmails = emails.filter(email => email.subject?.includes('[TICKET]'));
    console.log('syncEmailsAction: Found', ticketEmails.length, 'ticket emails');

    if (ticketEmails.length === 0) {
        console.log('syncEmailsAction: No ticket emails found');
        return { tickets: [], newUsers: [], count: 0 };
    }

    const newTickets: Ticket[] = [];
    const newUsers: User[] = [];

    for (const email of ticketEmails) {
        console.log('syncEmailsAction: Processing ticket email:', email.subject?.substring(0, 50));
        
        const title = email.subject?.replace("[TICKET]", "").trim() || "New Ticket from Email";
        const description = email.text || "No description provided.";
        
        const fromEmail = email.from?.value[0]?.address;
        if (!fromEmail) {
            console.warn("syncEmailsAction: Skipping email without a 'from' address:", email.messageId);
            continue;
        }

        let reporter = await db.query.users.findFirst({
          where: eq(schema.users.email, fromEmail),
        });

        let reporterFrontend: User;

        if (!reporter) {
            // Create new user (for demo, no password, or set default; in real, send email for setup)
            const bcrypt = await import('bcryptjs');
            const fromName = email.from?.value[0]?.name || fromEmail.split('@')[0] || "Email User";
            const hashedPassword = await bcrypt.hash('defaultPassword123', 12); // Temp default
            const reporterId = createId();
            
            await db.insert(schema.users).values({
              id: reporterId,
              name: fromName,
              email: fromEmail,
              hashedPassword,
              image: `https://placehold.co/32x32/E9D5FF/6D28D9/png?text=${fromName.charAt(0).toUpperCase()}`,
              updatedAt: new Date(),
              createdAt: new Date(),
            });

            const createdReporter = await db.query.users.findFirst({
              where: eq(schema.users.id, reporterId),
            });

            if (!createdReporter) {
              console.error('Failed to create reporter user');
              continue;
            }

            reporterFrontend = {
              id: createdReporter.id,
              name: createdReporter.name || 'Unknown',
              email: createdReporter.email || fromEmail,
              image: createdReporter.image || '',
              priority: 'MEDIUM',
            };

            const newUser: User = reporterFrontend;
            newUsers.push(newUser);
            console.log('syncEmailsAction: Created new user:', newUser.id);
        } else {
            reporterFrontend = {
              id: reporter.id,
              name: reporter.name || 'Unknown',
              email: reporter.email || '',
              image: reporter.image || '',
              priority: 'MEDIUM',
            };
            console.log('syncEmailsAction: Using existing user:', reporterFrontend.id);
        }

        const now = new Date();

        const toDoStatus = await db.query.statuses.findFirst({
          where: eq(schema.statuses.name, 'To Do'),
        });

        if (!toDoStatus) {
          console.error('syncEmailsAction: Default status "To Do" not found during email sync.');
          continue; // Skip this email if default status is not found
        }

        const ticketId = createId();
        await db.insert(schema.tickets).values({
          id: ticketId,
          title,
          description: description || null,
          statusId: toDoStatus.id,
          priority: 'MEDIUM' as any,
          projectId: 'PROJ-1',
          updatedAt: now,
          createdAt: now,
        });

        const newTicket = await db.query.tickets.findFirst({
          where: eq(schema.tickets.id, ticketId),
          with: {
            project: true,
            assignee: true,
            status: true,
          },
        });

        if (!newTicket) {
          console.error('Failed to retrieve created ticket');
          continue;
        }
        
        const ticket: Ticket = {
          id: newTicket.id,
          title: newTicket.title || '',
          description: newTicket.description || '',
          status: newTicket.status as any,
          category: "From Email",
          priority: (displayPriorityMap[newTicket.priority] || 'medium') as TicketPriority,
          createdAt: now,
          updatedAt: now,
          reporter: reporterFrontend,
          projectId: newTicket.projectId,
          project: newTicket.project, // Include project
          assignee: newTicket.assignee ? {
            id: (newTicket.assignee as any).id,
            name: (newTicket.assignee as any).name || 'Unknown',
            email: (newTicket.assignee as any).email || '',
            image: (newTicket.assignee as any).image || '',
            priority: 'MEDIUM'
          } : undefined,
        };
        newTickets.push(ticket);
        console.log('syncEmailsAction: Created ticket:', ticket.id);
    }

    console.log('syncEmailsAction: Sync completed -', newTickets.length, 'tickets,', newUsers.length, 'new users');
    return { tickets: newTickets, newUsers, count: newTickets.length };
  } catch (error) {
      console.error('syncEmailsAction: Email sync failed:', error);
      if (error instanceof Error) {
          return { error: `Failed to sync emails: ${error.message}`, count: 0 };
      }
      return { error: 'Failed to sync emails due to an unknown error.', count: 0 };
  }
}
