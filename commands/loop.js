const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle loop for the current track')
    .setDescriptionLocalizations({ 
      "en-US": 'Toggle loop for the current track',
      "zh-TW": '切換當前歌曲的循環播放'
    }),
  async execute(interaction) {
    interaction.client.musicManager.loop(interaction);
  }
};