const { closePool, createServerConnection } = require("./database");
const { databaseConfig } = require("./dbConfig");
const { initializeDatabase } = require("./initDatabase");
const { seedDatabase } = require("./seedDatabase");

function escapeIdentifier(identifier) {
  return "`" + String(identifier).replace(/`/g, "``") + "`";
}

async function dropDatabase() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to reset the database when NODE_ENV=production.");
  }

  if (!databaseConfig.database) {
    throw new Error("DB_NAME is required before resetting the database.");
  }

  const connection = await createServerConnection();

  try {
    console.log("Reset target database: " + databaseConfig.database);
    await connection.query("DROP DATABASE IF EXISTS " + escapeIdentifier(databaseConfig.database));
    console.log("Dropped database if it existed: " + databaseConfig.database);
  } finally {
    await connection.end();
  }
}

async function resetDatabase() {
  await closePool();
  await dropDatabase();
  await initializeDatabase();
  await seedDatabase();
  await closePool();
  console.log("Database reset complete: " + databaseConfig.database);
}

if (require.main === module) {
  resetDatabase().catch(function (error) {
    console.error("Database reset failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  resetDatabase
};
