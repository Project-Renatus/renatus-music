const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused track'),
  async execute(interaction) {
    interaction.client.musicManager.resume(interaction);
    interaction.reply('Resumed the track!');
  }
};