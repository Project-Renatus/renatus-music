const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused track')
    .setDescriptionLocalizations({
      "en-US": 'Resume the paused track',
      "zh-TW": '繼續播放歌曲'
    }),
  async execute(interaction) {
    interaction.client.musicManager.resume(interaction);
  }
};