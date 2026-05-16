# Development Documentation

This document provides instructions for setting up, running, and contributing to the Jira Clone project built with Next.js, Drizzle ORM, and Bun.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- Bun (v1.0 or higher)
- PostgreSQL (or another database compatible with Drizzle)
- Docker (optional, for database setup)
- Git

### Additional Tools

- [Drizzle ORM](https://orm.drizzle.team/): For database management.
- [Next.js](https://nextjs.org/docs): The framework used for the application.

## Project Structure

The project is structured as a Next.js application with the following key directories:

- `src/app/`: Next.js app router pages and API routes.
- `src/components/`: Reusable UI components using shadcn/ui.
- `src/lib/db/`: Drizzle schema and client initialization.
- `drizzle/`: Generated migrations.
- `docs/`: Documentation files.

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/jira-clone.git
   cd jira-clone
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory based on `.env.example` (if available) or add the following variables:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/jiraclone?schema=public"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3021"
   EMAIL_SERVER_HOST="your-email-server"
   EMAIL_SERVER_USER="your-email-user"
   EMAIL_SERVER_PASSWORD="your-email-password"
   ```

   - Generate `NEXTAUTH_SECRET` using `openssl rand -base64 32`.
   - Update `DATABASE_URL` with your PostgreSQL connection string.

4. **Database Setup**
   - Push schema to database: `bun run db:push`
   - Generate migrations: `bun run db:generate`
   - Run migrations: `bun run db:migrate`
   - Seed the database (optional): `bun run db:seed`


## Running the Application

1. **Development Server**
   Start the development server:
   ```bash
   bun run dev
   ```
   The app will be available at `http://localhost:3021`.

2. **Build for Production**
   ```bash
   bun run build
   ```

3. **Start Production Server**
   ```bash
   bun run start
   ```

## Scripts

- `bun run dev`: Starts the development server.
- `bun run build`: Builds the application for production.
- `bun run start`: Starts the production server.
- `bun run lint`: Runs ESLint to check code quality.
- `bun run db:studio`: Opens Drizzle Studio to view/edit database.

## Authentication

The project uses NextAuth.js for authentication. Configure providers in `src/lib/auth.ts` or the API route.

- Register/Login: Available at `/register` and `/login`.
- Session Provider: Wrapped in `src/components/session-provider.tsx`.

## Features

- **Projects**: Create and manage projects (`/projects`).
- **Tickets**: Board view with columns for statuses (`/tickets`).
- **Users**: User management (`/users`).
- **Settings**: Email and general settings (`/settings`).

## Database

Uses Drizzle ORM with PostgreSQL. Schema defined in `src/lib/db/schema.ts`.

- Run `bun run db:push` for schema changes during development.
- Migrations are in `drizzle/`.

## Styling

- Tailwind CSS: Configured in `tailwind.config.ts`.
- shadcn/ui components in `src/components/ui/`.

## Deployment

### Docker

Use `docker-compose.yml` for local setup with database:

```bash
docker-compose up -d
```


## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/new-feature`.
3. Commit changes: `git commit -m 'Add new feature'`.
4. Push to branch: `git push origin feature/new-feature`.
5. Open a Pull Request.

### Code Style

- Use TypeScript.
- Follow ESLint rules.
- Write tests for new features.

## Troubleshooting

- **Database Connection Error**: Check `DATABASE_URL` and ensure PostgreSQL is running.
- **Auth Issues**: Verify `NEXTAUTH_SECRET` and provider configurations.
- **Build Errors**: Run `bun run build` locally to debug.
- `Drizzle Errors`: Run `bun run db:push` to check schema sync.

## Support

For questions, open an issue on GitHub or refer to `docs/blueprint.md` for architecture details.