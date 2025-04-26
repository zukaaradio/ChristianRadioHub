/**
 * Type declarations for modules without TypeScript definitions
 */

// Declaration for express-mysql-session
declare module 'express-mysql-session' {
  import session from 'express-session';
  
  interface MySQLStoreOptions {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    createDatabaseTable?: boolean;
    connectionLimit?: number;
    schema?: {
      tableName: string;
      columnNames: {
        session_id: string;
        expires: string;
        data: string;
      }
    }
  }

  export default function(session: typeof import('express-session')): {
    new(options: MySQLStoreOptions): session.Store;
  };
}

// Declare missing React components if needed
declare namespace React {
  interface ReactElement {
    type: any;
    props: any;
    key: any;
  }
}