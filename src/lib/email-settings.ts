
'use server';

import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { EmailSettings } from './types';

/**
 * Saves email settings to the database for the authenticated user.
 * @param settings - The email settings to save.
 */
export async function saveEmailSettings(settings: EmailSettings) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    console.log('Saving email settings for user:', session.user.id);
    console.log('IMAP settings:', {
      host: settings.imap.host,
      port: settings.imap.port,
      user: settings.imap.user,
      tls: settings.imap.tls,
    });
    console.log('SMTP settings:', {
      host: settings.smtp.host,
      port: settings.smtp.port,
      user: settings.smtp.user,
    });

    await db.update(users)
      .set({
        imapHost: settings.imap.host || null,
        imapPort: settings.imap.port || null,
        imapUser: settings.imap.user || null,
        imapPass: settings.imap.pass || null,
        imapUseTls: settings.imap.tls ?? null,
        smtpHost: settings.smtp.host || null,
        smtpPort: settings.smtp.port || null,
        smtpUser: settings.smtp.user || null,
        smtpPass: settings.smtp.pass || null,
      })
      .where(eq(users.id, session.user.id));

    console.log('Email settings saved successfully for user:', session.user.id);

    return { success: true };
  } catch (error) {
    console.error('Error saving email settings:', error);
    throw error;
  }
}

/**
 * Retrieves email settings from the database for the authenticated user.
 * @returns The email settings or null if not found.
 */
export async function getEmailSettings() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return null;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return null;
    }

    const settings = {
      imap: {
        host: user.imapHost || '',
        port: user.imapPort || 993,
        user: user.imapUser || '',
        pass: user.imapPass || '',
        tls: user.imapUseTls || true,
      },
      smtp: {
        host: user.smtpHost || '',
        port: user.smtpPort || 465,
        user: user.smtpUser || '',
        pass: user.smtpPass || '',
        tls: true, // SMTP TLS is handled differently
      },
    };

    console.log('Retrieved email settings for user:', session.user.id);
    console.log('IMAP settings retrieved:', {
      host: settings.imap.host,
      port: settings.imap.port,
      user: settings.imap.user,
      hasPass: !!settings.imap.pass,
      tls: settings.imap.tls,
    });

    return settings;
  } catch (error) {
    console.error('Error retrieving email settings:', error);
    return null;
  }
}

/**
 * Clears email settings from the database for the authenticated user.
 */
export async function clearEmailSettings() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    await db.update(users)
      .set({
        imapHost: null,
        imapPort: null,
        imapUser: null,
        imapPass: null,
        imapUseTls: null,
        smtpHost: null,
        smtpPort: null,
        smtpUser: null,
        smtpPass: null,
      })
      .where(eq(users.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error('Error clearing email settings:', error);
    throw error;
  }
}
