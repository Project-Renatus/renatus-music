const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track')
    .setDescriptionLocalizations({
      "en-US": 'Skip the current track',
      "zh-TW": '跳過當前歌曲'
    }), 
  async execute(interaction) {
    interaction.client.musicManager.skip(interaction);
  }
};