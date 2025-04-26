import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema.mysql";
import { log } from './vite';

// MySQL connection configuration for your own server
// Configure these variables in your server environment
const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'radiodb',
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  connectionLimit: 10
};

log(`Connecting to MySQL at ${config.host}:${config.port}/${config.database}`);

// Create the MySQL connection pool
const connectionPool = mysql.createPool(config);

// Create drizzle ORM instance
export const db = drizzle(connectionPool, { schema, mode: 'default' });
export const pool = connectionPool;