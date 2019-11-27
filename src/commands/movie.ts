import { GuildMember, Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';
import fetch from 'node-fetch';

import rsrc from '../classes/Resources';
import config from '../resources/global_config';

module.exports.props = {
  requiresElevation: config.elevation_names.moderator,
  description: "creates a media invite embed",
  usage: "<?done>"
};

module.exports.run = async (client: any, message: Message, args: string[]) => {
  await message.delete();

  let mediaRole = message.guild.roles.find(role => role.name === "movie");
  let mediaNotifyRole = message.guild.roles.find(role => role.name === "movie-notifications");
  const guildMembers: GuildMember[] = await message.guild.members.fetch().then(guildmemberstore => Array.from(guildmemberstore.values()));

  if (args.length == 1 && args[0].toLowerCase().trim() === "done") {
    for (let i = 0; i < guildMembers.length; i++) if (guildMembers[i].roles.has(mediaRole.id)) guildMembers[i].roles.remove(mediaRole);
    return;
  }

  let reactToJoinEmoji: string = "✅";
  let reactToNotifyEmoji: string = "🔔";
  let reactToRemoveEmoji: string = "🔕";

  let mediaName: string;
  let mediaTime: string;
  let medialDetails: string;
  await rsrc.askQuestion(message.member, message.channel as TextChannel, "What is the title of the movie that will be streamed?", true).then(response => {
    mediaName = response;
  });

  await rsrc.askQuestion(message.member, message.channel as TextChannel, "What time will the movie start?", true).then(response => {
    mediaTime = response;
  });

  const details = await fetch(`http://www.omdbapi.com/?i=tt3896198&apikey=56ccfefa&t=${mediaName.split(" ").join("+")}`).then(content => content.json());
  if (!details) {
    await rsrc.askQuestion(message.member, message.channel as TextChannel, "Add any further details, or enter 'none' to continue", true).then(response => {
      medialDetails = response;
    });
  } else {
    medialDetails = details["Plot"];
  }

  let embed = new MessageEmbed();
  embed.setTitle("🎬  🎬  🎬   **MOVIE ALERT**   🎬  🎬  🎬");
  embed.addField("STREAMING", mediaName, true);
  embed.addField("AT", mediaTime, true);

  if (medialDetails && medialDetails?.toLowerCase().trim() !== "none") embed.addField("DETAILS", medialDetails);

  embed.setDescription(`\`\`\`React with ${reactToJoinEmoji} to join!\nReact with ${reactToNotifyEmoji} to be notified in the future!\nReact with ${reactToRemoveEmoji} to unsubscribe from notifications\`\`\``.toUpperCase());

  await message.channel.send(embed).then(async message => {
    await message.react(reactToJoinEmoji);
    await message.react(reactToNotifyEmoji);
    await message.react(reactToRemoveEmoji);

    const filter = (reaction: MessageReaction, user: User): true => {
      let passJoin = reaction.emoji.toString() === reactToJoinEmoji;
      let passNotify = reaction.emoji.toString() === reactToNotifyEmoji;
      let passRemove = reaction.emoji.toString() === reactToRemoveEmoji;
      if (!passJoin && !passNotify && !passRemove) return;

      let member = message.guild.members.find(member => member.user.id === user.id);
      if (member.roles.find(role => role.name === "bot")) return;

      if (passJoin) {
        member.roles.add(mediaRole);

        let hangout: TextChannel = message.guild.channels.find(channel => channel.name === "movie-hangout") as TextChannel;
        hangout.send(`Welcome ${member} to the hangout!  Get prepared to join us for **${mediaName}** over in the movie room at **${mediaTime}**!`);
      }

      if (passNotify) {
        member.roles.add(mediaNotifyRole);
        message.channel.send(`Awesome!  ${member} you will be notified the next time a movie event is created!  (Make sure you have Server DMs enabled in your privacy settings)`);
      }

      if (passRemove) {
        member.roles.remove(mediaNotifyRole)
        .then(() => {
          message.channel.send(`${member} you will no longer be notified of movie events`);
        }).catch(reason => {});
      }
    };

    message.createReactionCollector(filter);
  });

  //bot testing channel
  if(message.channel.id === "642167914518282250") return;

  for (let i = 0; i < guildMembers.length; i++) if (guildMembers[i].roles.has(mediaNotifyRole.id)) await guildMembers[i].send(`Hey!  A movie alert for **${mediaName}** was just posted in **${message.guild.name}**, in the **${message.channel.toString()}** channel!`).catch(reason => {});
};