import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'testimo';

async function setup() {
  console.log('🔧 Testimo DB Setup (Aiven Compatible)');
  
  let ssl: any = undefined;
  
  const localCaPath = path.join(process.cwd(), 'app', 'assets', 'ca.pem');
  if (fs.existsSync(localCaPath)) {
    ssl = {
      ca: fs.readFileSync(localCaPath),
      rejectUnauthorized: true,
    };
  } else if (process.env.DB_SSL_CA_PATH) {
    ssl = { ca: fs.readFileSync(process.env.DB_SSL_CA_PATH), rejectUnauthorized: true };
  } else if ((DB_HOST || '').includes('aivencloud.com')) {
    // If no CA provided but it's Aiven, don't strictly reject if it's a self-signed chain
    // (though providing the CA is best)
    ssl = { rejectUnauthorized: false };
  }

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME, // Connect directly to defaultdb
    multipleStatements: true, // Required to run the whole schema.sql
    ssl,
  });

  try {
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log(`Running schema against "${DB_NAME}"...`);
    await conn.query(schema);
    
    console.log('✅ Schema applied successfully!');
    console.log('🎉 Database setup complete!');
  } finally {
    await conn.end();
  }
}

setup().catch((err) => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
