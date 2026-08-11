const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getLeaderboard, getUserXP } = require('../database/xp');
const { ensureAllGuildEmojis } = require('../utils/customEmojis');
const { generateLeaderboardImage } = require('../utils/leaderboardCard');

module.exports = {
  name: 'leaderboard',
  description: 'View the top ranked server members in the AURA XP Leaderboard.',
  category: 'general',
  permissions: [],
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription("View the top ranked server members in the XP Leaderboard."),
  async execute(message, args, client, interaction) {
    const isInteraction = !!interaction;
    if (isInteraction && !interaction.deferred && !interaction.replied) {
      await interaction.deferReply().catch(() => null);
    }
    const guild = isInteraction ? interaction.guild : message.guild;
    const buildLeaderboardPayload = async () => {
      const topMembers = await getLeaderboard(guild.id, 10);
      
      const enrichedMembers = await Promise.all(topMembers.map(async (m) => {
        try {
            const member = await guild.members.fetch(m.userId);
            return {
                ...m,
                tag: member.user.username,
                avatar: member.user.displayAvatarURL({ extension: 'png', size: 128 })
            };
        } catch {
            // Fallback if user left
            return {
                ...m,
                tag: 'Unknown User',
                avatar: null
            };
        }
      }));

      const buffer = await generateLeaderboardImage(guild.name, enrichedMembers).catch(() => null);
      let payload = {};
      if (buffer && buffer.length > 0) {
        const attachment = new AttachmentBuilder(buffer, { name: 'leaderboard.png' });
        payload = { files: [attachment] };
      } else {
        const embed = new EmbedBuilder()
          .setColor('#ED4245')
          .setTitle(`🏆 ${guild.name.toUpperCase()} XP LEADERBOARD`)
          .setDescription(enrichedMembers.length > 0 
            ? enrichedMembers.map((m, idx) => `**#${idx + 1}** <@${m.userId}> — **Level ${m.level}** (\`${m.xp.toLocaleString()} XP\`)`).join('\n')
            : '`No XP activity recorded yet.`')
          .setFooter({ text: `${guild.name} | AURA Leaderboard` })
          .setTimestamp();
        payload = { embeds: [embed] };
      }

      const emojis = await ensureAllGuildEmojis(guild);
      const btnRefresh = new ButtonBuilder().setCustomId('lb:refresh').setLabel('Refresh Leaderboard').setStyle(ButtonStyle.Primary);
      const btnMyRank = new ButtonBuilder().setCustomId('lb:my_rank').setLabel('My Rank').setStyle(ButtonStyle.Secondary);
      if (emojis.aura_bolt) btnRefresh.setEmoji(emojis.aura_bolt.id);

      const row = new ActionRowBuilder().addComponents(btnRefresh, btnMyRank);
      return { ...payload, components: [row] };
    };
    const initialPayload = await buildLeaderboardPayload();
    let response;
    if (isInteraction) {
      if (interaction.deferred) {
        response = await interaction.editReply(initialPayload).catch(() => null);
      } else {
        response = await interaction.reply(initialPayload).catch(() => null);
      }
    } else {
      response = await message.reply(initialPayload).catch(() => null);
    }
    const targetMsg = response || (isInteraction ? await interaction.fetchReply().catch(() => null) : null);
    if (!targetMsg) return;
    const collector = targetMsg.createMessageComponentCollector({ time: 180000 });
    collector.on('collect', async i => {
      if (i.customId === 'lb:refresh') {
        const updated = await buildLeaderboardPayload();
        await i.update(updated).catch(() => null);
      } else if (i.customId === 'lb:my_rank') {
        const userXPData = await getUserXP(guild.id, i.user.id);
        const rankEmbed = new EmbedBuilder()
          .setColor('#2b2d31')
          .setTitle(`Your AURA Rank Profile • ${i.user.tag}`)
          .setDescription(`>>> **Member:** <@${i.user.id}>\n│ **Current Level:** \`Level ${userXPData.level || 0}\`\n│ **Total XP:** \`${(userXPData.xp || 0).toLocaleString()} XP\``)
          .setThumbnail(i.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .setFooter({ text: `${guild.name} | AURA Member Rank` })
          .setTimestamp();
        await i.reply({ embeds: [rankEmbed], ephemeral: true }).catch(() => null);
      }
    });
  }
};
