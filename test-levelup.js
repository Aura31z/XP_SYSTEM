const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLevelUpNotification } = require('../events/xpHandler');

module.exports = {
  name: 'test-levelup',
  description: 'Send a test Level Up notification message.',
  category: 'general',
  permissions: [PermissionFlagsBits.Administrator],
  data: new SlashCommandBuilder()
    .setName('test-levelup')
    .setDescription('Send a test Level Up notification message in the designated level channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(message, args, client, interaction, guildData) {
    const isInteraction = !!interaction;
    const user = isInteraction ? interaction.user : message.author;
    const guild = isInteraction ? interaction.guild : message.guild;
    const channel = isInteraction ? interaction.channel : message.channel;

    if (isInteraction) {
      await interaction.reply({ content: '✅ Dispatching test Level Up notification...', ephemeral: true }).catch(() => null);
    }

    const xpSettings = guildData?.xpConfig || { channelId: null };
    await sendLevelUpNotification(client, guild, user, { newLevel: 5, totalXp: 1250 }, xpSettings, channel);

    if (!isInteraction) {
      await message.reply('✅ Test Level Up notification dispatched!').catch(() => null);
    }
  }
};
