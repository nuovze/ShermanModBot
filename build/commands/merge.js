"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("colors");
const fs_1 = require("fs");
const path_1 = require("path");
const rimraf_1 = require("rimraf");
const Resources_1 = require("../classes/Resources");
exports.props = {
    requiresElevation: "owner",
    description: "copies a user's data to another user, and deletes the original",
    usage: "{user} {user}"
};
exports.run = (client, message, args) => {
    if (args.length != 2)
        return message.reply("you need to specify two users").catch(err => {
            console.log(err);
        });
    //the user to copy from
    const oldUser = args[0].trim().toLowerCase();
    //the user to copy to
    const newUser = args[1].trim().toLowerCase();
    let oldUsername = Resources_1.default.getUsernameFromMember(oldUser);
    let newUsername = Resources_1.default.getUsernameFromMember(newUser);
    if (!client.hasUser(message.guild, oldUsername))
        if (message)
            return message.reply(`I could not find OLD [${oldUser}] in my database`);
        else
            return console.error(`!! I could not find OLD [${oldUser}] in my database`.red);
    if (!client.hasUser(message.guild, newUsername))
        if (message)
            return message.reply(`I could not find NEW [${newUser}] in my database`);
        else
            return console.error(`!! I could not find NEW [${newUser}] in my database`.red);
    let content = client.getUserContent(message.guild, oldUsername);
    content.hidden.username = newUsername;
    let source = Resources_1.default.getUserDirectoryFromGuild(message.guild, oldUsername);
    let destination = Resources_1.default.getUserDirectoryFromGuild(message.guild, newUsername);
    fs_1.default.writeFileSync(path_1.default.join(destination, newUsername + ".json"), JSON.stringify(content, null, "\t"));
    rimraf_1.default(source, err => {
        if (err)
            console.log(err);
    });
    client.usersInSession.delete(oldUser);
    console.log(`*Removed [${oldUser}] from session`);
    if (message)
        message.delete().catch(err => {
            console.log(err);
        });
};
//# sourceMappingURL=merge.js.map