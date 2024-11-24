const Soundcloud = require('soundcloud.ts').default;

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
      }
    }
    
    if (interaction.isStringSelectMenu() && interaction.customId === 'select-track') {
      await interaction.deferUpdate();

      const trackUrl = interaction.values[0];

      try {
        const soundcloud = new Soundcloud(process.env.CLIENT_ID, process.env.OAUTH_TOKEN);
        const track = await soundcloud.tracks.get(trackUrl);
        const trackStream = await soundcloud.util.streamTrack(track.permalink_url);

        client.musicManager.playSongFromStream(interaction, track, trackStream);

      } catch (error) {
        console.error(error);
        interaction.followUp('Error playing selected track.');
      }
    }

    if (interaction.isButton()) {
      const serverQueue = client.musicManager.getQueue(interaction.guild.id);
      if (!serverQueue) return interaction.reply('There is no song currently playing.');

      await interaction.deferUpdate();

      switch (interaction.customId) {
        case 'pause':
          client.musicManager.pause(interaction);
          break;
        case 'resume':
          client.musicManager.resume(interaction);
          break;
        case 'skip':
          client.musicManager.skip(interaction);
          break;
        case 'loop':
          client.musicManager.loop(interaction);
          break;
        case 'stop':
          client.musicManager.stop(interaction);
          break;
      }
    }
  },
};