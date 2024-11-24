require('dotenv').config();
const { ClusterManager } = require('discord-hybrid-sharding');

const manager = new ClusterManager('./bot.js', { 
  totalShards: 'auto',
  shardsPerCluster: 2,
  mode: 'process',
  token: process.env.DISCORD_TOKEN
});

manager.on('clusterCreate', cluster => {
  console.log(`Launched cluster ${cluster.id}`);
});

manager.spawn();