const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || "remnant",
      password: process.env.PGPASSWORD || "remnant",
      database: process.env.PGDATABASE || "remnant",
    });

module.exports = pool;
