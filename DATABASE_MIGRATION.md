# Database Migration Guide: PostgreSQL to MySQL

This application has been set up to support both PostgreSQL and MySQL. By default, it uses PostgreSQL for backward compatibility, but you can easily switch to MySQL when you're ready to run your own migrations.

## How to Switch to MySQL

1. Set the environment variable `USE_MYSQL=true` to switch to MySQL mode
2. Configure MySQL connection parameters using the following environment variables:
   - `MYSQL_HOST` - Hostname for MySQL (default: 'localhost')
   - `MYSQL_PORT` - Port for MySQL (default: 3306)
   - `MYSQL_USER` - MySQL username (default: 'root')
   - `MYSQL_PASSWORD` - MySQL password (default: 'password')
   - `MYSQL_DATABASE` - MySQL database name (default: 'radiodb')

## Running Your Own Migrations

The codebase has been set up with the following schema and data files:

- `shared/schema.ts` - PostgreSQL schema
- `shared/schema.mysql.ts` - MySQL schema
- `server/db.ts` - PostgreSQL database connection
- `server/db.mysql.ts` - MySQL database connection
- `server/storage.ts` - PostgreSQL storage implementation
- `server/storage.mysql.ts` - MySQL storage implementation

### Steps to Manage Your Own Migrations

1. Create your migration scripts in a new `migrations` directory
2. Use Drizzle's migration tools or write custom SQL scripts
3. Reference the schema defined in `shared/schema.mysql.ts`

## Schema Structure

The application uses the following tables:

1. `users` - User accounts with authentication info
2. `streams` - Radio stream configurations 
3. `shows` - Radio show definitions
4. `schedules` - Show scheduling
5. `listener_stats` - Analytics for listener engagement
6. `media_uploads` - Media file uploads
7. `analytics` - Aggregated statistics

## Example Migration Script

Here's a simple example using pure SQL that you might create in your own migration process:

```sql
-- Example migration: Add a new field to the shows table
ALTER TABLE shows ADD COLUMN category VARCHAR(100);
```

## Storage Interface

All database operations are performed through the `IStorage` interface, which is implemented by both `DatabaseStorage` (PostgreSQL) and `MySQLStorage` (MySQL). This ensures that your application code remains database-agnostic.

The `db-adapter.ts` file handles switching between implementations based on the `USE_MYSQL` environment variable.

## Best Practices

1. Always create a backup before running migrations
2. Test migrations in a development environment first
3. Consider implementing a rollback strategy for each migration
4. Document all schema changes and the reasons for them

If you need assistance with specific migration tasks, please check the Drizzle ORM documentation or consult with your database administrator.