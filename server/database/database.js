const mysql = require("mysql2/promise");
const { databaseConfig } = require("./dbConfig");

let pool;

function baseConnectionConfig(includeDatabase) {
  const config = {
    host: databaseConfig.host,
    port: databaseConfig.port,
    user: databaseConfig.user,
    password: databaseConfig.password,
    charset: databaseConfig.charset,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: false,
    decimalNumbers: true
  };

  if (includeDatabase) {
    config.database = databaseConfig.database;
  }

  return config;
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool(baseConnectionConfig(true));
  }

  return pool;
}

async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params || []);
  return rows;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

async function createServerConnection() {
  return mysql.createConnection(baseConnectionConfig(false));
}

module.exports = {
  closePool,
  createServerConnection,
  getPool,
  query
};
