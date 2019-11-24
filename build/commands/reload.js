"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
exports.props = {
    "requiresElevation": "owner",
    "description": "reloads a command",
    "usage": "{command}"
};
exports.run = (client, message, args) => {
    if (!args || args.length < 1)
        return message.reply("you must provide a command name to reload").catch((err) => { console.log(err); });
    const commandName = args[0];
    if (!client.commands.has(commandName))
        return message.reply("that command does not exist");
    delete require.cache[require.resolve(path_1.default.join(__dirname, commandName + ".js"))];
    client.commands.delete(commandName);
    const props = require(path_1.default.join(__dirname, commandName + ".js"));
    client.commands.set(commandName, props);
    message.reply(`the command "${commandName}" has been reloaded`).catch((err) => { console.log(err); });
};
//# sourceMappingURL=reload.js.map