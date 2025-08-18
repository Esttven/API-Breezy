import express from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { generateToken, hashPassword, comparePassword } from '../utils/jwtHelper.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Register new user
router.post('/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Basic validations
        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required',
                code: 'missing_credentials'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long',
                code: 'weak_password'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                error: 'Username must be at least 3 characters long',
                code: 'username_too_short'
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'Username already exists',
                code: 'user_exists'
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword
            },
            select: {
                id: true,
                username: true,
                score: true,
                dailyStreak: true,
                createdAt: true
            }
        });

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            message: 'User registered successfully',
            user,
            token
        });
    } catch (error) {
        throw error;
    }
});

// Login
router.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Basic validations
        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required',
                code: 'missing_credentials'
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                code: 'invalid_credentials'
            });
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials',
                code: 'invalid_credentials'
            });
        }

        // Generate token
        const token = generateToken(user);

        // Response without password
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        throw error;
    }
});

// Get current user profile (requires authentication)
router.get('/auth/profile', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                score: true,
                dailyStreak: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json(user);
    } catch (error) {
        throw error;
    }
});

// Change password
router.put('/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Current password and new password are required',
                code: 'missing_passwords'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'New password must be at least 6 characters long',
                code: 'weak_password'
            });
        }

        // Get current user with password
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Verify current password
        const isValidPassword = await comparePassword(currentPassword, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Incorrect current password',
                code: 'incorrect_password'
            });
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);

        // Update password
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedNewPassword }
        });

        res.json({
            message: 'Password changed successfully'
        });
    } catch (error) {
        throw error;
    }
});

// Verify token (useful endpoint for frontend token validation)
router.get('/auth/verify', authenticateToken, async (req, res) => {
    try {
        res.json({
            valid: true,
            user: req.user
        });
    } catch (error) {
        throw error;
    }
});

// Refresh token endpoint
router.post('/auth/refresh', authenticateToken, async (req, res) => {
    try {
        // Generate new token with fresh expiration
        const newToken = generateToken(req.user);
        
        res.json({
            message: 'Token refreshed successfully',
            token: newToken
        });
    } catch (error) {
        throw error;
    }
});

export default router;
