const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),
  async execute(interaction) {
    interaction.client.musicManager.stop(interaction);
  }
};