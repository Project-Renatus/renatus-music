require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { getInfo } = require('discord-hybrid-sharding');
const MusicManager = require('./managers/MusicManager');
const express = require('express');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
  shards: getInfo().SHARD_LIST,
  shardCount: getInfo().TOTAL_SHARDS,
});

client.commands = new Collection();
client.musicManager = new MusicManager();

// Load commands
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Load events
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Start the Express server
function startServer(musicManager) {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get('/api/:guildID', (req, res) => {
    const guildId = req.params.guildID;
    const serverQueue = musicManager.getQueue(guildId);

    if (!serverQueue) {
      return res.status(404).json({ error: 'No active music session for this guild.' });
    }

    const currentSong = serverQueue.songs[0];
    const queue = serverQueue.songs.map((song, index) => ({
      title: song.title,
      url: song.url,
      position: index + 1,
    }));

    const response = {
      currentSong: {
        title: currentSong.title,
        url: currentSong.url,
        artist: currentSong.artist,
        duration: musicManager.formatDuration(currentSong.duration),
        artwork: currentSong.artwork,
        playTime: musicManager.formatDuration(currentSong.progress),
      },
      queue: queue.slice(1), // Exclude the currently playing song
    };

    res.json(response);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Initialize both the bot and server
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  startServer(client.musicManager); // Share the instance with the server
});

client.login(process.env.DISCORD_TOKEN);