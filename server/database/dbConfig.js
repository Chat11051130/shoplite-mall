const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "..", "..", ".env"),
  quiet: true
});

function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const databaseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: numberFromEnv(process.env.DB_PORT, 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "shoplite_mall",
  charset: "utf8mb4"
};

module.exports = {
  databaseConfig
};
