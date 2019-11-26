"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("colors");
const fs = require("fs");
const path = require("path");
const Resources_1 = require("../classes/Resources");
const config_1 = require("../config");
const blacklist_1 = require("../resources/misc/blacklist");
const ranks_1 = require("../resources/ranks/ranks");
module.exports = (client, message) => {
    var _a;
    if (message.author.bot)
        return;
    if (!registerMessage(client, message))
        return console.error(`!! Could not register message sent by [${Resources_1.default.getUsernameFromMessage(message)}]`.red);
    if (blacklist_1.default.words.some(substring => message.content.includes(substring))) {
        message.delete().catch(err => {
            console.log(err);
        });
        message.reply("that is not allowed here.").catch(err => {
            console.log(err);
        });
    }
    awardExperience(client, message);
    if (message.content.indexOf(client.config.prefix) !== 0)
        return;
    const args = message.content
        .slice(client.config.prefix.length)
        .trim()
        .split(/ +/g);
    let command;
    if (args)
        command = args.shift().toLowerCase();
    if (!command)
        return;
    const cmd = client.commands.get(command);
    if (!cmd)
        return;
    if (cmd.props.requiresElevation && cmd.props.requiresElevation !== "")
        if (!((_a = message.member) === null || _a === void 0 ? void 0 : _a.roles.has(client.config.roles[cmd.props.requiresElevation])))
            return;
    cmd.run(client, message, args);
};
function registerMessage(client, message) {
    let username = Resources_1.default.getUsernameFromMessage(message);
    if (!message.guild)
        return;
    let guildName = Resources_1.default.getGuildNameFromGuild(message.guild);
    let userDir = Resources_1.default.getUserDirectoryFromGuild(message.guild, username);
    let content;
    if (!fs.existsSync(userDir))
        Resources_1.default.createUserDirectory(client, message.guild, message.member);
    if (!client.hasUser(message.guild, username)) {
        content = Resources_1.default.getUserContentsFromName(client, message, username);
        client.registerUser(message.member.user, content);
    }
    else {
        content = client.getUserContent(message.guild, username);
    }
    if (content === null || typeof content === "undefined") {
        console.error(`!! Could not retrieve contents for [${username}]`.red);
        return false;
    }
    if (content.misc.first_message === null ||
        typeof content.misc.first_message === "undefined") {
        content.misc.first_message = message.content;
        client.updateUser(content);
    }
    let logMessage = `[${getTimestamp(message)}] (#${message.channel.name}): ${message.content}\n`;
    client.masterLog.push(`/${guildName}/>  ${username} ${logMessage}`);
    updateMasterLog(client);
    content.userLog.push(logMessage);
    updateUserLog(client, message.guild, content);
    return true;
}
function getTimestamp(message) {
    let timestamp = message.createdAt;
    let date = (timestamp.getMonth() + 1 + "/" + timestamp.getDate()).replace(/.*(\d{2}\/\d{2}).*/, "$1");
    let time = timestamp.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
    return date + "  " + time;
}
function updateMasterLog(client) {
    let masterLog = path.join(__dirname, "..", "logs");
    if (!fs.existsSync(masterLog)) {
        fs.mkdirSync(masterLog, { recursive: true });
        fs.writeFileSync(path.resolve(masterLog, config_1.default.files.log_all), "-- START OF LOG --");
    }
    if (client.masterLog.length >= client.config.preferences.log_threshold_master) {
        for (var i = 0; i < client.masterLog.length; i++)
            fs.appendFileSync(masterLog, client.masterLog[i]);
        client.masterLog = [];
    }
}
function updateUserLog(client, guild, content) {
    let logsDir = path.join(Resources_1.default.getUserDirectoryFromGuild(guild, content.hidden.username), "logs");
    let userLog = path.join(logsDir, client.config.files.log_all);
    if (content.userLog.length >= client.config.preferences.log_threshold_user) {
        for (var i = 0; i < content.userLog.length; i++)
            fs.appendFileSync(userLog, content.userLog[i]);
        content.userLog = [];
    }
    client.updateUser(content);
    console.log(`[${content.hidden.guildname.magenta}] =>`, `[${content.hidden.username.magenta}] =>`, content);
}
function awardExperience(client, message) {
    let username = Resources_1.default.getUsernameFromMessage(message);
    let content = client.getUserContent(message.guild, username);
    if (!content) {
        return console.error(`!! Could not retrieve contents from [${username}]`);
    }
    content.rank.xp += 1;
    if (content.rank.xp >= content.rank.levelup) {
        content.rank.level += 1;
        var rank = ranks_1.default.levels[content.rank.level];
        if (rank) {
            var lastRank = content.rank.name;
            content.rank.name = rank;
            let oldRole = message.guild.roles.find(role => role.name.toLowerCase() === lastRank.toLowerCase());
            let newRole = message.guild.roles.find(role => role.name.toLowerCase() === rank.toLowerCase());
            if (oldRole)
                message.member.removeRole(oldRole).catch(err => {
                    console.log(err);
                });
            message.member.addRole(newRole).catch(err => {
                console.log(err);
            });
        }
        content.rank.levelup = Resources_1.default.getXPToLevelUp(content.rank.xp, content.rank.level);
        levelUp(client, message, content);
    }
    client.updateUser(content);
    if (content.rank.xp % client.config.preferences.xp_threshold === 0) {
        let jsonFile = path.join(Resources_1.default.getUserDirectoryFromGuild(message.guild, username), username + ".json");
        let newJson = JSON.stringify(content, null, "\t");
        fs.writeFileSync(jsonFile, newJson);
    }
}
function levelUp(client, message, content) {
    var stats = client.commands.get("stats");
    let embed = stats.getEmbed(client, message.member, content);
    message.channel.send(`Congratulations ${message.author}!  You just leveled up!  Keep chatting to earn more XP and unlock roles and special perks!`);
    message.channel.send(embed);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ldmVudHMvbWVzc2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGtCQUFnQjtBQUdoQix5QkFBeUI7QUFDekIsNkJBQTZCO0FBRTdCLG9EQUF3QztBQUN4QyxzQ0FBK0I7QUFDL0IsMkRBQW9EO0FBQ3BELG9EQUE2QztBQUU3QyxNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsTUFBVyxFQUFFLE9BQWdCLEVBQUUsRUFBRTs7SUFFakQsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUc7UUFBRSxPQUFPO0lBRy9CLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQztRQUNuQyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQ2xCLDBDQUEwQyxtQkFBSSxDQUFDLHNCQUFzQixDQUNuRSxPQUFPLENBQ1IsR0FBRyxDQUFDLEdBQUcsQ0FDVCxDQUFDO0lBR0osSUFBSSxtQkFBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFO1FBQzFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDckQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztLQUNKO0lBRUQsZUFBZSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUdqQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1B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RyxJQUFJLENBQUMsSUFBSSxDQUN0QixtQkFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEVBQ3ZELFFBQVEsR0FBRyxPQUFPLENBQ25CLENBQUM7UUFDRixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEQsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDckM7QUFDSCxDQUFDO0FBRUQsU0FBUyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPO0lBQ3ZDLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFNUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQ2xCLG1CQUFtQixPQUFPLENBQUMsTUFBTSw0RkFBNEYsQ0FDOUgsQ0FBQztJQUNGLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ2NvbG9ycyc7XHJcblxyXG5pbXBvcnQgeyBNZXNzYWdlLCBUZXh0Q2hhbm5lbCB9IGZyb20gJ2Rpc2NvcmQuanMnO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5pbXBvcnQgcnNyYyBmcm9tICcuLi9jbGFzc2VzL1Jlc291cmNlcyc7XHJcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJztcclxuaW1wb3J0IGJsYWNrbGlzdCBmcm9tICcuLi9yZXNvdXJjZXMvbWlzYy9ibGFja2xpc3QnO1xyXG5pbXBvcnQgcmFua3MgZnJvbSAnLi4vcmVzb3VyY2VzL3JhbmtzL3JhbmtzJztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGNsaWVudDogYW55LCBtZXNzYWdlOiBNZXNzYWdlKSA9PiB7XHJcbiAgLy9pZ25vcmUgYWxsIGJvdHNcclxuICBpZiAobWVzc2FnZS5hdXRob3IuYm90KSByZXR1cm47XHJcblxyXG4gIC8vcmVnaXN0ZXIgdGhlIHVzZXJcclxuICBpZiAoIXJlZ2lzdGVyTWVzc2FnZShjbGllbnQsIG1lc3NhZ2UpKVxyXG4gICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgIGAhISBDb3VsZCBub3QgcmVnaXN0ZXIgbWVzc2FnZSBzZW50IGJ5IFske3JzcmMuZ2V0VXNlcm5hbWVGcm9tTWVzc2FnZShcclxuICAgICAgICBtZXNzYWdlXHJcbiAgICAgICl9XWAucmVkXHJcbiAgICApO1xyXG5cclxuICAvL2NoZWNrIGFnYWluc3QgYmxhY2tsaXN0XHJcbiAgaWYgKGJsYWNrbGlzdC53b3Jkcy5zb21lKHN1YnN0cmluZyA9PiBtZXNzYWdlLmNvbnRlbnQuaW5jbHVkZXMoc3Vic3RyaW5nKSkpIHtcclxuICAgIG1lc3NhZ2UuZGVsZXRlKCkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgIH0pO1xyXG4gICAgbWVzc2FnZS5yZXBseShcInRoYXQgaXMgbm90IGFsbG93ZWQgaGVyZS5cIikuY2F0Y2goZXJyID0+IHtcclxuICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgYXdhcmRFeHBlcmllbmNlKGNsaWVudCwgbWVzc2FnZSk7XHJcblxyXG4gIC8vaWdub3JlIG1lc3NhZ2VzIG5vdCBzdGFydGluZyB3aXRoIHRoZSBwcmVmaXhcclxuICBpZiAobWVzc2FnZS5jb250ZW50LmluZGV4T2YoY2xpZW50LmNvbmZpZy5wcmVmaXgpICE9PSAwKSByZXR1cm47XHJcblxyXG4gIC8vc3RhbmRhcmQgYXJndW1lbnQvY29tbWFuZCBuYW1lIGRlZmluaXRpb25cclxuICBjb25zdCBhcmdzOiBhbnkgPSBtZXNzYWdlLmNvbnRlbnRcclxuICAgIC5zbGljZShjbGllbnQuY29uZmlnLnByZWZpeC5sZW5ndGgpXHJcbiAgICAudHJpbSgpXHJcbiAgICAuc3BsaXQoLyArL2cpO1xyXG5cclxuICBsZXQgY29tbWFuZDogYW55O1xyXG4gIGlmIChhcmdzKSBjb21tYW5kID0gYXJncy5zaGlmdCgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgaWYgKCFjb21tYW5kKSByZXR1cm47XHJcblxyXG4gIC8vZ3JhYiB0aGUgY29tbWFuZCBkYXRhIGZyb20gdGhlIGNsaWVudC5jb21tYW5kcyBFbm1hcFxyXG4gIGNvbnN0IGNtZCA9IGNsaWVudC5jb21tYW5kcy5nZXQoY29tbWFuZCk7XHJcblxyXG4gIC8vaWYgdGhlIGNvbW1hbmQgZG9lc24ndCBleGlzdFxyXG4gIGlmICghY21kKSByZXR1cm47XHJcblxyXG4gIGlmIChjbWQucHJvcHMucmVxdWlyZXNFbGV2YXRpb24gJiYgY21kLnByb3BzLnJlcXVpcmVzRWxldmF0aW9uICE9PSBcIlwiKVxyXG4gICAgaWYgKFxyXG4gICAgICAhbWVzc2FnZS5tZW1iZXI/LnJvbGVzLmhhcyhcclxuICAgICAgICBjbGllbnQuY29uZmlnLnJvbGVzW2NtZC5wcm9wcy5yZXF1aXJlc0VsZXZhdGlvbl1cclxuICAgICAgKVxyXG4gICAgKVxyXG4gICAgICByZXR1cm47XHJcblxyXG4gIC8vcnVuIHRoZSBjb21tYW5kXHJcbiAgY21kLnJ1bihjbGllbnQsIG1lc3NhZ2UsIGFyZ3MpO1xyXG59O1xyXG5cclxuLy9yZWdpc3RlcnMgdGhlIG1lc3NhZ2VcclxuZnVuY3Rpb24gcmVnaXN0ZXJNZXNzYWdlKGNsaWVudDogYW55LCBtZXNzYWdlOiBNZXNzYWdlKSB7XHJcbiAgbGV0IHVzZXJuYW1lID0gcnNyYy5nZXRVc2VybmFtZUZyb21NZXNzYWdlKG1lc3NhZ2UpO1xyXG5cclxuICBpZiAoIW1lc3NhZ2UuZ3VpbGQpIHJldHVybjtcclxuXHJcbiAgbGV0IGd1aWxkTmFtZSA9IHJzcmMuZ2V0R3VpbGROYW1lRnJvbUd1aWxkKG1lc3NhZ2UuZ3VpbGQpO1xyXG4gIGxldCB1c2VyRGlyID0gcnNyYy5nZXRVc2VyRGlyZWN0b3J5RnJvbUd1aWxkKG1lc3NhZ2UuZ3VpbGQsIHVzZXJuYW1lKTtcclxuXHJcbiAgbGV0IGNvbnRlbnQ6IGFueTtcclxuXHJcbiAgLy9pZiB0aGUgdXNlciBoYXMgbm90IGJlZW4gcmVnaXN0ZXJlZFxyXG4gIGlmICghZnMuZXhpc3RzU3luYyh1c2VyRGlyKSlcclxuICAgIHJzcmMuY3JlYXRlVXNlckRpcmVjdG9yeShjbGllbnQsIG1lc3NhZ2UuZ3VpbGQsIG1lc3NhZ2UubWVtYmVyISk7XHJcblxyXG4gIC8vdXNlciBOT1Qgc3RvcmVkIGluIGxvY2FsIGNsaWVudCBzZXNzaW9uXHJcbiAgaWYgKCFjbGllbnQuaGFzVXNlcihtZXNzYWdlLmd1aWxkLCB1c2VybmFtZSkpIHtcclxuICAgIGNvbnRlbnQgPSByc3JjLmdldFVzZXJDb250ZW50c0Zyb21OYW1lKGNsaWVudCwgbWVzc2FnZSwgdXNlcm5hbWUpO1xyXG4gICAgY2xpZW50LnJlZ2lzdGVyVXNlcihtZXNzYWdlLm1lbWJlciEudXNlciwgY29udGVudCk7XHJcbiAgICAvL3VzZXIgc3RvcmVkIGluIGxvY2FsIGNsaWVudCBzZXNzaW9uXHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnRlbnQgPSBjbGllbnQuZ2V0VXNlckNvbnRlbnQobWVzc2FnZS5ndWlsZCwgdXNlcm5hbWUpO1xyXG4gIH1cclxuXHJcbiAgaWYgKGNvbnRlbnQgPT09IG51bGwgfHwgdHlwZW9mIGNvbnRlbnQgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoYCEhIENvdWxkIG5vdCByZXRyaWV2ZSBjb250ZW50cyBmb3IgWyR7dXNlcm5hbWV9XWAucmVkKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIGlmIChcclxuICAgIGNvbnRlbnQubWlzYy5maXJzdF9tZXNzYWdlID09PSBudWxsIHx8XHJcbiAgICB0eXBlb2YgY29udGVudC5taXNjLmZpcnN0X21lc3NhZ2UgPT09IFwidW5kZWZpbmVkXCJcclxuICApIHtcclxuICAgIGNvbnRlbnQubWlzYy5maXJzdF9tZXNzYWdlID0gbWVzc2FnZS5jb250ZW50O1xyXG4gICAgY2xpZW50LnVwZGF0ZVVzZXIoY29udGVudCk7XHJcbiAgfVxyXG5cclxuICBsZXQgbG9nTWVzc2FnZSA9IGBbJHtnZXRUaW1lc3RhbXAobWVzc2FnZSl9XSAoIyR7XHJcbiAgICAobWVzc2FnZS5jaGFubmVsIGFzIFRleHRDaGFubmVsKS5uYW1lXHJcbiAgfSk6ICR7bWVzc2FnZS5jb250ZW50fVxcbmA7XHJcblxyXG4gIC8vcHVzaCB0aGUgbWVzc2FnZSB0byB0aGUgbWFzdGVyIGxvZyBicmFuY2hcclxuICBjbGllbnQubWFzdGVyTG9nLnB1c2goYC8ke2d1aWxkTmFtZX0vPiAgJHt1c2VybmFtZX0gJHtsb2dNZXNzYWdlfWApO1xyXG4gIC8vaWYgdGhlIGxvZyBsZW5ndGggZXhjZWVkcyB0aGUgdGhyZXNob2xkLCB1cGRhdGUgdGhlIG1hc3RlciBsb2dcclxuICB1cGRhdGVNYXN0ZXJMb2coY2xpZW50KTtcclxuXHJcbiAgLy9wdXNoIHRoZSB1c2VyJ3MgbWVzc2FnZSBkaXJlY3RseSB0byB0aGUgdXNlcidzIGxvZ1xyXG4gIGNvbnRlbnQudXNlckxvZy5wdXNoKGxvZ01lc3NhZ2UpO1xyXG4gIC8vaWYgdGhlIGxvZyBsZW5ndGggZXhjZWVkcyB0aGUgdGhyZXNob2xkLCB1cGRhdGUgdGhlIHVzZXIgbG9nXHJcbiAgdXBkYXRlVXNlckxvZyhjbGllbnQsIG1lc3NhZ2UuZ3VpbGQsIGNvbnRlbnQpO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0VGltZXN0YW1wKG1lc3NhZ2U6IE1lc3NhZ2UpIHtcclxuICBsZXQgdGltZXN0YW1wID0gbWVzc2FnZS5jcmVhdGVkQXQ7XHJcbiAgbGV0IGRhdGUgPSAodGltZXN0YW1wLmdldE1vbnRoKCkgKyAxICsgXCIvXCIgKyB0aW1lc3RhbXAuZ2V0RGF0ZSgpKS5yZXBsYWNlKFxyXG4gICAgLy4qKFxcZHsyfVxcL1xcZHsyfSkuKi8sXHJcbiAgICBcIiQxXCJcclxuICApO1xyXG4gIGxldCB0aW1lID0gdGltZXN0YW1wLnRvVGltZVN0cmluZygpLnJlcGxhY2UoLy4qKFxcZHsyfTpcXGR7Mn06XFxkezJ9KS4qLywgXCIkMVwiKTtcclxuXHJcbiAgcmV0dXJuIGRhdGUgKyBcIiAgXCIgKyB0aW1lO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVNYXN0ZXJMb2coY2xpZW50KSB7XHJcbiAgbGV0IG1hc3RlckxvZyA9IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi5cIiwgXCJsb2dzXCIpO1xyXG5cclxuICBpZiAoIWZzLmV4aXN0c1N5bmMobWFzdGVyTG9nKSkge1xyXG4gICAgZnMubWtkaXJTeW5jKG1hc3RlckxvZywgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICBmcy53cml0ZUZpbGVTeW5jKFxyXG4gICAgICBwYXRoLnJlc29sdmUobWFzdGVyTG9nLCBjb25maWcuZmlsZXMubG9nX2FsbCksXHJcbiAgICAgIFwiLS0gU1RBUlQgT0YgTE9HIC0tXCJcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvL2lmIHRoZSBsb2cgbGVuZ3RoIGV4Y2VlZHMgdGhlIHRocmVzaG9sZCwgdXBkYXRlIHRoZSBtYXN0ZXIgbG9nXHJcbiAgaWYgKFxyXG4gICAgY2xpZW50Lm1hc3RlckxvZy5sZW5ndGggPj0gY2xpZW50LmNvbmZpZy5wcmVmZXJlbmNlcy5sb2dfdGhyZXNob2xkX21hc3RlclxyXG4gICkge1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbGllbnQubWFzdGVyTG9nLmxlbmd0aDsgaSsrKVxyXG4gICAgICBmcy5hcHBlbmRGaWxlU3luYyhtYXN0ZXJMb2csIGNsaWVudC5tYXN0ZXJMb2dbaV0pO1xyXG5cclxuICAgIGNsaWVudC5tYXN0ZXJMb2cgPSBbXTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZVVzZXJMb2coY2xpZW50LCBndWlsZCwgY29udGVudCkge1xyXG4gIGxldCBsb2dzRGlyID0gcGF0aC5qb2luKFxyXG4gICAgcnNyYy5nZXRVc2VyRGlyZWN0b3J5RnJvbUd1aWxkKGd1aWxkLCBjb250ZW50LmhpZGRlbi51c2VybmFtZSksXHJcbiAgICBcImxvZ3NcIlxyXG4gICk7XHJcbiAgbGV0IHVzZXJMb2cgPSBwYXRoLmpvaW4obG9nc0RpciwgY2xpZW50LmNvbmZpZy5maWxlcy5sb2dfYWxsKTtcclxuXHJcbiAgLy9pZiB0aGUgbG9nIGxlbmd0aCBleGNlZWRzIHRoZSB0aHJlc2hvbGQsIHVwZGF0ZSB0aGUgbWFzdGVyIGxvZ1xyXG4gIGlmIChjb250ZW50LnVzZXJMb2cubGVuZ3RoID49IGNsaWVudC5jb25maWcucHJlZmVyZW5jZXMubG9nX3RocmVzaG9sZF91c2VyKSB7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRlbnQudXNlckxvZy5sZW5ndGg7IGkrKylcclxuICAgICAgZnMuYXBwZW5kRmlsZVN5bmModXNlckxvZywgY29udGVudC51c2VyTG9nW2ldKTtcclxuXHJcbiAgICBjb250ZW50LnVzZXJMb2cgPSBbXTtcclxuICB9XHJcblxyXG4gIC8vaGF2ZSB0byB1cGRhdGUgdGhlIEVubWFwXHJcbiAgY2xpZW50LnVwZGF0ZVVzZXIoY29udGVudCk7XHJcblxyXG4gIC8vbG9nIGl0IHRvIHRoZSBjb25zb2xlXHJcbiAgY29uc29sZS5sb2coXHJcbiAgICBgWyR7Y29udGVudC5oaWRkZW4uZ3VpbGRuYW1lLm1hZ2VudGF9XSA9PmAsXHJcbiAgICBgWyR7Y29udGVudC5oaWRkZW4udXNlcm5hbWUubWFnZW50YX1dID0+YCxcclxuICAgIGNvbnRlbnRcclxuICApO1xyXG59XHJcblxyXG4vL2F3YXJkcyB0aGUgdXNlciBleHBlcmllbmNlIGZvciBwb3N0aW5nIGEgbWVzc2FnZVxyXG5mdW5jdGlvbiBhd2FyZEV4cGVyaWVuY2UoY2xpZW50LCBtZXNzYWdlKSB7XHJcbiAgbGV0IHVzZXJuYW1lID0gcnNyYy5nZXRVc2VybmFtZUZyb21NZXNzYWdlKG1lc3NhZ2UpO1xyXG5cclxuICAvL2dldCB0aGUgY29udGVudCBmcm9tIHRoZSBzZXNzaW9uIGluc3RlYWQgb2YgZnJvbSB0aGUgZmlsZVxyXG4gIGxldCBjb250ZW50ID0gY2xpZW50LmdldFVzZXJDb250ZW50KG1lc3NhZ2UuZ3VpbGQsIHVzZXJuYW1lKTtcclxuXHJcbiAgaWYgKCFjb250ZW50KSB7XHJcbiAgICByZXR1cm4gY29uc29sZS5lcnJvcihgISEgQ291bGQgbm90IHJldHJpZXZlIGNvbnRlbnRzIGZyb20gWyR7dXNlcm5hbWV9XWApO1xyXG4gIH1cclxuXHJcbiAgY29udGVudC5yYW5rLnhwICs9IDE7XHJcblxyXG4gIGlmIChjb250ZW50LnJhbmsueHAgPj0gY29udGVudC5yYW5rLmxldmVsdXApIHtcclxuICAgIGNvbnRlbnQucmFuay5sZXZlbCArPSAxO1xyXG5cclxuICAgIHZhciByYW5rID0gcmFua3MubGV2ZWxzW2NvbnRlbnQucmFuay5sZXZlbF07XHJcbiAgICBpZiAocmFuaykge1xyXG4gICAgICB2YXIgbGFzdFJhbmsgPSBjb250ZW50LnJhbmsubmFtZTtcclxuXHJcbiAgICAgIGNvbnRlbnQucmFuay5uYW1lID0gcmFuaztcclxuICAgICAgbGV0IG9sZFJvbGUgPSBtZXNzYWdlLmd1aWxkLnJvbGVzLmZpbmQoXHJcbiAgICAgICAgcm9sZSA9PiByb2xlLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbGFzdFJhbmsudG9Mb3dlckNhc2UoKVxyXG4gICAgICApO1xyXG4gICAgICBsZXQgbmV3Um9sZSA9IG1lc3NhZ2UuZ3VpbGQucm9sZXMuZmluZChcclxuICAgICAgICByb2xlID0+IHJvbGUubmFtZS50b0xvd2VyQ2FzZSgpID09PSByYW5rLnRvTG93ZXJDYXNlKClcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChvbGRSb2xlKVxyXG4gICAgICAgIG1lc3NhZ2UubWVtYmVyLnJlbW92ZVJvbGUob2xkUm9sZSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICBtZXNzYWdlLm1lbWJlci5hZGRSb2xlKG5ld1JvbGUpLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGVudC5yYW5rLmxldmVsdXAgPSByc3JjLmdldFhQVG9MZXZlbFVwKFxyXG4gICAgICBjb250ZW50LnJhbmsueHAsXHJcbiAgICAgIGNvbnRlbnQucmFuay5sZXZlbFxyXG4gICAgKTtcclxuICAgIGxldmVsVXAoY2xpZW50LCBtZXNzYWdlLCBjb250ZW50KTtcclxuICB9XHJcblxyXG4gIGNsaWVudC51cGRhdGVVc2VyKGNvbnRlbnQpO1xyXG5cclxuICAvL29ubHkgd3JpdGUgWFAgY2hhbmdlcyB0byB0aGUgZmlsZSBldmVyeSAxMCBtZXNzYWdlc1xyXG4gIGlmIChjb250ZW50LnJhbmsueHAgJSBjbGllbnQuY29uZmlnLnByZWZlcmVuY2VzLnhwX3RocmVzaG9sZCA9PT0gMCkge1xyXG4gICAgbGV0IGpzb25GaWxlID0gcGF0aC5qb2luKFxyXG4gICAgICByc3JjLmdldFVzZXJEaXJlY3RvcnlGcm9tR3VpbGQobWVzc2FnZS5ndWlsZCwgdXNlcm5hbWUpLFxyXG4gICAgICB1c2VybmFtZSArIFwiLmpzb25cIlxyXG4gICAgKTtcclxuICAgIGxldCBuZXdKc29uID0gSlNPTi5zdHJpbmdpZnkoY29udGVudCwgbnVsbCwgXCJcXHRcIik7XHJcbiAgICBmcy53cml0ZUZpbGVTeW5jKGpzb25GaWxlLCBuZXdKc29uKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxldmVsVXAoY2xpZW50LCBtZXNzYWdlLCBjb250ZW50KSB7XHJcbiAgdmFyIHN0YXRzID0gY2xpZW50LmNvbW1hbmRzLmdldChcInN0YXRzXCIpO1xyXG4gIGxldCBlbWJlZCA9IHN0YXRzLmdldEVtYmVkKGNsaWVudCwgbWVzc2FnZS5tZW1iZXIsIGNvbnRlbnQpO1xyXG5cclxuICBtZXNzYWdlLmNoYW5uZWwuc2VuZChcclxuICAgIGBDb25ncmF0dWxhdGlvbnMgJHttZXNzYWdlLmF1dGhvcn0hICBZb3UganVzdCBsZXZlbGVkIHVwISAgS2VlcCBjaGF0dGluZyB0byBlYXJuIG1vcmUgWFAgYW5kIHVubG9jayByb2xlcyBhbmQgc3BlY2lhbCBwZXJrcyFgXHJcbiAgKTtcclxuICBtZXNzYWdlLmNoYW5uZWwuc2VuZChlbWJlZCk7XHJcbn1cclxuIl19