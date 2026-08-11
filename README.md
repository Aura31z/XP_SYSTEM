# 🌟 AURA - Advanced System & Music Discord Bot

Welcome to the official repository for **AURA**, a powerful, feature-rich Discord bot designed to elevate your server's experience. Built with Node.js and discord.js, AURA provides comprehensive system utilities, an interactive XP & Leveling engine, secure member verification, and high-quality music playback.

## ✨ Core Features

*   🏆 **Advanced XP & Leveling System:** 
    *   Track member activity across both text channels and voice chats (`/setup-xp`).
    *   Dynamic, image-based leaderboards for server rankings (`/leaderboard`).
    *   Customizable level-up notifications and reward roles.
*   🛡️ **Interactive Member Verification:** 
    *   Master control panel for secure server entry and automatic role assignment (`/verification`).
*   🎵 **Music Utilities:** High-quality audio playback and intuitive queue management.
*   💾 **Robust Database:** Powered by **MongoDB** and Mongoose for fast, reliable data storage and cross-server syncing.

## 📌 Available Commands

Here are some of the core system commands included in this module:

| Command | Description | Permissions |
| :--- | :--- | :--- |
| `/setup-xp` | Master Interactive Control Portal for the AURA XP System. Configure level channels, toggle voice XP, and manage settings. | `Administrator` |
| `/leaderboard` | View the top-ranked server members on an interactive, image-rendered XP Leaderboard. | `Everyone` |
| `/test-levelup` | Dispatch a test Level Up notification message to verify your configurations. | `Administrator` |
| `/verification` | Master Interactive Control Panel for the Member Verification System. | `Administrator` |

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/aura-bot.git
   cd aura-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   MONGO_URI=your_mongodb_connection_string
   CLIENT_ID=your_bot_client_id
   ```

4. **Start the Bot:**
   ```bash
   node index.js
   ```

## 🛠️ Technologies Used
*   **[Node.js](https://nodejs.org/)** - JavaScript runtime
*   **[Discord.js](https://discord.js.org/)** - Powerful API library for interacting with Discord
*   **[MongoDB](https://www.mongodb.com/) & Mongoose** - Database and object modeling

## 📞 Support

If you encounter any issues, have questions, or want to see AURA in action, feel free to join our official support server: **PARADISE**.

---
*Crafted with ❤️ for the Discord community.*
