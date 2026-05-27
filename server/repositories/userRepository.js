const { getPool } = require("../database/database");

const userColumns = [
  "id",
  "email",
  "password_hash",
  "role",
  "created_at",
  "updated_at"
];

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeRole(role) {
  return role === "admin" ? "admin" : "customer";
}

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function dateToIso(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function rowToUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: normalizeEmail(row.email),
    passwordHash: row.password_hash,
    role: normalizeRole(row.role),
    createdAt: dateToIso(row.created_at),
    updatedAt: dateToIso(row.updated_at)
  };
}

async function getAllUsers() {
  const [rows] = await getPool().query(
    "SELECT " + userColumns.join(", ") + " FROM users ORDER BY created_at ASC"
  );

  return rows.map(rowToUser);
}

async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const [rows] = await getPool().execute(
    "SELECT " + userColumns.join(", ") + " FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail]
  );

  return rowToUser(rows[0]);
}

async function findUserById(id) {
  if (!id) {
    return null;
  }

  const [rows] = await getPool().execute(
    "SELECT " + userColumns.join(", ") + " FROM users WHERE id = ? LIMIT 1",
    [id]
  );

  return rowToUser(rows[0]);
}

async function createUser(userInput) {
  const user = {
    id: userInput.id,
    email: normalizeEmail(userInput.email),
    passwordHash: userInput.passwordHash,
    role: normalizeRole(userInput.role),
    createdAt: userInput.createdAt || new Date().toISOString(),
    updatedAt: userInput.updatedAt || null
  };

  try {
    await getPool().execute(
      [
        "INSERT INTO users",
        "(id, email, password_hash, role, created_at, updated_at)",
        "VALUES (?, ?, ?, ?, ?, ?)"
      ].join(" "),
      [
        user.id,
        user.email,
        user.passwordHash,
        user.role,
        new Date(user.createdAt),
        user.updatedAt ? new Date(user.updatedAt) : null
      ]
    );
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      throw createHttpError("Email is already registered.", 409);
    }
    throw error;
  }

  return findUserById(user.id);
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers
};
