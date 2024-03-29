import { Client, Message } from "discord.js";
import * as path from "path";
import { CommandType } from "../@interfaces/@commands";
import { GuildElevationTypes } from "../@interfaces/@guild_config";

const properties: CommandType["properties"] = {
  elevation: GuildElevationTypes.botowner,
  description: "reloads a command",
  usage: "<command>"
};

const run: CommandType["run"] = async (client: Client, message: Message, args: string[]): Promise<boolean> => {
  if (!args || args.length < 1) {
    await message.reply("you must provide a command name to reload");
    return false;
  }

  const commandName = args[0];

  //check if the command exists and is valid
  if (!client.getCommand(commandName)) {
    await message.reply("that command does not exist");
    return false;
  }

  delete require.cache[require.resolve(path.join(__dirname, commandName + ".js"))];

  //delete and reload the command from the client.commands Enmap
  client.commands.delete(commandName);
  const properties = require(path.join(__dirname, commandName + ".js"));
  client.commands.set(commandName, properties);

  await message.delete();
  await message.reply(`the command "${commandName}" has been reloaded`);

  return true;
};

module.exports.run = run;
module.exports.properties = properties;
