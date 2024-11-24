const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current track'),
  async execute(interaction) {
    interaction.client.musicManager.pause(interaction);
    interaction.reply('Paused the current track!');
  }
};