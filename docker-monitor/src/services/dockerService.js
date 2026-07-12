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
  
  let cpuPercent = 0;
  let memoryMB = 0;
  let memoryLimitMB = 512;
  let networkRx = 0;
  let networkTx = 0;
  
  try {
    // CPU calculation
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
    const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
    const cpuCount = stats.cpu_stats.online_cpus || 1;
    
    if (systemDelta > 0 && cpuDelta > 0) {
      cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100;
    }
    
    // Memory
    memoryMB = (stats.memory_stats.usage || 0) / 1024 / 1024;
    memoryLimitMB = (stats.memory_stats.limit || 536870912) / 1024 / 1024;
    
    // Network
    if (stats.networks) {
      const network = Object.values(stats.networks)[0];
      networkRx = network?.rx_bytes || 0;
      networkTx = network?.tx_bytes || 0;
    }
  } catch (err) {
    console.error('Stats calculation error:', err.message);
  }
  
  return {
    cpuPercent: parseFloat(Math.min(cpuPercent, 100).toFixed(2)),
    memoryMB: parseFloat(memoryMB.toFixed(2)),
    memoryLimitMB: parseFloat(memoryLimitMB.toFixed(2)),
    networkRx,
    networkTx
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
  const containers = await docker.listContainers();
  
  return networks
    .filter(n => n.Name.includes('glideit'))
    .map(n => {
      const connectedContainers = containers
        .filter(c => c.NetworkSettings?.Networks?.[n.Name])
        .map(c => c.Names[0].replace('/', ''));
      
      return {
        name: n.Name,
        id: n.Id,
        driver: n.Driver,
        containers: connectedContainers
      };
    });
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