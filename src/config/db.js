import pg from "pg";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const { Pool } = pg;

const getPool = () => {
  // const isLocal = process.env.POSTGRES_HOST === "localhost";

  const pool = new pg.Pool({
    user: process.env.POSTGRES_USER, // e.g., 'avnadmin'
    host: process.env.POSTGRES_HOST, // e.g., 'pg-xxxxx.aivencloud.com'
    database: process.env.POSTGRES_DB, // e.g., 'defaultdb'
    password: process.env.POSTGRES_PASSWORD, // your password
    port: Number(process.env.POSTGRES_PORT), // usually 26257 or 5432
    // ssl: isLocal ? false : { require: true, rejectUnauthorized: false },
    ssl: { require: true, rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    max: 1,
  });

  return pool;
};

export default getPool();
