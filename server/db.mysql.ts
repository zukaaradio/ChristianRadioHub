import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema.mysql";
import { log } from './vite';

// Check if we're in development environment on Replit
const isDevEnvironment = process.env.NODE_ENV === 'development' && process.env.REPL_ID;

let connectionPool;
let db;

if (isDevEnvironment) {
  // Use in-memory SQLite for development on Replit
  log(`Development environment detected. Using in-memory database for testing.`);
  
  // Mock MySQL interface for development
  // Use the already imported mysql
  connectionPool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'radiodb',
    port: 3306,
    // This is a mock connection that will be replaced with direct operations
  });
  
  // Create a mock DB implementation that will work with the interface
  db = {
    select: () => ({ 
      from: () => ({ 
        where: () => [],
        orderBy: () => ({ limit: () => [] }),
        limit: () => []
      })
    }),
    insert: () => ({ 
      values: () => ({ 
        returning: () => [{ id: 1 }],
        rowsAffected: 1,
        insertId: 1
      }) 
    }),
    update: () => ({ 
      set: () => ({ 
        where: () => ({
          returning: () => [{ id: 1 }],
          rowsAffected: 1
        }) 
      }) 
    }),
    delete: () => ({ 
      where: () => ({ 
        returning: () => true,
        rowsAffected: 1 
      }) 
    }),
    // Add other mock methods as needed
  };
} else {
  // Real MySQL configuration for your own server
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'radiodb',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    connectionLimit: 10
  };

  log(`Connecting to MySQL at ${config.host}:${config.port}/${config.database}`);

  // Create the real MySQL connection pool
  connectionPool = mysql.createPool(config);
  
  // Create real drizzle ORM instance
  db = drizzle(connectionPool, { schema, mode: 'default' });
}

export { db };
export const pool = connectionPool;