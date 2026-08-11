const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildVPanelEmbed, buildVPanelComponents } = require('../components/vpanelMenu');
module.exports = {
  name: 'verification',
  description: 'Master Interactive Control Panel for Member Verification System & Role Assignment.',
  permissions: [PermissionFlagsBits.Administrator],
  data: new SlashCommandBuilder()
    .setName('verification')
    .setDescription("For Member Verification System & Role Assignment.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(message, args, client, interaction, guildData) {
    const isInteraction = !!interaction;
    if (isInteraction && !interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true }).catch(() => null);
    }
    const guild = isInteraction ? interaction.guild : message.guild;
    const embed = await buildVPanelEmbed(guild, guildData);
    const components = await buildVPanelComponents(guildData, guild);
    return isInteraction 
      ? interaction.editReply({ embeds: [embed], components }) 
      : message.reply({ embeds: [embed], components });
  }
};
