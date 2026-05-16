'use server';

import type { EmailCredentials } from '@/lib/types';
import type { ParsedMail } from 'mailparser';

export async function fetchUnreadEmails(credentials: EmailCredentials): Promise<ParsedMail[]> {
    const { ImapFlow } = await import('imapflow');
    const { simpleParser } = await import('mailparser');
    console.log('fetchUnreadEmails: Starting with credentials:', {
        host: credentials.host,
        port: credentials.port,
        user: credentials.user,
        hasPass: !!credentials.pass,
        tls: credentials.tls,
    });

    if (!credentials || !credentials.host || !credentials.port || !credentials.user || !credentials.pass) {
        const errorMessage = `Email fetching is not configured. Please provide all required IMAP credentials.`;
        console.error('fetchUnreadEmails: Invalid credentials -', errorMessage);
        throw new Error(errorMessage);
    }

    const client = new ImapFlow({
        host: credentials.host,
        port: credentials.port,
        secure: credentials.tls,
        auth: {
            user: credentials.user,
            pass: credentials.pass
        },
        tls: {
            rejectUnauthorized: false
        },
        logger: false
    });

    const emails: ParsedMail[] = [];

    try {
        console.log('fetchUnreadEmails: Connecting to IMAP server...');
        await client.connect();
        
        console.log('fetchUnreadEmails: IMAP connection successful, opening INBOX');
        const lock = await client.getMailboxLock('INBOX');
        
        try {
            console.log('fetchUnreadEmails: INBOX opened, searching for UNSEEN emails');
            // Search for messages that don't have the \Seen flag
            const messages = await client.search({ seen: false });

            if (!messages || messages.length === 0) {
                console.log('fetchUnreadEmails: No unread emails found');
                return [];
            }

            console.log(`fetchUnreadEmails: Found ${messages.length} UNSEEN emails`);

            console.log('fetchUnreadEmails: Fetching email bodies...');
            for (const seq of messages) {
                console.log(`fetchUnreadEmails: Processing message with sequence number ${seq}`);
                // fetchOne returns a Message object with source (Buffer)
                const message = await client.fetchOne(seq.toString(), { source: true });
                if (message && message.source) {
                    const parsed = await simpleParser(message.source);
                    console.log(`processMessage: Successfully parsed email with subject: "${parsed.subject || 'No Subject'}" from "${parsed.from?.text || 'Unknown'}"`);
                    emails.push(parsed);
                }
            }

            // Mark emails as read after successful parsing
            if (emails.length > 0) {
                console.log('fetchUnreadEmails: Marking emails as read...');
                // Mark messages in the search results as seen
                await client.messageFlagsAdd(messages.join(','), ['\\Seen']);
                console.log('fetchUnreadEmails: Successfully marked emails as read');
            }

        } finally {
            // Always release the lock
            lock.release();
        }

        // Logout from the IMAP server
        await client.logout();
        console.log(`fetchUnreadEmails: IMAP connection closed. Successfully processed ${emails.length} emails`);
        return emails;

    } catch (err) {
        console.error('fetchUnreadEmails: IMAP error:', err);
        if (err instanceof Error) {
            if (err.message.includes('AUTH')) {
                console.error('fetchUnreadEmails: Authentication failed - check username/password and Gmail app password settings');
            } else if (err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
                console.error('fetchUnreadEmails: Connection refused - check IMAP host/port and network connectivity');
            }
        }
        throw err;
    }
}
