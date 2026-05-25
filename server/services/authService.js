const userRepository = require("../repositories/userRepository");
const { hashPassword, verifyPassword } = require("../utils/passwordHash");

const allowedRoles = ["customer", "admin"];

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeRole(role) {
  return typeof role === "string" && role.trim() ? role.trim().toLowerCase() : "customer";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createUserId() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);

  return "user-" + timestamp + "-" + suffix;
}

function safeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

function validateEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw createHttpError("Email is required.", 400);
  }

  if (!isValidEmail(normalizedEmail)) {
    throw createHttpError("A valid email address is required.", 400);
  }

  return normalizedEmail;
}

function validatePassword(password) {
  if (typeof password !== "string" || !password) {
    throw createHttpError("Password is required.", 400);
  }

  if (password.length < 6) {
    throw createHttpError("Password must be at least 6 characters.", 400);
  }

  return password;
}

function validateRole(role) {
  const normalizedRole = normalizeRole(role);

  if (!allowedRoles.includes(normalizedRole)) {
    throw createHttpError("Unsupported role.", 400);
  }

  return normalizedRole;
}

async function registerUser(payload) {
  const email = validateEmail(payload && payload.email);
  const password = validatePassword(payload && payload.password);
  const role = validateRole(payload && payload.role);
  const existingUser = await userRepository.findUserByEmail(email);

  if (existingUser) {
    throw createHttpError("Email is already registered.", 409);
  }

  const user = await userRepository.createUser({
    id: createUserId(),
    email,
    passwordHash: await hashPassword(password),
    role,
    createdAt: new Date().toISOString()
  });

  return safeUser(user);
}

async function loginUser(payload) {
  const email = validateEmail(payload && payload.email);
  const password = typeof (payload && payload.password) === "string" ? payload.password : "";

  if (!password) {
    throw createHttpError("Password is required.", 400);
  }

  const user = await userRepository.findUserByEmail(email);
  const validPassword = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !validPassword) {
    throw createHttpError("Invalid email or password.", 401);
  }

  return safeUser(user);
}

async function getCurrentUser(userId) {
  if (!userId) {
    throw createHttpError("Authentication required.", 401);
  }

  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw createHttpError("Authentication required.", 401);
  }

  return safeUser(user);
}

module.exports = {
  getCurrentUser,
  loginUser,
  registerUser
};
