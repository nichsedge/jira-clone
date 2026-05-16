import { db } from './index';
import * as schema from './schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Seeding database...');
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const adminEmail = 'admin@example.com';

  // Create super admin user
  const adminId = 'ADMIN-1';
  const existingAdmin = await db.query.users.findFirst({
    where: eq(schema.users.id, adminId),
  });

  if (!existingAdmin) {
    await db.insert(schema.users).values({
      id: adminId,
      name: 'Super Admin',
      email: adminEmail,
      hashedPassword,
      image: 'https://placehold.co/32x32/E9D5FF/6D28D9/png?text=A',
      imapHost: process.env.IMAP_HOST,
      imapPort: parseInt(process.env.IMAP_PORT || '993'),
      imapUser: process.env.IMAP_USER,
      imapPass: process.env.IMAP_PASS,
      imapUseTls: process.env.IMAP_USE_TLS === 'true',
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT || '465'),
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
      updatedAt: new Date(),
      createdAt: new Date(),
    });
  } else {
    // Update existing admin to match seed credentials
    await db.update(schema.users)
      .set({
        email: adminEmail,
        hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, adminId));
  }

  // Create additional users
  const usersToSeed = [
    {
      id: 'USER-1',
      name: 'John Developer',
      email: 'developer@example.com',
      hashedPassword: await bcrypt.hash('password123', 12),
      image: 'https://placehold.co/32x32/10B981/FFFFFF/png?text=J',
    },
    {
      id: 'USER-2',
      name: 'Jane Designer',
      email: 'designer@example.com',
      hashedPassword: await bcrypt.hash('password123', 12),
      image: 'https://placehold.co/32x32/EF4444/FFFFFF/png?text=J',
    },
    {
      id: 'USER-3',
      name: 'Bob Tester',
      email: 'tester@example.com',
      hashedPassword: await bcrypt.hash('password123', 12),
      image: 'https://placehold.co/32x32/F59E0B/FFFFFF/png?text=B',
    },
  ];

  for (const u of usersToSeed) {
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.id, u.id),
    });
    if (!existing) {
      await db.insert(schema.users).values({
        ...u,
        updatedAt: new Date(),
        createdAt: new Date(),
      });
    }
  }

  // Create projects
  const projectsToSeed = [
    {
      id: 'PROJ-1',
      name: 'ProFlow App',
      description: 'The main application development project.',
      ownerId: adminId,
    },
    {
      id: 'PROJ-2',
      name: 'Marketing Website',
      description: 'Project for the new marketing website.',
      ownerId: 'USER-1',
    },
    {
      id: 'PROJ-3',
      name: 'Mobile App',
      description: 'React Native mobile application development.',
      ownerId: 'USER-2',
    },
  ];

  for (const p of projectsToSeed) {
    const existing = await db.query.projects.findFirst({
      where: eq(schema.projects.id, p.id),
    });
    if (!existing) {
      await db.insert(schema.projects).values({
        ...p,
        updatedAt: new Date(),
        createdAt: new Date(),
      });
    }
  }

  // Project memberships
  const memberships = [
    { projectId: 'PROJ-1', userId: 'USER-1' },
    { projectId: 'PROJ-1', userId: 'USER-2' },
    { projectId: 'PROJ-1', userId: 'USER-3' },
    { projectId: 'PROJ-2', userId: adminId },
    { projectId: 'PROJ-2', userId: 'USER-2' },
    { projectId: 'PROJ-2', userId: 'USER-3' },
    { projectId: 'PROJ-3', userId: adminId },
    { projectId: 'PROJ-3', userId: 'USER-1' },
    { projectId: 'PROJ-3', userId: 'USER-3' },
  ];

  for (const m of memberships) {
    const existing = await db.query.projectMembers.findFirst({
      where: and(
        eq(schema.projectMembers.projectId, m.projectId),
        eq(schema.projectMembers.userId, m.userId)
      ),
    });
    if (!existing) {
      await db.insert(schema.projectMembers).values(m);
    }
  }

  // Statuses
  const statusesToSeed = [
    { id: 'status-todo', name: 'To Do', color: '#6B7280' },
    { id: 'status-open', name: 'Open', color: '#3B82F6' },
    { id: 'status-in-progress', name: 'In Progress', color: '#F59E0B' },
    { id: 'status-done', name: 'Done', color: '#10B981' },
  ];

  for (const s of statusesToSeed) {
    const existing = await db.query.statuses.findFirst({
      where: eq(schema.statuses.id, s.id),
    });
    if (!existing) {
      await db.insert(schema.statuses).values({
        ...s,
        updatedAt: new Date(),
        createdAt: new Date(),
      });
    }
  }

  // Tickets
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const ticketsToSeed = [
    {
      id: 'TICKET-8782',
      title: 'UI bug on login page',
      description: 'The login button is misaligned on mobile devices, making it difficult to click.',
      statusId: 'status-todo',
      priority: 'HIGH' as const,
      createdAt: yesterday,
      updatedAt: yesterday,
      assigneeId: adminId,
      projectId: 'PROJ-1',
    },
    {
      id: 'TICKET-5214',
      title: 'API endpoint for user data is slow',
      description: 'The /api/users endpoint is taking over 2 seconds to respond, impacting performance.',
      statusId: 'status-open',
      priority: 'HIGH' as const,
      createdAt: threeDaysAgo,
      updatedAt: twoDaysAgo,
      assigneeId: 'USER-1',
      projectId: 'PROJ-1',
    },
    {
      id: 'TICKET-3921',
      title: 'Design new dashboard layout',
      description: 'Create wireframes and mockups for the new dashboard interface with improved UX.',
      statusId: 'status-in-progress',
      priority: 'MEDIUM' as const,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
      assigneeId: 'USER-2',
      projectId: 'PROJ-2',
    },
    {
      id: 'TICKET-7483',
      title: 'Implement user authentication',
      description: 'Add JWT-based authentication with role-based access control for different user types.',
      statusId: 'status-done',
      priority: 'HIGH' as const,
      createdAt: oneWeekAgo,
      updatedAt: yesterday,
      assigneeId: 'USER-1',
      projectId: 'PROJ-1',
    },
  ];

  for (const t of ticketsToSeed) {
    const existing = await db.query.tickets.findFirst({
      where: eq(schema.tickets.id, t.id),
    });
    if (!existing) {
      await db.insert(schema.tickets).values({
        ...t,
        updatedAt: t.updatedAt || new Date(),
        createdAt: t.createdAt || new Date(),
      });
    }
  }

  console.log('Database seeded successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
