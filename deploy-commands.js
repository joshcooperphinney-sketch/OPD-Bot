const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const commands = [
  new SlashCommandBuilder()
    .setName('issueinfraction')
    .setDescription('Issue an infraction to an officer')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User receiving the infraction')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of infraction')
        .setRequired(true)
        .addChoices(
          { name: 'Termination', value: 'Termination' },
          { name: 'Demotion', value: 'Demotion' },
          { name: 'Suspension', value: 'Suspension' },
          { name: 'Strike', value: 'Strike' },
          { name: 'Double Warning', value: 'Double Warning' },
          { name: 'Warning', value: 'Warning' },
          { name: 'Inactivity Strike', value: 'Inactivity Strike' }
        )
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for infraction')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Additional notes')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('startpoll')
    .setDescription('Start an HR Poll')
    .addStringOption(option =>
      option.setName('topic')
        .setDescription('Poll topic')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('time')
        .setDescription('Duration in hours (24-48)')
        .setRequired(true))

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering commands...');
    await rest.put(
      Routes.applicationGuildCommands('1487596499461476352', '1443414638707474545'),
      { body: commands },
    );
    console.log('Commands registered.');
  } catch (error) {
    console.error(error);
  }
})();