import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';

async function checkUsers() {
  const allUsers = await db.select().from(users);
  console.log('Users in DB:', allUsers.map(u => ({ id: u.id, email: u.email })));
  process.exit(0);
}

checkUsers();
