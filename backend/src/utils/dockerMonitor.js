const axios = require('axios');

const MONITOR_URL = 'http://docker-monitor:8080';

const getContainers = async () => {
  const res = await axios.get(`${MONITOR_URL}/api/containers`);
  return res.data;
};

const getContainerStats = async (id) => {
  const res = await axios.get(`${MONITOR_URL}/api/containers/${id}/stats`);
  return res.data;
};

const getContainerLogs = async (id) => {
  const res = await axios.get(`${MONITOR_URL}/api/containers/${id}/logs`);
  return res.data;
};

const killContainer = async (id) => {
  const res = await axios.post(`${MONITOR_URL}/api/containers/${id}/kill`);
  return res.data;
};

const getImages = async () => {
  const res = await axios.get(`${MONITOR_URL}/api/images`);
  return res.data;
};

const getVolumes = async () => {
  const res = await axios.get(`${MONITOR_URL}/api/volumes`);
  return res.data;
};

const getNetworks = async () => {
  const res = await axios.get(`${MONITOR_URL}/api/networks`);
  return res.data;
};

module.exports = {
  getContainers,
  getContainerStats,
  getContainerLogs,
  killContainer,
  getImages,
  getVolumes,
  getNetworks
};