const path = require("path");
const { dataPath } = require("../config/serverConfig");
const { readJsonFile, writeJsonFile } = require("../utils/fileStore");

const usersFilePath = path.join(dataPath, "users.json");

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

async function getAllUsers() {
  const users = await readJsonFile(usersFilePath);
  return Array.isArray(users) ? users : [];
}

async function saveAllUsers(users) {
  return writeJsonFile(usersFilePath, Array.isArray(users) ? users : []);
}

async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const users = await getAllUsers();

  return users.find(function (user) {
    return normalizeEmail(user.email) === normalizedEmail;
  }) || null;
}

async function findUserById(id) {
  const users = await getAllUsers();

  return users.find(function (user) {
    return user.id === id;
  }) || null;
}

async function createUser(userInput) {
  const users = await getAllUsers();
  const user = {
    id: userInput.id,
    email: normalizeEmail(userInput.email),
    passwordHash: userInput.passwordHash,
    role: userInput.role,
    createdAt: userInput.createdAt
  };

  users.push(user);
  await saveAllUsers(users);
  return user;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers
};
