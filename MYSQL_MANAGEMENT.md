# MySQL Database Management Guide

This guide provides instructions for managing your own MySQL database for the Christian Radio Station application.

## 1. Setting Up Your MySQL Database

### Creating the Database and Tables

Run the following commands on your MySQL server:

```bash
# Connect to MySQL
mysql -u your_username -p

# Create the database
CREATE DATABASE radiodb;
USE radiodb;

# Run the schema creation script
# Option 1: Run the script directly
source /path/to/schema.sql

# Option 2: Generate the schema file and run it
node mysql-schema.js > schema.sql
mysql -u your_username -p radiodb < schema.sql
```

## 2. Managing Connection Settings

The application connects to your MySQL database using the following environment variables:

```
MYSQL_HOST=localhost     # Your MySQL server hostname
MYSQL_PORT=3306          # Your MySQL server port
MYSQL_USER=root          # Your MySQL username
MYSQL_PASSWORD=password  # Your MySQL password
MYSQL_DATABASE=radiodb   # Your MySQL database name
```

Set these variables in your environment or create a `.env` file in your project's root directory.

## 3. Performing Migrations

When you need to update your database schema, you have several options:

### Option 1: Manual Migration

Create and run SQL scripts manually on your server.

### Option 2: Simple Drizzle Push

For development and simple deployments, you can use the Drizzle push command:

```bash
# Update DATABASE_URL for MySQL first
export DATABASE_URL=mysql://user:password@localhost:3306/radiodb
npm run db:push
```

### Option 3: Custom Migration System

Implement your own migration system using the `migrations` table we've included in the schema.

Example migration script:

```javascript
// migrations/001_add_category_to_shows.js
const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'radiodb',
  });

  // Check if migration was already applied
  const [rows] = await connection.execute(
    'SELECT * FROM migrations WHERE name = ?',
    ['001_add_category_to_shows']
  );

  if (rows.length > 0) {
    console.log('Migration already applied');
    await connection.end();
    return;
  }

  // Apply the migration
  await connection.execute(
    'ALTER TABLE shows ADD COLUMN category VARCHAR(100)'
  );

  // Record the migration
  await connection.execute(
    'INSERT INTO migrations (name) VALUES (?)',
    ['001_add_category_to_shows']
  );

  console.log('Migration successfully applied');
  await connection.end();
}

runMigration().catch(console.error);
```

## 4. Backing Up Your Database

Regularly backup your MySQL database:

```bash
# Create a full backup
mysqldump -u your_username -p radiodb > radiodb_backup.sql

# Restore from backup
mysql -u your_username -p radiodb < radiodb_backup.sql
```

## 5. Troubleshooting

### Connection Issues

If you can't connect to your MySQL server:

1. Verify your MySQL server is running
2. Check your firewall settings
3. Verify your MySQL user has the necessary permissions
4. Confirm your connection details in the environment variables

### Schema Issues

If you encounter schema-related errors:

1. Compare your database schema with the definition in `shared/schema.mysql.ts`
2. Run `SHOW CREATE TABLE table_name` to verify your table structure
3. Consider re-running the schema creation script

## 6. Best Practices

1. Always back up your database before migrations
2. Test migrations in a development environment first
3. Use transactions for complex migrations
4. Keep your MySQL server secure with proper authentication
5. Regularly update your MySQL server with security patches