const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const File = require('../models/File');
const AuditLog = require('../models/AuditLog');
const { uploadToS3, getPresignedUrl, deleteFromS3 } = require('../utils/s3');
const { getContainerStats } = require('../utils/dockerMonitor');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const getBackendContainerSnapshot = async () => {
  try {
    const containers = await require('../utils/dockerMonitor').getContainers();
    const backend = containers.find(c => c.name.includes('backend'));
    if (!backend) return null;
    
    const stats = await getContainerStats(backend.id);
    return {
      containerId: backend.id,
      containerName: backend.name,
      cpuPercent: stats.cpuPercent,
      memoryMB: stats.memoryMB,
      memoryLimitMB: stats.memoryLimitMB,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Snapshot error:', error.message);
    return null;
  }
};

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const key = `${req.user.id}/${Date.now()}-${req.file.originalname}`;
    const s3Url = await uploadToS3(req.file.buffer, key, req.file.mimetype);

    const snapshot = await getBackendContainerSnapshot();

    const file = new File({
      filename: key,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      s3Key: key,
      s3Url,
      owner: req.user.id,
      containerSnapshot: snapshot
    });
    await file.save();

    await AuditLog.create({
      action: 'upload',
      user: req.user.id,
      userEmail: req.user.email,
      file: file._id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      containerSnapshot: snapshot
    });

    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const files = await File.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/download/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const url = await getPresignedUrl(file.s3Key);

    await AuditLog.create({
      action: 'download',
      user: req.user.id,
      userEmail: req.user.email,
      file: file._id,
      fileName: file.originalName,
      fileSize: file.size
    });

    file.downloadCount += 1;
    await file.save();

    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    await deleteFromS3(file.s3Key);
    await File.deleteOne({ _id: file._id });

    await AuditLog.create({
      action: 'delete',
      user: req.user.id,
      userEmail: req.user.email,
      fileName: file.originalName,
      fileSize: file.size
    });

    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/rename', auth, async (req, res) => {
  try {
    const { newName } = req.body;
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const oldName = file.originalName;
    file.originalName = newName;
    await file.save();

    await AuditLog.create({
      action: 'rename',
      user: req.user.id,
      userEmail: req.user.email,
      file: file._id,
      fileName: newName,
      details: `Renamed from "${oldName}"`
    });

    res.json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/share', auth, async (req, res) => {
  try {
    const { expiresInHours = 24 } = req.body;
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const token = require('crypto').randomBytes(32).toString('hex');
    file.shareToken = token;
    file.shareExpiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    await file.save();

    await AuditLog.create({
      action: 'share',
      user: req.user.id,
      userEmail: req.user.email,
      file: file._id,
      fileName: file.originalName,
      details: `Share link expires in ${expiresInHours} hours`
    });

    res.json({ shareUrl: `/api/files/share/${token}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/share/:token', async (req, res) => {
  try {
    const file = await File.findOne({ 
      shareToken: req.params.token,
      shareExpiresAt: { $gt: new Date() }
    });
    
    if (!file) {
      return res.status(404).json({ message: 'Link expired or invalid' });
    }

    const url = await getPresignedUrl(file.s3Key, 300);
    res.json({ url, fileName: file.originalName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;