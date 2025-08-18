import { verifyToken } from '../utils/jwtHelper.js';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header
 * @returns {string|null} Extracted token or null
 */
function extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * JWT authentication middleware
 */
export async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = extractToken(authHeader);

        if (!token) {
            return res.status(401).json({
                error: 'Access token required',
                code: 'missing_token'
            });
        }

        // Verify the token
        const decoded = verifyToken(token);
        
        // Optional: Verify that the user still exists in the database
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { 
                id: true, 
                username: true, 
                score: true, 
                dailyStreak: true 
            }
        });

        if (!user) {
            return res.status(401).json({
                error: 'Invalid user',
                code: 'invalid_user'
            });
        }

        // Add user information to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                code: 'invalid_token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Expired token',
                code: 'expired_token'
            });
        }

        return res.status(500).json({
            error: 'Internal server error',
            code: 'internal_error'
        });
    }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = extractToken(authHeader);

        if (token) {
            const decoded = verifyToken(token);
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { 
                    id: true, 
                    username: true, 
                    score: true, 
                    dailyStreak: true 
                }
            });
            
            if (user) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // In optional authentication, we ignore token errors and continue
        next();
    }
}
