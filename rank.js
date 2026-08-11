const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getUserXP, calculateLevel, xpForLevel, getLeaderboard } = require('../database/xp');
const { ensureAllGuildEmojis } = require('../utils/customEmojis');
const { generateRankCard } = require('../utils/rankCard');

module.exports = {
  name: 'rank',
  description: 'View your or another member\'s current rank, level, and XP progress.',
  category: 'general',
  permissions: [],
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("View current rank, level, and XP progress.")
    .addUserOption(option => option.setName('user').setDescription("Target user to view rank.")),
  async execute(message, args, client, interaction) {
    const isInteraction = !!interaction;
    if (isInteraction && !interaction.deferred && !interaction.replied) {
      await interaction.deferReply().catch(() => null);
    }
    const guild = isInteraction ? interaction.guild : message.guild;
    const targetUser = isInteraction 
      ? (interaction.options.getUser('user') || interaction.user) 
      : (message.mentions.users.first() || message.author);
    
    // Attempt to fetch member to get guild avatar
    let member;
    try {
      member = await guild.members.fetch(targetUser.id);
    } catch {
      member = { user: targetUser, displayAvatarURL: targetUser.displayAvatarURL.bind(targetUser), displayName: targetUser.username };
    }

    const userXPData = await getUserXP(guild.id, targetUser.id);
    const currentXp = userXPData.xp || 0;
    const currentLevel = userXPData.level || calculateLevel(currentXp);
    const prevLevelXp = xpForLevel(currentLevel);
    const nextLevelXp = xpForLevel(currentLevel + 1);
    const xpInLevel = currentXp - prevLevelXp;
    const xpNeededForLevel = nextLevelXp - prevLevelXp;
    
    // Rank position in guild
    const leaderboard = await getLeaderboard(guild.id, 100);
    const userRankIndex = leaderboard.findIndex(u => u.userId === targetUser.id);
    const rankPos = userRankIndex !== -1 ? (userRankIndex + 1) : 0;
    
    const buffer = await generateRankCard(member, currentLevel, xpInLevel, xpNeededForLevel, rankPos).catch(() => null);
    let sendOptions = {};
    if (buffer && buffer.length > 0) {
      const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });
      sendOptions = { files: [attachment] };
    } else {
      const rankEmbed = new EmbedBuilder()
        .setColor('#ED4245')
        .setAuthor({ name: `${targetUser.tag || targetUser.username} • AURA RANK`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(`>>> **Member Profile & XP Metrics**`)
        .addFields(
          { name: '🏆 Server Rank', value: rankPos > 0 ? `\`#${rankPos}\`` : '`Unranked`', inline: true },
          { name: '📊 Current Level', value: `\`Level ${currentLevel}\``, inline: true },
          { name: '⚡ Total XP', value: `\`${currentXp.toLocaleString()} XP\``, inline: true },
          { name: '📈 Level Progress', value: `\`${xpInLevel.toLocaleString()} / ${xpNeededForLevel.toLocaleString()} XP\``, inline: false }
        )
        .setFooter({ text: `${guild.name} | AURA XP System` })
        .setTimestamp();
      sendOptions = { embeds: [rankEmbed] };
    }
    
    if (isInteraction) {
      if (interaction.deferred) {
        return interaction.editReply(sendOptions).catch(() => null);
      } else {
        return interaction.reply(sendOptions).catch(() => null);
      }
    }
    return message.reply(sendOptions).catch(() => null);
  }
};
