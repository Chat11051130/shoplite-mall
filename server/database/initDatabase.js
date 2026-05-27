const fs = require("fs").promises;
const path = require("path");
const { closePool, createServerConnection, getPool } = require("./database");
const { databaseConfig } = require("./dbConfig");

function escapeIdentifier(identifier) {
  return "`" + String(identifier).replace(/`/g, "``") + "`";
}

function splitSqlStatements(sql) {
  return sql.split(";").map(function (statement) {
    return statement.trim();
  }).filter(Boolean);
}

async function createDatabaseIfMissing() {
  const connection = await createServerConnection();
  const databaseName = databaseConfig.database;

  if (!databaseName) {
    throw new Error("DB_NAME is required before initializing the database.");
  }

  try {
    await connection.query(
      "CREATE DATABASE IF NOT EXISTS " + escapeIdentifier(databaseName) + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
    console.log("Database ready: " + databaseName);
  } finally {
    await connection.end();
  }
}

async function initializeDatabase() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");
  const statements = splitSqlStatements(schemaSql);
  const pool = getPool();

  await createDatabaseIfMissing();

  for (const statement of statements) {
    await pool.query(statement);
  }

  console.log("Schema initialized with " + statements.length + " statements.");
}

async function main() {
  try {
    await initializeDatabase();
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  main().catch(function (error) {
    console.error("Database initialization failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  initializeDatabase
};
