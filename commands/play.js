const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const Soundcloud = require('soundcloud.ts').default;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Search for a song on SoundCloud and add it to the queue')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Search query for tracks')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString('query');
    const soundcloud = new Soundcloud(process.env.CLIENT_ID, process.env.OAUTH_TOKEN);

    try {
      const searchResults = await soundcloud.tracks.search({ q: query });

      if (searchResults.collection.length === 0) {
        return interaction.editReply('No tracks found.');
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
        .setPlaceholder('Choose a track to play')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setTitle('Select a Track')
        .setDescription('Choose a track from the dropdown menu below.')
        .setColor(0x0099FF);

      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error(error);
      await interaction.editReply('There was an error fetching tracks from SoundCloud.');
    }
  }
};