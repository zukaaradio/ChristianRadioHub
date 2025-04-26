/**
 * MySQL Connection Test Script
 * 
 * This script tests your MySQL connection using the configuration in your environment variables.
 * Run with: node mysql-test.js
 */

const mysql = require('mysql2/promise');

async function testMySQLConnection() {
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'radiodb',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  };

  console.log('Testing MySQL connection with configuration:');
  console.log(JSON.stringify({
    host: config.host,
    user: config.user,
    password: '********', // Password hidden for security
    database: config.database,
    port: config.port,
  }, null, 2));

  try {
    // Try to connect
    const connection = await mysql.createConnection(config);
    console.log('✅ MySQL connection successful!');

    // Check if the database exists
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', [config.database]);
    if (databases.length === 0) {
      console.log(`⚠️ Database '${config.database}' does not exist. You'll need to create it.`);
    } else {
      console.log(`✅ Database '${config.database}' exists.`);

      // Check if the tables exist
      const tables = ['users', 'streams', 'shows', 'schedules', 'listener_stats', 'media_uploads', 'analytics', 'sessions', 'migrations'];
      const [rows] = await connection.query('SHOW TABLES');
      const existingTables = rows.map(row => Object.values(row)[0]);
      
      console.log('\nChecking required tables:');
      for (const table of tables) {
        if (existingTables.includes(table)) {
          console.log(`✅ Table '${table}' exists.`);
        } else {
          console.log(`❌ Table '${table}' is missing. Run the schema creation script.`);
        }
      }
    }

    // Close the connection
    await connection.end();
  } catch (error) {
    console.error('❌ MySQL connection failed:');
    console.error(error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔑 Suggestion: Check your MySQL username and password.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n🔌 Suggestion: Make sure your MySQL server is running and accessible at the specified host and port.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log(`\n📁 Suggestion: The database '${config.database}' doesn't exist. Create it using:`);
      console.log(`CREATE DATABASE ${config.database};`);
    }
  }
}

testMySQLConnection().catch(console.error);