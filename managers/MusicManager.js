const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { t } = require("i18next");
const getLang = require("../lib/getLang.js");

class MusicManager {
  constructor() {
    this.queues = new Map();
  }

  async playSongFromStream(interaction, track, trackStream) {
    const lng = await getLang(interaction.member.guildId)
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.followUp(
        t('notInVC', { lng })
      );
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
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        queueConstruct.connection = connection;
        this.playSong(interaction.guild.id);
      } catch (err) {
        console.error(err);
        this.queues.delete(interaction.guild.id);
        return interaction.followUp(
          t('vcErr', { lng })
        );
      }
    } else {
      serverQueue.songs.push(song);
      if (!serverQueue.playing) {
        this.playSong(interaction.guild.id);
      } else {
        interaction.followUp(song.title + ' ' + t('addedToQueue', { lng }));
      }
    }
  }

  async playSong(guildId) {
    const lng = await getLang(guildId)

    const serverQueue = this.queues.get(guildId);
    if (!serverQueue || !serverQueue.songs.length) return;

    serverQueue.playing = true;
    const song = serverQueue.songs[0];
    const resource = createAudioResource(song.stream);

    serverQueue.player.play(resource);
    serverQueue.connection.subscribe(serverQueue.player);

    const artist = t('artist', { lng });
    const duration = t('duration', { lng });

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`Now Playing: ${song.title}`)
      .setURL(song.url)
      .setThumbnail(song.artwork)
      .addFields(
        { name: artist, value: song.artist, inline: true },
        {
          name: duration,
          value: String(this.formatDuration(song.duration)),
          inline: true,
        }
      );
    
    const resume = t('resume', { lng });
    const pause = t('pause', { lng });
    const skip = t('skip', { lng });
    const loop = t('loop', { lng });
    const stop = t('stop', { lng });
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pause")
        .setLabel(pause)
        .setStyle(ButtonStyle.Primary)
        .setEmoji("⏸️"),
      new ButtonBuilder()
        .setCustomId("resume")
        .setLabel(resume)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("▶️"),
      new ButtonBuilder()
        .setCustomId("skip")
        .setLabel(skip)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏭️"),
      new ButtonBuilder()
        .setCustomId("loop")
        .setLabel(loop)
        .setStyle(ButtonStyle.Success)
        .setEmoji("🔁"),
      new ButtonBuilder()
        .setCustomId("stop")
        .setLabel(stop)
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🛑")
    );

    serverQueue.textChannel.send({ embeds: [embed], components: [row] });

    if (serverQueue.progressInterval)
      clearInterval(serverQueue.progressInterval);
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
    const lng = await getLang(guildId)
    const serverQueue = this.queues.get(guildId);
    if (!serverQueue) return;

    serverQueue.songs.shift();
    if (serverQueue.songs.length > 0) {
      this.playSong(guildId);
    } else {
      serverQueue.connection.destroy();
      this.queues.delete(guildId);
      serverQueue.textChannel.send(
        t('queueEmpty', { lng })
      );
      serverQueue.playing = false;
    }
  }

  async stop(interaction) {
    const lng = await getLang(interaction.guildId)
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue) return interaction.reply(t('noSongPlaying', { lng }));

    clearInterval(serverQueue.progressInterval);
    serverQueue.songs = [];
    serverQueue.player.stop();
    serverQueue.connection.destroy();
    this.queues.delete(interaction.guild.id);

    interaction.followUp(t('stopped', { lng }));
  }

  async pause(interaction) {
    const lng = await getLang(interaction.guildId)
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue)
      return interaction.reply(t('noSongPlaying', { lng }));

    if (serverQueue.player.state.status === AudioPlayerStatus.Playing) {
      serverQueue.player.pause();
      clearInterval(serverQueue.progressInterval);
      interaction.followUp(t('paused', { lng }));
    }
  }

  async resume(interaction) {
    const lng = await getLang(interaction.guildId)
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue) return interaction.reply(t('noSongPlaying', { lng }));

    if (serverQueue.player.state.status === AudioPlayerStatus.Paused) {
      serverQueue.player.unpause();
      serverQueue.progressInterval = setInterval(() => {
        const song = serverQueue.songs[0];
        song.progress += 1000;
      }, 1000);
      interaction.followUp(t('resumed', { lng }));
    }
  }

  async skip(interaction) {
    const lng = await getLang(interaction.guildId)
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue)
      return interaction.reply(t('noSongPlaying', { lng }));

    clearInterval(serverQueue.progressInterval);
    serverQueue.player.stop();

    interaction.followUp(t('skipped', { lng }));
  }

  async loop(interaction) {
    const lng = await getLang(interaction.guildId)
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue)
      return interaction.reply("There is no queue to loop!");

    serverQueue.loop = !serverQueue.loop;
    interaction.followUp(
      `${t('loopStat', { lng })} **${
        serverQueue.loop ? t('enabled', { lng }) : t('disabled', { lng })
      }**!`
    );
  }

  async shuffle(interaction) {
    const lng = await getLang(interaction.guildId)
    await interaction.deferReply();
    const serverQueue = this.queues.get(interaction.guild.id);
    if (!serverQueue) return interaction.reply(t('noSongPlaying', { lng }));

    for (let i = serverQueue.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [serverQueue.songs[i], serverQueue.songs[j]] = [
        serverQueue.songs[j],
        serverQueue.songs[i],
      ];
    }
    interaction.reply(t('shuffled', { lng }));
  }

  async list(interaction) {
    const lng = await getLang(interaction.guildId)
    await interaction.deferReply();
    const serverQueue = this.getQueue(interaction.guild.id);
    if (!serverQueue || !serverQueue.songs.length) {
      return interaction.reply(t('queueEmpty', { lng }));
    }

    const songList = serverQueue.songs
      .map((song, index) => `${index + 1}. ${song.title}`)
      .join("\n");
    interaction.reply(t('currentQueue, {lng}') + "\n"+songList);
  }

  getQueue(guildId) {
    return this.queues.get(guildId);
  }

  formatDuration(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  createProgressBar(progress, total) {
    const length = 20;
    const position = Math.round((progress / total) * length);
    let bar = "▰".repeat(position) + "▱".repeat(length - position);
    return `${bar} ${this.formatDuration(progress)} / ${this.formatDuration(
      total
    )}`;
  }
}

module.exports = MusicManager;
