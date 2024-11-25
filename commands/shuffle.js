const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the current queue')
    .setDescriptionLocalizations({
      "en-US": 'Shuffle the current queue',
      "zh-TW": '隨機播放當前隊列'
    }),
  async execute(interaction) {
    interaction.client.musicManager.shuffle(interaction);
  }
};