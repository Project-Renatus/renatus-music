const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playing')
    .setDescription('Shows the current playing song information')
    .setDescriptionLocalizations({
      "en-US": 'Shows the current playing song information',
      "zh-TW": '顯示當前播放歌曲的信息'
    }),
  async execute(interaction) {
    interaction.client.musicManager.getCurrentSongInfo(interaction);
  }
};