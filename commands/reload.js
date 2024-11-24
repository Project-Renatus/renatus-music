const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload commands or events')
    .addSubcommand(subcommand =>
      subcommand
        .setName('command')
        .setDescription('Reload a command')
        .addStringOption(option => 
          option.setName('name')
            .setDescription('The name of the command')
            .setRequired(true)
        ))
    .addSubcommand(subcommand =>
      subcommand
        .setName('event')
        .setDescription('Reload an event')
        .addStringOption(option => 
          option.setName('name')
            .setDescription('The name of the event')
            .setRequired(true)
        )),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const name = interaction.options.getString('name');

    try {
      if (subcommand === 'command') {
        const commandPath = `./commands/${name}.js`;
        if (fs.existsSync(commandPath)) {
          delete require.cache[require.resolve(`../commands/${name}.js`)];
          const newCommand = require(`../commands/${name}.js`);
          interaction.client.commands.set(newCommand.data.name, newCommand);
          await interaction.reply(`Command \`${name}\` was reloaded!`);
        } else {
          await interaction.reply(`Command \`${name}\` not found.`);
        }
      } else if (subcommand === 'event') {
        const eventPath = `./events/${name}.js`;
        if (fs.existsSync(eventPath)) {
          delete require.cache[require.resolve(`../events/${name}.js`)];
          const newEvent = require(`../events/${name}.js`);
          interaction.client.removeAllListeners(newEvent.name);
          if (newEvent.once) {
            interaction.client.once(newEvent.name, (...args) => newEvent.execute(...args, interaction.client));
          } else {
            interaction.client.on(newEvent.name, (...args) => newEvent.execute(...args, interaction.client));
          }
          await interaction.reply(`Event \`${name}\` was reloaded!`);
        } else {
          await interaction.reply(`Event \`${name}\` not found.`);
        }
      }
    } catch (error) {
      console.error(error);
      interaction.reply(`Failed to reload ${subcommand} \`${name}\`.`);
    }
  },
};