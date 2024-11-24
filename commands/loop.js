const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle loop for the current track'),
  async execute(interaction) {
    interaction.client.musicManager.loop(interaction);
  }
};