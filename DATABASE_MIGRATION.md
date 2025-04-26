# MySQL Database Configuration Guide

This application now uses MySQL exclusively for database storage. This guide explains how to configure and run the application with your own MySQL server.

## MySQL Connection Configuration

Configure your MySQL connection by setting these environment variables:

- `MYSQL_HOST` - Your MySQL server hostname (default: 'localhost')
- `MYSQL_PORT` - Your MySQL server port (default: 3306)
- `MYSQL_USER` - Your MySQL username (default: 'root')
- `MYSQL_PASSWORD` - Your MySQL password (default: 'password')
- `MYSQL_DATABASE` - Your MySQL database name (default: 'radiodb')

You can set these in your environment or create a `.env` file in the project root.

## Schema Structure

The application uses the following MySQL tables:

1. `users` - User accounts with authentication info
2. `streams` - Radio stream configurations 
3. `shows` - Radio show definitions
4. `schedules` - Show scheduling
5. `listener_stats` - Analytics for listener engagement
6. `media_uploads` - Media file uploads
7. `analytics` - Aggregated statistics
8. `sessions` - Authentication session storage

## Database Schema Creation

We've included a schema generation script that you can use to set up your MySQL database:

```bash
# Generate the schema SQL
node mysql-schema.js > schema.sql

# Apply the schema to your database
mysql -u your_username -p radiodb < schema.sql
```

## Managing Your Own Migrations

Since you'll be running this on your own server, you'll need to manage your own database migrations. We recommend:

1. Creating a `migrations` directory to store your migration scripts
2. Using the `migrations` table (included in the schema) to track applied migrations
3. Creating timestamped migration files for each schema change

Example migration script format:

```sql
-- 001_add_category_to_shows.sql
ALTER TABLE shows ADD COLUMN category VARCHAR(100);
INSERT INTO migrations (name) VALUES ('001_add_category_to_shows');
```

## Application Database Connection

The application connects to your MySQL database via the settings in `server/db.mysql.ts`.

When deploying to production, ensure your environment variables are properly set on your server and that your MySQL server allows connections from your application server.

## Best Practices

1. Always create a backup before running migrations
2. Test migrations in a development environment first
3. Consider implementing a rollback strategy for each migration
4. Document all schema changes and the reasons for them

For more detailed information on managing your MySQL database, please refer to:
- `MYSQL_SERVER_DEPLOYMENT.md` - For deploying on your own server
- `MYSQL_MANAGEMENT.md` - For day-to-day database management