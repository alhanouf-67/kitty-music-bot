
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ChannelType,
} = require("discord.js");

const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
} = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName("join")
    .setDescription("Kitty يدخل روم الفويس"),
  new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Kitty يطلع من الفويس"),
].map(command => command.toJSON());

client.once("ready", async () => {
  console.log(`Kitty is online: ${client.user.tag}`);

  const rest = new REST({ version: "10" })
    .setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      client.user.id,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("Slash commands registered!");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "join") {
    const channel = interaction.member.voice.channel;

    if (!channel || ![
      ChannelType.GuildVoice,
      ChannelType.GuildStageVoice,
    ].includes(channel.type)) {
      return interaction.reply({
        content: "🐱 ادخلي روم فويس أول، ثم استخدمي /join",
        ephemeral: true,
      });
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
      await interaction.reply("🐱 مياو! دخلت الفويس وبجلس هنا.");
    } catch {
      connection.destroy();
      await interaction.reply({
        content: "ما قدرت أتصل بالفويس، تأكدي من صلاحياتي.",
        ephemeral: true,
      });
    }
  }

  if (interaction.commandName === "leave") {
    const connection = getVoiceConnection(interaction.guildId);

    if (!connection) {
      return interaction.reply("🐱 أنا مو داخل أي فويس.");
    }

    connection.destroy();
    await interaction.reply("🐾 طلعت من الفويس!");
  }
});

client.login(process.env.DISCORD_TOKEN);
