const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const Soundcloud = require('soundcloud.ts').default;
const { t } = require('i18next');
const urlRegex = require('url-regex-safe'); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Search for a song on SoundCloud and add it to the queue')
    .setDescriptionLocalizations({
      "en-US": 'Search for a song on SoundCloud and add it to the queue',
      "zh-TW": '在 SoundCloud 上搜索歌曲並將其添加到隊列中'
    })
    .addStringOption(option =>
      option.setName('query')
        .setNameLocalizations({
          "en-US": 'query',
          "zh-TW": '搜索'
        })
        .setDescription('Search query for tracks')
        .setDescriptionLocalizations({
          "en-US": 'Search query for tracks',
          "zh-TW": '歌曲名字/關鍵字'
        })
        .setRequired(true)),

  async execute(interaction, lng) {
    await interaction.deferReply();

    const query = interaction.options.getString('query');
    const soundcloud = new Soundcloud(process.env.CLIENT_ID, process.env.OAUTH_TOKEN);

    try {
      if (urlRegex({ exact: true, strict: false }).test(query)) {
        // If query is a URL, handle it as a track or playlist URL
        const track = await this.handleUrl(query, soundcloud, interaction, lng);
        if (track) {
          await interaction.followUp(`Playing: ${track.title}`);
          return;
        }
      }

      // Fallback to search if not a URL
      const searchResults = await soundcloud.tracks.search({ q: query });

      if (searchResults.collection.length === 0) {
        return interaction.editReply(t('noTracksFound', { lng }));
      }

      const options = searchResults.collection.slice(0, 10).map((track) => {
        const label = track.title.length > 100 ? track.title.slice(0, 97) + '...' : track.title;
        return {
          label,
          description: `By ${track.user.username}`,
          value: track.permalink_url.slice(0, 100),
        };
      });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select-track')
        .setPlaceholder(t('selectTrack', { lng }))
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setTitle('Select a Track')
        .setDescription(t('selectTrackDesc', { lng }))
        .setColor(0x0099FF);

      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error(error);
      await interaction.editReply(t('playErr', { lng }));
    }
  },

  async handleUrl(url, soundcloud, interaction, lng) {
    try {
      if (url.includes('/sets/')) {
        // Handle playlist
        const playlist = await soundcloud.playlists.getAlt(url);
        for (const track of playlist.tracks) {
          await interaction.client.musicManager.playSongFromStream(interaction, track, await soundcloud.util.streamTrack(track.permalink_url));
          interaction.followUp(`${track.title} has been added to the queue.`);
        }
        return playlist.tracks[0];
      } else {
        const track = await soundcloud.tracks.getAlt(url);
        await interaction.client.musicManager.playSongFromStream(interaction, track, await soundcloud.util.streamTrack(track.permalink_url));
        return track;
      }
    } catch (error) {
      console.error(error);
      interaction.followUp(t('playErr', { lng }));
    }
    return null;
  }
};