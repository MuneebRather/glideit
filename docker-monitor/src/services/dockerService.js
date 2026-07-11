const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const getContainers = async () => {
  const containers = await docker.listContainers({ all: false });
  return containers.map(c => ({
    id: c.Id,
    name: c.Names[0].replace('/', ''),
    image: c.Image,
    status: c.Status,
    state: c.State,
    uptime: c.Status,
    restartCount: c.RestartCount || 0,
    health: c.Status.includes('healthy') ? 'healthy' : 
            c.Status.includes('unhealthy') ? 'unhealthy' : 'unknown'
  }));
};

const getContainerStats = async (id) => {
  const container = docker.getContainer(id);
  const stats = await container.stats({ stream: false });
  
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0;
  
  const memoryUsage = stats.memory_stats.usage || 0;
  const memoryLimit = stats.memory_stats.limit || 1;
  
  return {
    cpuPercent: parseFloat(cpuPercent.toFixed(2)),
    memoryMB: parseFloat((memoryUsage / 1024 / 1024).toFixed(2)),
    memoryLimitMB: parseFloat((memoryLimit / 1024 / 1024).toFixed(2)),
    networkRx: stats.networks ? Object.values(stats.networks)[0].rx_bytes : 0,
    networkTx: stats.networks ? Object.values(stats.networks)[0].tx_bytes : 0
  };
};

const getContainerLogs = async (id) => {
  const container = docker.getContainer(id);
  const logs = await container.logs({ tail: 50, stdout: true, stderr: true });
  return logs.toString('utf8').split('\n').filter(line => line.trim());
};

const killContainer = async (id) => {
  const container = docker.getContainer(id);
  await container.kill();
  return { message: 'Container killed', id };
};

const getImages = async () => {
  const images = await docker.listImages();
  return images.map(img => ({
    id: img.Id,
    repoTags: img.RepoTags || ['<none>'],
    size: parseFloat((img.Size / 1024 / 1024).toFixed(2)),
    layers: img.Layers ? img.Layers.length : 0,
    created: new Date(img.Created * 1000).toISOString()
  }));
};

const getVolumes = async () => {
  const volumes = await docker.listVolumes();
  return volumes.Volumes.map(v => ({
    name: v.Name,
    driver: v.Driver,
    mountpoint: v.Mountpoint,
    size: null
  }));
};

const getNetworks = async () => {
  const networks = await docker.listNetworks();
  return networks
    .filter(n => n.Name.includes('glideit'))
    .map(n => ({
      name: n.Name,
      id: n.Id,
      driver: n.Driver,
      containers: Object.keys(n.Containers || {})
    }));
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