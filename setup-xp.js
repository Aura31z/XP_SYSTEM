const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelSelectMenuBuilder, 
  RoleSelectMenuBuilder,
  ChannelType, 
  PermissionFlagsBits 
} = require('discord.js');
const { getXpSettings } = require('../database/xp');
const { getOrUploadGuildEmoji } = require('../utils/customEmojis');
module.exports = {
  name: 'setup-xp',
  description: 'Master Interactive Control Portal for AURA XP System & Level Notifications.',
  permissions: [PermissionFlagsBits.Administrator],
  data: new SlashCommandBuilder()
    .setName('setup-xp')
    .setDescription("Control for XP System & Level Notifications.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(message, args, client, interaction, guildData) {
    const isInteraction = !!interaction;
    if (isInteraction && !interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true }).catch(() => null);
    }
    const guild = isInteraction ? interaction.guild : message.guild;
    const buildXpPayload = async () => {
      const settings = getXpSettings(guildData);
      const [aura_check, aura_bolt] = await Promise.all([
        getOrUploadGuildEmoji(guild, 'aura_check'),
        getOrUploadGuildEmoji(guild, 'aura_bolt')
      ]);
      const checkEm = aura_check ? aura_check.toString() : '✅';
      const boltEm = aura_bolt ? aura_bolt.toString() : '⚡';
      const channelDisplay = settings.channelId ? `<#${settings.channelId}>` : '`Current Chat Channel (Default)`';
      const statusDisplay = settings.enabled !== false ? `Active (ON) ${checkEm}` : 'Disabled (OFF) ❌';
      const voiceDisplay = settings.voiceXpEnabled !== false ? 'Active (ON) 🎙️' : 'Disabled (OFF) 🔇';
      const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle(`${boltEm} AURA XP SYSTEM | Master Control Panel`)
        .setDescription(`>>> ${boltEm} **Configure Level-Up notifications, Voice XP calculation, and Member Progress Announcements.**\nUse the interactive controls below to customize your guild's XP engine.`)
        .addFields(
          { name: '📊 XP System Status', value: statusDisplay, inline: true },
          { name: '🎙️ Voice XP Status', value: voiceDisplay, inline: true },
          { name: '📢 Level-Up Channel', value: channelDisplay, inline: true },
          { name: '⚙️ Chat XP Cooldown', value: `\`${(settings.cooldownMs || 45000) / 1000}s per user\``, inline: true }
        )
        .setFooter({ text: `${guild.name} | AURA XP Control Panel`, iconURL: client.user?.displayAvatarURL() })
        .setTimestamp();
      const btnAuto = new ButtonBuilder().setCustomId('xp:auto_setup').setLabel('1-Click Auto Setup').setStyle(ButtonStyle.Success);
      const btnToggle = new ButtonBuilder().setCustomId('xp:toggle').setLabel(settings.enabled !== false ? 'Disable System' : 'Enable System').setStyle(settings.enabled !== false ? ButtonStyle.Danger : ButtonStyle.Primary);
      const btnVoiceToggle = new ButtonBuilder().setCustomId('xp:toggle_voice').setLabel(settings.voiceXpEnabled !== false ? 'Disable Voice XP' : 'Enable Voice XP').setStyle(ButtonStyle.Secondary);
      if (aura_bolt && aura_bolt.id) {
        try { btnAuto.setEmoji(aura_bolt.id); } catch (e) {}
      }
      if (aura_check && aura_check.id) {
        try { btnToggle.setEmoji(aura_check.id); } catch (e) {}
      }
      const row1 = new ActionRowBuilder().addComponents(btnAuto, btnToggle, btnVoiceToggle);
      const channelMenu = new ChannelSelectMenuBuilder()
        .setCustomId('xp:select_channel')
        .setPlaceholder('📢 Select level-up notification channel...')
        .setChannelTypes([ChannelType.GuildText, ChannelType.GuildAnnouncement]);
      const row2 = new ActionRowBuilder().addComponents(channelMenu);
      return { embeds: [embed], components: [row1, row2] };
    };
    const initialPayload = await buildXpPayload();
    const response = isInteraction 
      ? ((interaction.deferred || interaction.replied) ? await interaction.editReply(initialPayload).catch(() => null) : await interaction.reply({ ...initialPayload, ephemeral: true }).catch(() => null))
      : await message.reply(initialPayload).catch(() => null);
    const targetMsg = response || (isInteraction ? await interaction.fetchReply().catch(() => null) : null);
    if (!targetMsg) return;
    const collector = targetMsg.createMessageComponentCollector({ time: 180000 });
    collector.on('collect', async i => {
      if (!i.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return i.reply({ content: '❌ Only administrators can manage XP settings.', ephemeral: true });
      }
      guildData.xpSettings = guildData.xpSettings || {};
      if (i.isButton()) {
        if (i.customId === 'xp:auto_setup') {
          let lvlChannel = guild.channels.cache.find(c => c.name.includes('level') || c.name === '🎗️┃level');
          if (!lvlChannel) {
            lvlChannel = await guild.channels.create({
              name: '🎗️┃level',
              type: ChannelType.GuildText,
              reason: 'Provisioned level channel via /setup-xp'
            }).catch(() => null);
          }
          if (lvlChannel) {
            guildData.xpSettings.channelId = lvlChannel.id;
            guildData.xpSettings.enabled = true;
            guildData.markModified('xpSettings');
            if (guildData.save) await guildData.save().catch(() => null);
          }
        } else if (i.customId === 'xp:toggle') {
          guildData.xpSettings.enabled = !(guildData.xpSettings.enabled !== false);
          guildData.markModified('xpSettings');
          if (guildData.save) await guildData.save().catch(() => null);
        } else if (i.customId === 'xp:toggle_voice') {
          guildData.xpSettings.voiceXpEnabled = !(guildData.xpSettings.voiceXpEnabled !== false);
          guildData.markModified('xpSettings');
          if (guildData.save) await guildData.save().catch(() => null);
        }
      } else if (i.isChannelSelectMenu()) {
        if (i.customId === 'xp:select_channel') {
          guildData.xpSettings.channelId = i.values[0];
          guildData.xpSettings.enabled = true;
          guildData.markModified('xpSettings');
          if (guildData.save) await guildData.save().catch(() => null);
        }
      } else if (i.isRoleSelectMenu()) {
        if (i.customId === 'xp:select_roles') {
          guildData.xpSettings.rewardRoleIds = i.values;
          guildData.markModified('xpSettings');
          if (guildData.save) await guildData.save().catch(() => null);
        }
      }
      const updatedPayload = await buildXpPayload();
      await i.update(updatedPayload).catch(() => null);
    });
  }
};
