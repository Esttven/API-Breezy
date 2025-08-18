import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generates a JWT token for a user
 * @param {Object} user - User for which to generate the token
 * @returns {string} JWT token
 */
export function generateToken(user) {
    const payload = {
        id: user.id,
        username: user.username
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica un token JWT
 * @param {string} token - Token a verificar
 * @returns {Object} Payload del token decodificado
 */
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

/**
 * Encripta una contraseña
 * @param {string} password - Contraseña a encriptar
 * @returns {Promise<string>} Contraseña encriptada
 */
export async function hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Compares a password with its hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if they match
 */
export async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}
