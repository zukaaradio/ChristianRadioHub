import { log } from './vite';
import { storage as pgStorage } from './storage';
import { storage as mysqlStorage } from './storage.mysql';
import { IStorage } from './storage';

// Determine which database to use based on environment variables
// Default to PostgreSQL for backward compatibility
export function getDatabaseStorage(): IStorage {
  const useMySQL = process.env.USE_MYSQL === 'true';
  
  if (useMySQL) {
    log("Using MySQL database");
    return mysqlStorage;
  } else {
    log("Using PostgreSQL database");
    return pgStorage;
  }
}