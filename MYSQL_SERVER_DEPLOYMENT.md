# MySQL Server Deployment Guide

This document provides instructions for deploying the Christian Radio Station application on your own server using MySQL as the database backend.

## Prerequisites

1. A web server running Node.js 18 or higher
2. MySQL server (5.7 or higher)
3. npm or yarn package manager

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure MySQL Connection

Set up the following environment variables on your server to connect to your MySQL database:

- `MYSQL_HOST` - MySQL server hostname (default: 'localhost')
- `MYSQL_PORT` - MySQL server port (default: 3306)
- `MYSQL_USER` - MySQL username (default: 'root')
- `MYSQL_PASSWORD` - MySQL password
- `MYSQL_DATABASE` - MySQL database name (default: 'radiodb')

You can set these variables in your environment or create a `.env` file in the project root.

Example `.env` file:
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=radiodb
```

### 4. Create MySQL Database

First, create the database on your MySQL server:

```sql
CREATE DATABASE radiodb;
```

### 5. Run Your Own Migrations

The application schema is defined in `shared/schema.mysql.ts`. You can use this as a reference to create your own migration scripts or generate SQL schema yourself.

#### Option 1: Manual Database Setup

You can manually create the required tables based on the schema defined in `shared/schema.mysql.ts`, creating each table with the proper columns and constraints.

#### Option 2: Use Drizzle Kit

For simple migration management, you can use Drizzle's push command (included in package.json):

```bash
npm run db:push
```

This will automatically create all the necessary tables based on the schema definition.

### 6. Start the Application

```bash
npm run dev
```

For production deployment, you can use:

```bash
npm run build
npm run start
```

## Database Schema Overview

The application uses the following database tables:

1. `users` - User accounts for admin access
2. `streams` - Radio stream configurations
3. `shows` - Radio show definitions
4. `schedules` - Show scheduling and rotation
5. `listener_stats` - Analytics for listener engagement
6. `media_uploads` - Media file uploads
7. `analytics` - Aggregated statistics

## Creating Your Own Migrations

Since you'll be managing your own migrations, consider adding a version or migration tracking table to keep track of applied migrations:

```sql
CREATE TABLE migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Each migration script you create can then register itself in this table when successfully applied.

## Backup Strategy

Regularly backup your MySQL database using:

```bash
mysqldump -u [username] -p [database_name] > backup.sql
```

## Need Help?

If you encounter any issues deploying to your own server, please refer to:

1. MySQL documentation: https://dev.mysql.com/doc/
2. Drizzle ORM documentation: https://orm.drizzle.team/docs/overview
3. Node.js deployment guides: https://nodejs.org/en/docs/guides/