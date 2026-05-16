import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, or, and, exists, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session?.user?.id) {
      console.log('DEBUG: No session or user ID - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`DEBUG: Logged in user: ${session.user.email || session.user.name} (ID: ${session.user.id})`);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    console.log(`DEBUG: Request projectId: ${projectId || 'none'}`);

    let whereClause;
    if (projectId) {
      // Check access to specific project
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
        console.log(`DEBUG: User ${session.user.id} has no access to project ${projectId}`);
        return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
      }
      console.log(`DEBUG: User has access to project ${projectId}`);
      whereClause = eq(schema.tickets.projectId, projectId);
    } else {
      // Fetch all tickets for user's accessible projects
      whereClause = or(
        eq(schema.projects.ownerId, session.user.id),
        exists(
          db.select()
            .from(schema.projectMembers)
            .where(
              and(
                eq(schema.projectMembers.projectId, schema.projects.id),
                eq(schema.projectMembers.userId, session.user.id)
              )
            )
        )
      );
      console.log(`DEBUG: whereClause for all projects`);
    }

    const tickets = await db.query.tickets.findMany({
      where: projectId ? whereClause : undefined, // If no projectId, we need to join projects to check access
      with: {
        project: true,
        assignee: true,
        status: true,
      },
      orderBy: [desc(schema.tickets.createdAt)],
    });

    // If no projectId, filter tickets by project access (Drizzle query with: { project: true } doesn't automatically filter by project where clause in findMany unless we use a join)
    // Actually, I should use a join to be efficient.
    
    let finalTickets = tickets;
    if (!projectId) {
      // For simplicity, let's just fetch all and filter or use a more complex join.
      // Better way:
      finalTickets = await db.select({
        ticket: schema.tickets,
        project: schema.projects,
        assignee: schema.users,
        status: schema.statuses,
      })
      .from(schema.tickets)
      .innerJoin(schema.projects, eq(schema.tickets.projectId, schema.projects.id))
      .leftJoin(schema.users, eq(schema.tickets.assigneeId, schema.users.id))
      .leftJoin(schema.statuses, eq(schema.tickets.statusId, schema.statuses.id))
      .where(whereClause)
      .orderBy(desc(schema.tickets.createdAt));
      
      // Map back to expected format
      return NextResponse.json(finalTickets.map(t => ({
        ...t.ticket,
        project: t.project,
        assignee: t.assignee,
        status: t.status,
      })));
    }

    console.log(`DEBUG: Found ${tickets.length} tickets for user ${session.user.id}`);
    console.log(`DEBUG: Ticket IDs:`, tickets.map(t => t.id).join(', '));

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, statusId, priority, projectId, assigneeId } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and Project ID are required' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
    }

    const ticketId = createId();
    await db.insert(schema.tickets).values({
      id: ticketId,
      title,
      description: description || null,
      statusId: statusId || null,
      priority: priority || 'MEDIUM',
      projectId,
      assigneeId: assigneeId || null,
      updatedAt: new Date(),
      createdAt: new Date(),
    });

    const ticket = await db.query.tickets.findFirst({
      where: eq(schema.tickets.id, ticketId),
      with: {
        project: true,
        assignee: true,
        status: true,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, statusId, priority, assigneeId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const ticket = await db.query.tickets.findFirst({
      where: eq(schema.tickets.id, id),
      with: { project: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
    }

    await db.update(schema.tickets)
      .set({
        title,
        description,
        statusId,
        priority,
        assigneeId,
        updatedAt: new Date(),
      })
      .where(eq(schema.tickets.id, id));

    const updatedTicket = await db.query.tickets.findFirst({
      where: eq(schema.tickets.id, id),
      with: {
        project: true,
        assignee: true,
        status: true,
      },
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}