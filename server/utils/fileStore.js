const fs = require("fs").promises;
const path = require("path");

async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    if (!content.trim()) {
      return null;
    }
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      const notFoundError = new Error("JSON file was not found: " + filePath);
      notFoundError.statusCode = 500;
      throw notFoundError;
    }

    const readError = new Error("Unable to read JSON file: " + filePath);
    readError.statusCode = 500;
    readError.cause = error;
    throw readError;
  }
}

async function writeJsonFile(filePath, data) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    return data;
  } catch (error) {
    const writeError = new Error("Unable to write JSON file: " + filePath);
    writeError.statusCode = 500;
    writeError.cause = error;
    throw writeError;
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile
};
