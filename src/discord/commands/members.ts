import { Client, Message } from "discord.js";

import rsrc from "../resources";
import { CommandType } from "../@interfaces/@commands";
import { GuildElevationTypes } from "../@interfaces/@guild_config";

const properties: CommandType["properties"] = {
  elevation: GuildElevationTypes.moderator,
  description: "displays all members registered in the server"
};

const run: CommandType["run"] = async (client: Client, message: Message, args: string[]): Promise<boolean> => {
  let guildMembers = client.getGuildMembers(rsrc.getGuildNameFromGuild(message.guild));
  let allMembers = Array.from<string>(guildMembers.keys());

  message.reply(`here are the current registered members of the server:\n[**${allMembers.join("**, **")}**]`, { split: true });

  return true;
};

module.exports.run = run;
module.exports.properties = properties;
