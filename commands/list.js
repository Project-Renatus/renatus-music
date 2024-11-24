const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('List the current songs in queue'),
  async execute(interaction) {
    interaction.client.musicManager.list(interaction);
  }
};