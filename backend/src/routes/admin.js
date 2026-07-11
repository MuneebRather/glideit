const express = require('express');
const adminOnly = require('../middleware/admin');
const User = require('../models/User');
const File = require('../models/File');
const AuditLog = require('../models/AuditLog');
const dockerMonitor = require('../utils/dockerMonitor');

const router = express.Router();

router.get('/users', adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const fileCount = await File.countDocuments({ owner: user._id });
      const totalSize = await File.aggregate([
        { $match: { owner: user._id } },
        { $group: { _id: null, total: { $sum: '$size' } } }
      ]);
      return {
        ...user.toObject(),
        fileCount,
        totalStorage: totalSize[0]?.total || 0
      };
    }));

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/users/:id/disable', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'enabled' : 'disabled'}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/activity', adminOnly, async (req, res) => {
  try {
    const { action, userId, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.user = userId;

    const logs = await AuditLog.find(filter)
      .populate('user', 'email')
      .populate('file', 'originalName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/containers', adminOnly, async (req, res) => {
  try {
    const containers = await dockerMonitor.getContainers();
    res.json(containers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/containers/:id/stats', adminOnly, async (req, res) => {
  try {
    const stats = await dockerMonitor.getContainerStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/containers/:id/kill', adminOnly, async (req, res) => {
  try {
    const result = await dockerMonitor.killContainer(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/images', adminOnly, async (req, res) => {
  try {
    const images = await dockerMonitor.getImages();
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/volumes', adminOnly, async (req, res) => {
  try {
    const volumes = await dockerMonitor.getVolumes();
    res.json(volumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/networks', adminOnly, async (req, res) => {
  try {
    const networks = await dockerMonitor.getNetworks();
    res.json(networks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;