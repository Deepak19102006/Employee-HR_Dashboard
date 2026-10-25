import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find backend directory whether run from root or backend
const backendDir = fs.existsSync(path.join(__dirname, 'backend'))
  ? path.join(__dirname, 'backend')
  : fs.existsSync(path.join(__dirname, 'server'))
  ? path.join(__dirname, 'server')
  : __dirname;

// Dynamically import pg and dotenv from backend/node_modules
const pgPath = path.join(backendDir, 'node_modules', 'pg', 'lib', 'index.js');
const dotenvPath = path.join(backendDir, 'node_modules', 'dotenv', 'lib', 'main.js');

let pg, dotenv;
try {
  pg = await import(`file://${pgPath.replace(/\\/g, '/')}`);
  dotenv = await import(`file://${dotenvPath.replace(/\\/g, '/')}`);
} catch (err) {
  // Try standard package resolution
  pg = await import('pg');
  dotenv = await import('dotenv');
}

dotenv.config({ path: path.join(backendDir, '.env') });

const { Client } = pg.default || pg;

const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.argv[2] || process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbName = process.env.DB_NAME || 'hr_dashboard_db';

async function setup() {
  console.log(`\n======================================================`);
  console.log(`🛠 WorkPulse HRMS: PostgreSQL Database Setup`);
  console.log(`Connecting to PostgreSQL as ${dbUser}@${dbHost}:${dbPort}...`);
  console.log(`======================================================\n`);

  const rootClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    console.log('✔ Connected to PostgreSQL server.');

    // Check if database exists
    const checkRes = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkRes.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating it now...`);
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✔ Database "${dbName}" created successfully!`);
    } else {
      console.log(`✔ Database "${dbName}" already exists.`);
    }

    await rootClient.end();

    // Now connect to the new database and run schema
    const appClient = new Client({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    });

    await appClient.connect();
    console.log(`✔ Connected to database "${dbName}". Applying schema.sql...`);

    const schemaPath = path.join(backendDir, 'src', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await appClient.query(schemaSql);
    console.log(`✔ All tables, primary keys, foreign keys, and indexes applied successfully!`);

    await appClient.end();

    // Update .env file with the password
    const envPath = path.join(backendDir, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${dbPassword}`);
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log(`✔ Updated backend/.env with your PostgreSQL password.`);
    }

    console.log(`\n🎉 PostgreSQL is 100% configured and ready!`);
    console.log(`Tables created: users, salaries, attendance, leaves, payrolls.`);
    console.log(`Start your backend: npm run backend\n`);
  } catch (err) {
    console.error(`\n❌ Error setting up PostgreSQL:`, err.message);
    if (err.message.includes('password authentication failed')) {
      console.log(`\n👉 Make sure you provided the correct password:`);
      console.log(`   node setup-db.js <your_actual_postgres_password>\n`);
    }
    process.exit(1);
  }
}

setup();
