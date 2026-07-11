const express = require('express');
const dockerService = require('../services/dockerService');

const router = express.Router();

router.get('/containers', async (req, res) => {
  try {
    const containers = await dockerService.getContainers();
    res.json(containers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/containers/:id/stats', async (req, res) => {
  try {
    const stats = await dockerService.getContainerStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/containers/:id/logs', async (req, res) => {
  try {
    const logs = await dockerService.getContainerLogs(req.params.id);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/containers/:id/kill', async (req, res) => {
  try {
    const result = await dockerService.killContainer(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/images', async (req, res) => {
  try {
    const images = await dockerService.getImages();
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/volumes', async (req, res) => {
  try {
    const volumes = await dockerService.getVolumes();
    res.json(volumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/networks', async (req, res) => {
  try {
    const networks = await dockerService.getNetworks();
    res.json(networks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/health', async (req, res) => {
  try {
    await dockerService.getContainers();
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

module.exports = router;