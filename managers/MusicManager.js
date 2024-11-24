const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus 
} = require('@discordjs/voice');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class MusicManager {
  constructor() {
    this.queues = new Map();
  }

  async playSongFromStream(interaction, track, trackStream) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.followUp('You need to be in a voice channel to play music!');
    }

    const song = {
      title: track.title,
      url: track.permalink_url,
      stream: trackStream,
      duration: track.duration,
      artist: track.user.username,
      artwork: track.artwork_url,
      progress: 0,
      loop: false,
    };

    let serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue) {
      const queueConstruct = {
        textChannel: interaction.channel,
        voiceChannel,
        connection: null,
        songs: [],
        player: createAudioPlayer(),
        playing: false,
        loop: false,
        progressInterval: null,
      };

      this.queues.set(interaction.guild.id, queueConstruct);
      queueConstruct.songs.push(song);

      try {
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });

        queueConstruct.connection = connection;
        this.playSong(interaction.guild.id);
      } catch (err) {
        console.error(err);
        this.queues.delete(interaction.guild.id);
        return interaction.followUp('There was an error connecting to the voice channel!');
      }
    } else {
      serverQueue.songs.push(song);
      if (!serverQueue.playing) {
        this.playSong(interaction.guild.id);
      } else {
        interaction.followUp(`${song.title} has been added to the queue.`);
      }
    }
  }

  async playSong(guildId) {
    const serverQueue = this.queues.get(guildId);
    if (!serverQueue || !serverQueue.songs.length) return;

    serverQueue.playing = true;
    const song = serverQueue.songs[0];
    const resource = createAudioResource(song.stream);

    serverQueue.player.play(resource);
    serverQueue.connection.subscribe(serverQueue.player);

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`Now Playing: ${song.title}`)
      .setURL(song.url)
      .setThumbnail(song.artwork)
      .addFields(
        { name: 'Artist', value: song.artist, inline: true },
        { name: 'Duration', value: this.formatDuration(song.duration), inline: true }
      );

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('pause')
          .setLabel('Pause')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⏸️'),
        new ButtonBuilder()
          .setCustomId('resume')
          .setLabel('Resume')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('▶️'),
        new ButtonBuilder()
          .setCustomId('skip')
          .setLabel('Skip')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⏭️'),
        new ButtonBuilder()
          .setCustomId('loop')
          .setLabel('Loop')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🔁'),
        new ButtonBuilder()
          .setCustomId('stop')
          .setLabel('Stop')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🛑')
      );

    serverQueue.textChannel.send({ embeds: [embed], components: [row] });

    if (serverQueue.progressInterval) clearInterval(serverQueue.progressInterval);
    serverQueue.progressInterval = setInterval(() => {
      song.progress += 1000;
    }, 1000);

    serverQueue.player.once(AudioPlayerStatus.Idle, () => {
      clearInterval(serverQueue.progressInterval);
      if (serverQueue.loop) {
        song.progress = 0;
        this.playSong(guildId);
      } else {
        this.nextSong(guildId);
      }
    });
  }

  async nextSong(guildId) {
    const serverQueue = this.queues.get(guildId);
    if (!serverQueue) return;

    serverQueue.songs.shift();
    if (serverQueue.songs.length > 0) {
      this.playSong(guildId);
    } else {
      serverQueue.connection.destroy();
      this.queues.delete(guildId);
      serverQueue.textChannel.send('Queue has ended. Leaving the voice channel.');
      serverQueue.playing = false;
    }
  }

  async stop(interaction) {
    await interaction.deferReply();
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue) return interaction.reply('There is no song to stop!');

    clearInterval(serverQueue.progressInterval);
    serverQueue.songs = [];
    serverQueue.player.stop();
    serverQueue.connection.destroy();
    this.queues.delete(interaction.guild.id);

    interaction.reply('Stopped playing and left the voice channel.');
  }

  async pause(interaction) {
    await interaction.deferReply();
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue) return interaction.reply('There is no song playing to pause!');

    if (serverQueue.player.state.status === AudioPlayerStatus.Playing) {
      serverQueue.player.pause();
      clearInterval(serverQueue.progressInterval);
      interaction.followUp('Paused the current track!');
    }
  }

  async resume(interaction) {
    await interaction.deferReply();
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue) return interaction.reply('There is no song to resume!');

    if (serverQueue.player.state.status === AudioPlayerStatus.Paused) {
      serverQueue.player.unpause();
      serverQueue.progressInterval = setInterval(() => {
        const song = serverQueue.songs[0];
        song.progress += 1000;
      }, 1000);
      interaction.followUp('Resumed the track!');
    }
  }

  async skip(interaction) {
    await interaction.deferReply();
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue) return interaction.reply('There is no song that I could skip!');

    clearInterval(serverQueue.progressInterval);
    serverQueue.player.stop();

    interaction.followUp('Skipped the current track!');
  }

  async loop(interaction) {
    await interaction.deferReply();
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue) return interaction.reply('There is no song playing to loop!');

    serverQueue.loop = !serverQueue.loop;
    interaction.followUp(`Looping is now **${serverQueue.loop ? 'enabled' : 'disabled'}**!`);
  }

  async shuffle(interaction) {
    await interaction.deferReply();
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue) return interaction.reply('There is no queue to shuffle!');

    for (let i = serverQueue.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [serverQueue.songs[i], serverQueue.songs[j]] = [serverQueue.songs[j], serverQueue.songs[i]];
    }
    interaction.reply('Queue shuffled!');
  }

  async list(interaction) {
    await interaction.deferReply();
    const serverQueue = this.getQueue(interaction.guild.id);
    if (!serverQueue || !serverQueue.songs.length) {
      return interaction.reply('There are no songs in the queue!');
    }

    const songList = serverQueue.songs.map((song, index) => `${index + 1}. ${song.title}`).join('\n');
    interaction.reply(`Current queue:\n${songList}`);
  }

  async getQueue(guildId) {
    return this.queues.get(guildId);
  }

  async formatDuration(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  async createProgressBar(progress, total) {
    const length = 20;
    const position = Math.round((progress / total) * length);
    let bar = '▰'.repeat(position) + '▱'.repeat(length - position);
    return `${bar} ${this.formatDuration(progress)} / ${this.formatDuration(total)}`;
  }
}

module.exports = MusicManager;