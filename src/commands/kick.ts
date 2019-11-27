import { Message } from 'discord.js';

import config from '../resources/global_config';

module.exports.props = {
  requiresElevation: config.elevation_names.moderator,
  description: "kicks a member from the server",
  usage: "<member> <?reason>"
};

module.exports.run = async (client: any, message: Message, [mention, ...reason]) => {
  if (!message.mentions.members || message.mentions.members.array.length === 0) return message.reply("please mention a user to kick");

  const kickMember = message.mentions.members.first();

  await kickMember!.kick(reason.join(" "));

  let modChannel = client.channels.get(client.config.channels.mod.logs);
  await modChannel.send(`${kickMember!.user.username} was kicked by ${message.author.tag} for reason: ${reason}`);
};
