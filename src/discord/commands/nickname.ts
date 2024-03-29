import { Client, Message } from "discord.js";
import { CommandType } from "../@interfaces/@commands";
import { GuildElevationTypes } from "../@interfaces/@guild_config";

const properties: CommandType["properties"] = {
  elevation: GuildElevationTypes.moderator,
  description: "changes the nickname of a user",
  usage: "<@member | username> <nickname>",
  aliases: ["nick"]
};

const run: CommandType["run"] = async (client: Client, message: Message, args: string[]): Promise<boolean> => {
  if (message.mentions?.members?.size === 0) {
    await message.reply("please mention a member to change their nickname");
    return false;
  }

  const nickMember = message.mentions.members.first();
  await nickMember.setNickname((args as string[]).slice(1).join(" "));
  await message.reply(`${nickMember}'s nickname has been changed!`);

  return true;
};

module.exports.run = run;
module.exports.properties = properties;
