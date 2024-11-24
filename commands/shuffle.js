const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the current queue'),
  async execute(interaction) {
    interaction.client.musicManager.shuffle(interaction);
  }
};