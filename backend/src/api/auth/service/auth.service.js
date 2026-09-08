import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { safeExecute } from "../../../../db/config.js";
import {
  BadRequestError,
  UnauthenticatedError,
} from "../../../utils/errors/index.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const normalizeEmail = (email) => email.trim().toLowerCase();

/**
 * Checks if a user exists by email.
 *
 * @param {string} email - The email to check.
 * @returns {Promise<boolean>} True if the user exists, false otherwise.
 */
export const checkUserExists = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const sql = "SELECT user_id FROM users WHERE email = ? LIMIT 1";
  const rows = await safeExecute(sql, [normalizedEmail]);
  return rows.length > 0; //if user exists row.length willbe > 0 and checkUserExists returns true
};

/**
 * Registers a new user in the database.
 *
 * @param {Object} userData - The user data.
 * @param {string} userData.firstName - The first name.
 * @param {string} userData.lastName - The last name.
 * @param {string} userData.email - The email address.
 * @param {string} userData.password - The plain text password.
 * @returns {Promise<Object>} The created user object (without password).
 */
export const registerService = async ({
  firstName,
  lastName,
  email,
  password,
}) => {
  // Call normalizeEmail to trim whitespace and convert the email to lowercase
  // so that email comparisons are consistent
  const normalizedEmail = normalizeEmail(email);

  // Check if a user already exists with this email to prevent duplicate accounts.
  // This provides an application-level check before attempting the database insert.
  const userExists = await checkUserExists(normalizedEmail);
  // if the user already exists, it throws an error, and the registration won't continue
  if (userExists) {
    throw new BadRequestError("User already exists with this email.");
  }

  // Generate a new random salt for this password.
  // The salt is different each time bcrypt.genSalt() is called.
  const salt = await bcrypt.genSalt(10);

  // Hash the user's password using the generated salt.
  // The original password is never stored directly in the database.
  const hashedPassword = await bcrypt.hash(password, salt);

  //  insert the new user's data into the database
  const sql =
    "INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)";

  let result;

  try {
    // Execute the INSERT query with the user's data
    result = await safeExecute(sql, [
      firstName,
      lastName,
      normalizedEmail,
      hashedPassword,
    ]);
  } catch (error) {
    // If the database detects a duplicate email, return error
    // This protects against duplicates even if two requests pass the checkUserExists() check at the same time
    //ER_DUP_ENTRY: is mtsql error that tells us we're trying to insert a value that already exists in colunm that is set to be unique
    if (error?.code === "ER_DUP_ENTRY") {
      throw new BadRequestError("User already exists with this email.");
    }

    // Pass any other database error to the error-handling middleware
    throw error;
  }

  // Return the newly created user's information.
  // The password/hash is intentionally not included in the response.
  return {
    id: result.insertId,
    firstName,
    lastName,
    email: normalizedEmail,
  };
};

/**
 * Authenticates a user and generates a JWT token.
 *
 * @param {Object} credentials - The login credentials.
 * @param {string} credentials.email - The user's email.
 * @param {string} credentials.password - The user's plain text password.
 * @returns {Promise<Object>} An object containing the user and token.
 * @throws {UnauthenticatedError} If authentication fails.
 */
export const loginService = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const sql =
    "SELECT user_id, first_name, last_name, email, password_hash FROM users WHERE email = ? LIMIT 1";
  const rows = await safeExecute(sql, [normalizedEmail]); //protecting against SQL injection by using parameterized queries

  if (rows.length === 0) {
    throw new UnauthenticatedError("Invalid email or password");
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new UnauthenticatedError("Invalid email or password"); //we should not specify which one is incorrect for security reasons, so we use a generic message
  }

  const payload = {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    user: {
      id: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    },
    token,
  };
};
