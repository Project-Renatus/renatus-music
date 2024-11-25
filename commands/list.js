const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('List the current songs in queue')
    .setDescriptionLocalizations({ 
      "en-US": 'List the current songs in queue',
      "zh-TW": '列出當前隊列中的歌曲'
    }),
  async execute(interaction) {
    interaction.client.musicManager.list(interaction);
  }
};