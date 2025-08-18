import express from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get scoreboard (top users by score)
router.get('/scoreboard', async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const limitInt = parseInt(limit);
        const pageInt = parseInt(page);
        const skip = (pageInt - 1) * limitInt;

        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                score: true,
                dailyStreak: true
            },
            orderBy: [
                { score: 'desc' },
                { dailyStreak: 'desc' },
                { username: 'asc' }
            ],
            take: limitInt,
            skip: skip
        });

        // Add ranking to each user
        const rankedUsers = users.map((user, index) => ({
            ...user,
            rank: skip + index + 1
        }));

        // Get total count for pagination
        const totalUsers = await prisma.user.count();

        res.json({
            users: rankedUsers,
            pagination: {
                currentPage: pageInt,
                totalPages: Math.ceil(totalUsers / limitInt),
                totalUsers,
                limit: limitInt
            }
        });
    } catch (error) {
        throw error;
    }
});

// Get user's current score and rank
router.get('/scoreboard/my-stats', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                score: true,
                dailyStreak: true
            }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'user_not_found'
            });
        }

        // Calculate user's rank
        const usersWithHigherScore = await prisma.user.count({
            where: {
                OR: [
                    { score: { gt: user.score } },
                    {
                        AND: [
                            { score: user.score },
                            { dailyStreak: { gt: user.dailyStreak } }
                        ]
                    },
                    {
                        AND: [
                            { score: user.score },
                            { dailyStreak: user.dailyStreak },
                            { username: { lt: user.username } }
                        ]
                    }
                ]
            }
        });

        const rank = usersWithHigherScore + 1;

        res.json({
            ...user,
            rank
        });
    } catch (error) {
        throw error;
    }
});

// Update user's score (requires authentication)
router.put('/scoreboard/update-score', authenticateToken, async (req, res) => {
    try {
        const { score } = req.body;

        if (typeof score !== 'number' || score < 0) {
            return res.status(400).json({
                error: 'Score must be a non-negative number',
                code: 'invalid_score'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { score },
            select: {
                id: true,
                username: true,
                score: true,
                dailyStreak: true,
                updatedAt: true
            }
        });

        res.json({
            message: 'Score updated successfully',
            user: updatedUser
        });
    } catch (error) {
        throw error;
    }
});

// Update user's daily streak (requires authentication)
router.put('/scoreboard/update-streak', authenticateToken, async (req, res) => {
    try {
        const { dailyStreak } = req.body;

        if (typeof dailyStreak !== 'number' || dailyStreak < 0) {
            return res.status(400).json({
                error: 'Daily streak must be a non-negative number',
                code: 'invalid_streak'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { dailyStreak },
            select: {
                id: true,
                username: true,
                score: true,
                dailyStreak: true,
                updatedAt: true
            }
        });

        res.json({
            message: 'Daily streak updated successfully',
            user: updatedUser
        });
    } catch (error) {
        throw error;
    }
});

// Update both score and daily streak (requires authentication)
router.put('/scoreboard/update-stats', authenticateToken, async (req, res) => {
    try {
        const { score, dailyStreak } = req.body;

        const updateData = {};

        if (score !== undefined) {
            if (typeof score !== 'number' || score < 0) {
                return res.status(400).json({
                    error: 'Score must be a non-negative number',
                    code: 'invalid_score'
                });
            }
            updateData.score = score;
        }

        if (dailyStreak !== undefined) {
            if (typeof dailyStreak !== 'number' || dailyStreak < 0) {
                return res.status(400).json({
                    error: 'Daily streak must be a non-negative number',
                    code: 'invalid_streak'
                });
            }
            updateData.dailyStreak = dailyStreak;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'At least one field (score or dailyStreak) must be provided',
                code: 'no_update_data'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                username: true,
                score: true,
                dailyStreak: true,
                updatedAt: true
            }
        });

        res.json({
            message: 'User stats updated successfully',
            user: updatedUser
        });
    } catch (error) {
        throw error;
    }
});

// Get user by username (public endpoint for checking if username exists)
router.get('/scoreboard/user/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                score: true,
                dailyStreak: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'user_not_found'
            });
        }

        // Calculate user's rank
        const usersWithHigherScore = await prisma.user.count({
            where: {
                OR: [
                    { score: { gt: user.score } },
                    {
                        AND: [
                            { score: user.score },
                            { dailyStreak: { gt: user.dailyStreak } }
                        ]
                    },
                    {
                        AND: [
                            { score: user.score },
                            { dailyStreak: user.dailyStreak },
                            { username: { lt: user.username } }
                        ]
                    }
                ]
            }
        });

        const rank = usersWithHigherScore + 1;

        res.json({
            ...user,
            rank
        });
    } catch (error) {
        throw error;
    }
});

export default router;
