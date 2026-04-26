const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder() // ISSUE INFRACTION
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
          { name: 'Inactivity Strike', value: 'Inactivity Strike' },
          { name: 'Blacklist', value: 'Blacklist' }
        )
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for infraction')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('subdivision')
        .setDescription('Leave blank for regular department, or select a subdivision')
        .setRequired(false)
        .addChoices(
          { name: 'SAU', value: 'SAU' },
          { name: 'Intel', value: 'Intel' },
          { name: 'CRO', value: 'CRO' },
          { name: 'K-9', value: 'K-9' },
          { name: 'FTO', value: 'FTO' }
        )
    )
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Additional notes')
        .setRequired(false)),

  new SlashCommandBuilder() // HR POLL
    .setName('startpoll')
    .setDescription('Start an HR Poll')
    .addStringOption(option =>
      option.setName('topic')
        .setDescription('Poll topic')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('time')
        .setDescription('Duration in hours (24-48)')
        .setRequired(true)),

  new SlashCommandBuilder() // SAU REQUEST
    .setName('sau-request')
    .setDescription('Send an SAU operation request')
    .addStringOption(option =>
      option.setName('location')
        .setDescription('Location of the operation')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('time')
    .setDescription('Unix timestamp of occurrence')
    .setRequired(true))
    .addStringOption(option =>
      option.setName('case_link')
        .setDescription('Discord forum case file link')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('operation_type')
        .setDescription('Type of operation')
        .setRequired(true)
        .addChoices(
          { name: 'Surveillance', value: 'Surveillance' },
          { name: 'Raid', value: 'Raid' },
          { name: 'Warrant Execution', value: 'Warrant Execution' },
          { name: 'Recovery', value: 'Recovery' }
        )
    )
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Additional relevant notes')
        .setRequired(false))

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