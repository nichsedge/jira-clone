import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '@/lib/db';
import { statuses } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
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

    const statusesResult = await db.query.statuses.findMany({
      orderBy: [asc(statuses.createdAt)],
    });

    console.log(`DEBUG: Found ${statusesResult.length} statuses for user ${session.user.id}`);
    console.log(`DEBUG: Status IDs:`, statusesResult.map(s => s.id).join(', '));

    return NextResponse.json(statusesResult);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}