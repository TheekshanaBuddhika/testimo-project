import { pool } from './lib/db';

async function testDb() {
  try {
    console.log("Attempting to connect to the database...");
    const [rows] = await pool.execute('SHOW TABLES;');
    console.log("Successfully connected!");
    console.log("Tables found:", rows);
    
    // Check if 'users' table exists
    const [users] = await pool.execute('SELECT * FROM users LIMIT 1;');
    console.log("Successfully queried the 'users' table.");
    
  } catch (error) {
    console.error("DATABASE CONNECTION ERROR:");
    console.error(error);
  } finally {
    process.exit(0);
  }
}

testDb();
