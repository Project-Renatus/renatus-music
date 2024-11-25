const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue')
    .setDescriptionLocalizations({
      "en-US": 'Stop the music and clear the queue',
      "zh-TW": '停止播放音樂並清空隊列'
    }),
  async execute(interaction) {
    interaction.client.musicManager.stop(interaction);
  }
};