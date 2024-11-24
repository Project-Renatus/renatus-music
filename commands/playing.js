const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playing')
    .setDescription('Shows the current playing song information'),
  async execute(interaction) {
    interaction.client.musicManager.getCurrentSongInfo(interaction);
  }
};