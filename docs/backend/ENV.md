# Environment Variables

## Required Variables

### Server Configuration

- `PORT`: Port number for the server (default: 3333)

### Better Auth Configuration

- `BETTER_AUTH_SECRET`: Secret key for Better Auth (minimum 32 characters, change in production)
- `BETTER_AUTH_URL`: Base URL for Better Auth (default: http://localhost:3333)
- `BETTER_AUTH_BASE_URL`: Base URL for Better Auth (default: http://localhost:3333)

### CORS Configuration

- `CLIENT_ORIGIN`: Origin URL for CORS (default: http://localhost:5173)

### Database (Optional - not required for login feature)

- `DATABASE_URL`: PostgreSQL connection string (default: postgresql://postgres:postgres@localhost:5432/lw-financial)

### Email/SMTP Configuration

- `SMTP_HOST`: SMTP server host (default: localhost for MailHog in development)
- `SMTP_PORT`: SMTP server port (default: 1025 for MailHog)
- `SMTP_USER`: SMTP username (optional for MailHog)
- `SMTP_PASS`: SMTP password (optional for MailHog)
- `SMTP_SECURE`: Use secure connection (true/false, default: false for MailHog)
- `SMTP_FROM`: Email address for "From" field (default: noreply@localhost)
- `APP_NAME`: Application name for email sender (default: LW Financial App)

### MailHog Configuration (Docker Compose)

- `MAILHOG_SMTP_PORT`: SMTP port for MailHog (default: 1025)
- `MAILHOG_WEB_PORT`: Web UI port for MailHog (default: 8025)

## Example .env file

```env
PORT=3333
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars-change-in-production
BETTER_AUTH_URL=http://localhost:3333
BETTER_AUTH_BASE_URL=http://localhost:3333
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lw-financial_dev

# Email/SMTP Configuration (MailHog for development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM=noreply@localhost
APP_NAME=LW Financial App
```

## Generating BETTER_AUTH_SECRET

You can generate a secure secret using:

```bash
openssl rand -base64 32
```
