import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, or, and, exists } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const projects = await db.query.projects.findMany({
      where: or(
        eq(schema.projects.ownerId, userId),
        exists(
          db.select()
            .from(schema.projectMembers)
            .where(
              and(
                eq(schema.projectMembers.projectId, schema.projects.id),
                eq(schema.projectMembers.userId, userId)
              )
            )
        )
      ),
      with: {
        owner: true,
        members: {
          with: {
            user: true
          }
        },
        tickets: true,
      },
    });

    // Map members to match Prisma's format (User[])
    const projectsWithMappedMembers = projects.map(p => ({
      ...p,
      members: p.members.map(m => m.user)
    }));

    return NextResponse.json(projectsWithMappedMembers);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate that the user exists in the database
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, session.user.id)
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please register first.' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const projectId = createId();
    await db.insert(schema.projects).values({
      id: projectId,
      name,
      description,
      ownerId: session.user.id,
      updatedAt: new Date(),
      createdAt: new Date(),
    });

    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
      with: {
        owner: true,
        members: {
          with: {
            user: true
          }
        },
      },
    });

    if (!project) {
        throw new Error('Failed to create project');
    }

    // Map members
    const mappedProject = {
        ...project,
        members: project.members.map(m => m.user)
    };

    return NextResponse.json(mappedProject, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}