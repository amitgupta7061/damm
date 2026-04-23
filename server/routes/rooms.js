const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const User = require('../models/User');

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized. Missing token." });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized. Invalid token." });
    }
};

// @route POST /api/rooms/save
// @desc Saves or updates the current canvas elements to MongoDB
router.post('/save', authMiddleware, async (req, res) => {
    try {
        const { roomId, elements, name } = req.body;
        
        if (!roomId) return res.status(400).json({ error: "roomId is required" });

        // Update if exists, or create new
        let room = await Room.findOne({ roomId });

        if (room) {
            // Ensure the person saving it is the owner
            if (room.owner.toString() !== req.user.userId) {
                // If they aren't the owner, maybe we fork it? 
                // For MVP, we simply reject or allow overwrite. Let's reject non-owners.
                return res.status(403).json({ error: "Only the room owner can permanently save it." });
            }
            room.elements = elements || room.elements;
            if (name) room.name = name;
            room.lastSaved = Date.now();
            await room.save();
        } else {
            // Create brand new saved room
            room = new Room({
                roomId,
                owner: req.user.userId,
                name: name || `Board ${roomId}`,
                elements: elements || []
            });
            await room.save();
            
            // Add reference to User's savedRooms
            await User.findByIdAndUpdate(req.user.userId, {
                $push: { savedRooms: room._id }
            });
        }

        res.status(200).json({ message: "Room saved successfully", room });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error saving room" });
    }
});

// @route GET /api/rooms/me
// @desc Get all rooms owned by the logged-in user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        // Fetch rooms owned by user, sorted by newest
        const rooms = await Room.find({ owner: req.user.userId })
                                .sort({ lastSaved: -1 })
                                .select('-elements'); // Exclude the heavy JSON payload for the list view

        res.status(200).json({ rooms });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error fetching rooms" });
    }
});

// @route GET /api/rooms/:id
// @desc Fetch a specific room's elements strictly from DB
router.get('/:id', async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.id });
        if (!room) return res.status(404).json({ error: "Room not found in DB" });
        res.status(200).json({ room });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error fetching room" });
    }
});

module.exports = router;
