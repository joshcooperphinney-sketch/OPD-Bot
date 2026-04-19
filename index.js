const { 
  Client, 
  GatewayIntentBits, 
  Events, 
  EmbedBuilder 
} = require('discord.js');

require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessages
  ]
});

let caseNumber = 1;

const UNIT_LEADS_ROLE_ID = '1451993975434252438';
const INTELLIGENCE_DIVISION_ROLE_ID = '1445699831317135461';
const SAU_ASSIGNMENTS_CHANNEL_ID = '1486788196980490261';
const DEPT_ADVISOR_ROLE_ID = '1444915293489991815';
const DEPT_COMMAND_ROLE_ID = '1443475886018924565';
const FIELD_COMMAND_ROLE_ID = '1446749008105181273';
const HR_POLLS_THREAD_ID = '1485861154189344900';
const ACTIONS_CHANNEL_ID = '1443451986056843505';
const ALLOWED_ROLE_IDS = [
  '1443449344333320232', // Dept. Overseers
  '1444234547452444762', // Internal Affairs
  '1451993975434252438'     // Unit Leads
];
const INFRACTION_CHANNEL_ID = '1443446307661545513';
const POLL_ALLOWED_ROLE_IDS = [
  FIELD_COMMAND_ROLE_ID,
  DEPT_COMMAND_ROLE_ID,
  DEPT_ADVISOR_ROLE_ID
];

async function logCommand(interaction) {
  try {
    const channel = await client.channels.fetch(ACTIONS_CHANNEL_ID);

    // Get all options used in the command
    const options = interaction.options.data.map(opt => {
      return `**${opt.name}:** ${opt.value}`;
    }).join('\n') || 'None';

    // Action Logging Embed
    const logEmbed = new EmbedBuilder()
      .setTitle('Command Executed')
      .setColor('#112152') 
      .addFields(
        { name: 'User', value: `${interaction.user}`, inline: true },
        { name: 'Command', value: `\`/${interaction.commandName}\``, inline: true },
        { name: 'Channel', value: `${interaction.channel}`, inline: true },
        { name: 'Arguments', value: options }
      )
      .setTimestamp();

    await channel.send({ embeds: [logEmbed] });

  } catch (error) {
    console.error('Logging failed:', error);
  }
}

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

async function closePoll(message) {
  try {
    await message.fetch();

    if (!message.embeds.length) return;
    const embed = message.embeds[0];
    if (embed.title !== 'HR Poll') return;

    const upvote = message.reactions.cache.get('1452928682791534756');
    const downvote = message.reactions.cache.get('1452928734880596028');

    const upCount = upvote ? upvote.count - 1 : 0;
    const downCount = downvote ? downvote.count - 1 : 0;

    let resultText = 'Tie';
    if (upCount > downCount) resultText = 'Passed';
    if (downCount > upCount) resultText = 'Rejected';

    const closedEmbed = new EmbedBuilder()
      .setTitle('HR Poll — Closed')
      .setColor('#112152')
      .addFields(
        embed.fields[0], // Topic
        embed.fields[1], // Duration
        embed.fields[2], // Ends
        {
          name: 'Final Results',
          value: `<:opd_checkmark:1452928682791534756> In Agreement: **${upCount}**\n<:opd_red_ex:1452928734880596028> Against: **${downCount}**`
        },
        {
          name: 'Outcome',
          value: `**${resultText}**`
        }
      )
      .setFooter({ text: embed.footer?.text || 'Poll closed' })
      .setTimestamp();

    await message.edit({ content: '🔒 This HR poll is now closed.', embeds: [closedEmbed] });

    try {
      await message.reactions.removeAll();
    } catch (err) {
      console.error('Failed to remove reactions:', err);
    }

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('HR Poll Results')
          .setColor('#112152')
          .addFields(
            { name: 'Topic', value: embed.fields[0].value },
            {
              name: 'Results',
              value: `<:opd_checkmark:1452928682791534756> In Agreement: **${upCount}**\n<:opd_red_ex:1452928734880596028> Against: **${downCount}**`
            },
            { name: 'Outcome', value: `**${resultText}**` }
          )
          .setTimestamp()
      ]
    });

  } catch (error) {
    console.error('Closing poll failed:', error);
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await logCommand(interaction);

  // 🔴 COMMAND 1 — INFRACTIONS
  if (interaction.commandName === 'issueinfraction') {

    if (!ALLOWED_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId))) {
      return interaction.reply({ 
        content: 'You do not have permission.', 
        ephemeral: true 
      });
    }

    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const subdivision = interaction.options.getString('subdivision');
    const reason = interaction.options.getString('reason');
    const notes = interaction.options.getString('notes') || 'None';

    const currentCase = caseNumber++;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${user.tag}`,
        iconURL: user.displayAvatarURL()
      })
      .setTitle('Officer Infraction')
      .setColor('#112152')
      .addFields(
        { name: 'Case', value: `${currentCase}`, inline: true },
        { name: 'Infraction', value: type, inline: true },
        { name: 'Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        {
          name: 'Division',
          value: subdivision || 'N/A',
          inline: true
        },
        { name: 'Reason', value: reason, inline: true },
        { name: 'Notes', value: notes, inline: true }
      )
      .setFooter({
        text: `Issued by: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    const channel = await client.channels.fetch(INFRACTION_CHANNEL_ID);
    await channel.send({ embeds: [embed] });

    try {
      await user.send({ embeds: [embed] });
    } catch {}

    await interaction.reply({ 
      content: `Infraction issued to ${user.tag}`, 
      ephemeral: true 
    });
  }

  // 🔵 COMMAND 2 — START POLL
  if (interaction.commandName === 'startpoll') {
    if (!POLL_ALLOWED_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId))) {
  return interaction.reply({
    content: 'You do not have permission to start HR polls.',
    ephemeral: true
  });
}

    const topic = interaction.options.getString('topic');
    const time = interaction.options.getInteger('time');

    // ⛔ Validate time
    if (time < 24 || time > 48) {
      return interaction.reply({
        content: 'Time must be between 24 and 48 hours.',
        ephemeral: true
      });
    }

    // 🧮 Calculate end time
    const endTime = Math.floor(Date.now() / 1000) + (time * 60 * 60);

    const embed = new EmbedBuilder()
      .setTitle('HR Poll')
      .setColor('#112152')
      .addFields(
        { name: 'Topic', value: topic },
        { name: 'Duration', value: `${time} hours`, inline: true },
        { name: 'Ends', value: `<t:${endTime}:F>`, inline: true },
        { name: 'Options', value: '<:opd_checkmark:1452928682791534756> In Agreement\n<:opd_red_ex:1452928734880596028> Against' }
      )
      .setFooter({ text: `Started by ${interaction.user.tag}` })
      .setTimestamp();

    // 📍 Send to thread
    const thread = await client.channels.fetch(HR_POLLS_THREAD_ID);
    const message = await thread.send({
     content: `<@&${DEPT_COMMAND_ROLE_ID}> <@&${FIELD_COMMAND_ROLE_ID}> <@&${DEPT_ADVISOR_ROLE_ID}>`,
     embeds: [embed],
     allowedMentions: {
    roles: [DEPT_COMMAND_ROLE_ID, FIELD_COMMAND_ROLE_ID, DEPT_ADVISOR_ROLE_ID]
    }
    });
    message.isPoll = true;

    // 👍👎 reactions
    await message.react('<:opd_checkmark:1452928682791534756>');
    await message.react('<:opd_red_ex:1452928734880596028>');

    setTimeout(async () => {
      await closePoll(message);
    }, time * 60 * 60 * 1000);

    await interaction.reply({
      content: 'Poll created successfully.',
      ephemeral: true
    });
  }

 // 🔴 COMMAND 3 — SAU REQUEST
 if (interaction.commandName === 'sau-request') {

  if (!interaction.member.roles.cache.has(INTELLIGENCE_DIVISION_ROLE_ID)) {
    return interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true
    });
  }

  const location = interaction.options.getString('location');
  const time = interaction.options.getInteger('time');
    if (!/^P\d{3,4}$/i.test(location)) {
    return interaction.reply({
     content: 'Location must be in postal code format: P### or P####',
     ephemeral: true
    });
   }
  const caseLink = interaction.options.getString('case_link');
  const operationType = interaction.options.getString('operation_type');
  const notes = interaction.options.getString('notes') || 'None';

  const embed = new EmbedBuilder()
    .setTitle('SAU Operation Request')
    .setColor('#112152')
    .addFields(
      { name: 'Operation Type', value: operationType, inline: true },
      { name: 'Location', value: location.toUpperCase(), inline: true },
      { name: 'Time of Occurrence', value: `<t:${time}:F>`, inline: true },
      { name: 'Case File', value: `[Open Case File](${caseLink})` },
      { name: 'Additional Notes', value: notes }
    )
    .setFooter({
      text: `Requested by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTimestamp();

  const channel = await client.channels.fetch(SAU_ASSIGNMENTS_CHANNEL_ID);
  await channel.send({ embeds: [embed] });

  await interaction.reply({
    content: 'SAU request sent successfully.',
    ephemeral: true
  });
 }
});

async function updatePollEmbed(message) {
  try {
    if (!message.embeds.length) return;

    const embed = message.embeds[0];

    // Only update HR Poll embeds
    if (embed.title !== 'HR Poll') return;

    const upvote = message.reactions.cache.get('1452928682791534756');
    const downvote = message.reactions.cache.get('1452928734880596028');

    const upCount = upvote ? upvote.count - 1 : 0; // subtract bot
    const downCount = downvote ? downvote.count - 1 : 0;

    const updatedEmbed = new EmbedBuilder()
      .setTitle(embed.title)
      .setColor('#112152')
      .addFields(
        embed.fields[0], // Topic
        embed.fields[1], // Duration
        embed.fields[2], // Ends
        {
          name: 'Votes',
          value: `<:opd_checkmark:1452928682791534756> In Agreement: **${upCount}**\n<:opd_red_ex:1452928734880596028> Against: **${downCount}**`
        }
      )
      .setFooter({ text: embed.footer.text })
      .setTimestamp();

    await message.edit({ embeds: [updatedEmbed] });

  } catch (error) {
    console.error('Poll update failed:', error);
  }
}

client.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot) return;
      await updatePollEmbed(reaction.message);
    });

    client.on('messageReactionRemove', async (reaction, user) => {
      if (user.bot) return;
      await updatePollEmbed(reaction.message);
    });

client.login(process.env.TOKEN);