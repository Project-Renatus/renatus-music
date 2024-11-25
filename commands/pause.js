const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current track')
    .setDescriptionLocalizations({ 
      "en-US": 'Pause the current track',
      "zh-TW": '暫停當前歌曲'
    }), 
  async execute(interaction) {
    interaction.client.musicManager.pause(interaction);
  }
};