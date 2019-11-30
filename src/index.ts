import "./discord/extensions/discordjs-extend";
import "./shared/extensions/string/string-extend";
import "colors";

import { Client } from "discord.js";
import * as fs from "fs";
import * as path from "path";

import { DiscordSecrets } from "./discord/secrets/discord-secrets";
import { CommandType } from "./discord/@interfaces/@commands";

let client: Client = new Client();
loadEventsAndCommands();

let dev: boolean = false,
  ver: boolean = false;
if (process.argv.length > 0) {
  let args = process.argv.join();

  if (args.toLowerCase().includes("--dev")) dev = true;
  if (args.toLowerCase().includes("--verbose")) ver = true;
}

export namespace BuildOptions {
  export const development = dev;
  export const verbose = ver;
}

client.login(DiscordSecrets.token);

/**
 * Loads the events and commands for the bot
 */
function loadEventsAndCommands(): void {
  let eventsPath = path.join(__dirname, "discord", "events");
  fs.readdir(eventsPath, function(err, files): void {
    if (err) {
      String(err).error();
      return;
    }

    files.forEach(async function(file) {
      if (!file.endsWith(".js")) return;
      let event = await import(path.join(eventsPath, file));
      let eventName = file.split(".")[0];

      `--registering event ${eventName}`.print();
      client.on(eventName, event.bind(null, client));
      delete require.cache[require.resolve(path.join(eventsPath, file))];
    });
  });

  let commandsPath = path.join(__dirname, "discord", "commands");
  fs.readdir(commandsPath, function(err, files): void {
    if (err) {
      String(err).error();
      return;
    }

    files.forEach(async function(file) {
      if (!file.endsWith(".js")) return;

      let command = (await import(path.join(commandsPath, file))) as CommandType;
      let commandName = file.split(".")[0];

      `--registering command ${commandName.cyan}`.print();
      client.addCommand(commandName, command);
      "--completed".success();
    });
  });
}
