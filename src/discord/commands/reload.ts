import { Client, Message } from "discord.js";
import * as path from "path";
import { CommandType, ElevationTypes } from "../@interfaces/@commands";

const props: CommandType["properties"] = {
  elevation: ElevationTypes.botowner,
  description: "reloads a command",
  usage: "<command>"
};

const run: CommandType["function"] = async (client: Client, message: Message, ...args: any[]): Promise<boolean> => {
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
  const props = require(path.join(__dirname, commandName + ".js"));
  client.commands.set(commandName, props);

  await message.reply(`the command "${commandName}" has been reloaded`);

  return true;
};

module.exports.run = run;
module.exports.props = props;
