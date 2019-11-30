import { Client, Message } from "discord.js";

import rsrc from "../discord-resources";
import { MemberConfigType } from "../@interfaces/@member_config";
import { CommandType } from "../@interfaces/@commands";
import { GuildElevationTypes } from "../@interfaces/@guild_config";

const properties: CommandType["properties"] = {
  elevation: GuildElevationTypes.moderator,
  description: "displays a member's data",
  usage: "<@member | username>"
};

const run: CommandType["run"] = async (client: Client, message: Message, ...args: any): Promise<boolean> => {
  const member = message.mentions.members.first();

  let username: string;
  let memberConfig: MemberConfigType;

  if (!member) {
    if (args.length == 1) {
      memberConfig = rsrc.getMemberConfigFromName(client, message, args[0], true);

      if (!memberConfig) {
        await message.reply("that member is not registered");
        return false;
      } else {
        username = memberConfig?.hidden?.username;
      }
    } else {
      await message.reply("you need to specify a member");
      return false;
    }
  } else {
    username = rsrc.getUsernameFromMember(member);
    memberConfig = client.getMemberConfig(message.guild, username);
  }

  if (!username || !memberConfig) {
    await message.reply("that member is not registered");
    return false;
  }

  await message.delete();
  await message.channel.send(`Here is the data for [${username.hideID()}]\n\`\`\`json\n${JSON.stringify(memberConfig, null, "\t")}\n\`\`\``);

  return true;
};

module.exports.run = run;
module.exports.properties = properties;