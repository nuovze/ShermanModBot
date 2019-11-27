"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("colors");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const ranks_1 = require("../resources/ranks");
const user_config_1 = require("../resources/user_config");
class Resources {
  static getUsernameFromMessage(message) {
    let username;
    if (message.member) username = message.member.user.tag.replace("#", "_");
    else return null;
    username = username.replace(/[^\w\s]/gi, "").toLowerCase();
    return username;
  }
  static getUsernameFromMember(member) {
    let username = member.user ? member.user.tag : member.tag;
    username = username
      .replace("#", "_")
      .replace(/[^\w\s]/gi, "")
      .toLowerCase();
    return username;
  }
  static getUserDirectoryFromGuild(guild, username) {
    return path.join(this.getGuildDirectoryFromGuild(guild), username);
  }
  static getUserContentsFromName(client, message, username, search = false) {
    console.log("username", username);
    return Resources.getUserContentsFromNameWithGuild(client, message.guild, message, username, search);
  }
  static getUserContentsFromNameWithGuild(client, guild, message, username, search = false) {
    if (!guild) guild = message.guild;
    console.log("username", username);
    username = username.trim().toLowerCase();
    let jsonFile = path.join(this.getGuildDirectoryFromGuild(guild), username, username + ".json");
    if (!fs.existsSync(jsonFile)) {
      if (!search) return null;
      let possibleMatches = [];
      let users = this.getGuildUsersFromGuild(client, guild);
      for (let guildUserUsername in Object.keys(users)) if (guildUserUsername.includes(username)) possibleMatches.push(guildUserUsername);
      if (possibleMatches.length > 1) {
        let listOfUsers = "";
        for (var i = 0; i < possibleMatches.length; i++) listOfUsers += `${i + 1}) ${possibleMatches[i]}`;
        message.reply(`there are multiple users which contain [${username}], please select the correct one:\n${listOfUsers}`).then(() => {
          message.channel
            .awaitMessages(response => response.author === message.author, {
              max: 1,
              time: 1000 * 60,
              errors: ["time"]
            })
            .then(collected => {
              let answer = parseInt(collected.first().content);
              if (answer < 1 || answer > possibleMatches.length) {
                message.reply("you did not enter a valid number, no user has been selected");
                return;
              }
              username = possibleMatches[answer - 1];
              jsonFile = path.join(this.getGuildDirectoryFromGuild(guild), username, username + ".json");
            })
            .catch(() => {
              message.reply("you did not respond in time, no user has been selected");
              return null;
            });
        });
      }
    }
    let json = fs.readFileSync(jsonFile);
    let content = JSON.parse(json.toString());
    return content;
  }
  static getGuildNameFromGuild(guild) {
    let guildName = guild.name.replace(/[\W\s]/gi, "_");
    return `${guildName}-(${guild.id})`;
  }
  static getGuildDirectoryFromGuild(guild) {
    return path.join(__dirname, "..", "users", this.getGuildNameFromGuild(guild));
  }
  static getGuildDirectoryFromName(guildname) {
    return path.join(__dirname, "..", "users", guildname);
  }
  static getGuildUsersFromGuild(client, guild) {
    let entries = Object.entries(client.usersInSession);
    for (const [guildname, users] of entries) if (guildname == this.getGuildNameFromGuild(guild)) return users;
    return null;
  }
  static createUserDirectory(client, guild, member) {
    let content = user_config_1.default;
    content.hidden.username = this.getUsernameFromMember(member);
    content.hidden.guildname = this.getGuildNameFromGuild(guild);
    let date = member.joinedAt;
    let joinedAt = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    content.misc.joined = joinedAt;
    let dir = this.getUserDirectoryFromGuild(guild, content.hidden.username);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/${content.hidden.username}.json`, JSON.stringify(content, null, "\t"));
    fs.mkdirSync(`${dir}/logs`, { recursive: true });
    let rolesUserHas = member.roles;
    let rankRolesUserHas = [];
    if (rolesUserHas.size != 0) {
      let entries = Object.entries(ranks_1.default._info);
      for (var i = 0; i < entries.length; i++) {
        let rank = entries[i][0].toLowerCase();
        let role = member.roles.find(role => role.name.toLowerCase() === rank);
        if (role) {
          rankRolesUserHas.push(role);
          content.rank.name = rank;
          content.rank.xp = ranks_1.default._info[rank];
          for (var level in ranks_1.default.levels) {
            if (ranks_1.default.levels[level].toLowerCase() === rank) {
              content.rank.level = parseInt(level);
              content.rank.levelup = this.getXPToLevelUp(content.rank.xp, content.rank.level);
              break;
            }
          }
        }
      }
    }
    rankRolesUserHas.splice(-1, 1);
    rankRolesUserHas.forEach(role => {
      member.roles.remove(role).catch(err => {
        console.log(err);
      });
    });
    client.registerUser(content);
    return content;
  }
  static destroyUserDirectory(guild, username) {
    let source = this.getUserDirectoryFromGuild(guild, username);
    rimraf(source, err => {
      if (err) console.log(err);
    });
  }
  static writeUserContentToFile(client, username, content) {
    Object.defineProperty(content, "hidden", {
      enumerable: true
    });
    let dir = path.join(this.getGuildDirectoryFromName(content.hidden.guildname), username);
    if (!fs.existsSync(dir)) return console.error(`!! Attempted to write [${username}] contents to log, but no directory exists at [${dir}]`.red);
    if (content.userLog && content.userLog.length != 0) {
      for (var i = 0; i < content.userLog.length; i++) fs.appendFileSync(`${dir}/logs/${client.config.files.log_all}`, content.userLog[i]);
      content.userLog = [];
    }
    fs.writeFileSync(`${dir}/${username}.json`, JSON.stringify(content, null, "\t"));
  }
  static getXPToLevelUp(xp, level) {
    return xp + Math.round((4 * Math.pow(level, 3)) / 5);
  }
}
exports.default = Resources;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVzb3VyY2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsYXNzZXMvUmVzb3VyY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsa0JBQWdCO0FBR2hCLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsaUNBQWlDO0FBRWpDLDhDQUF1QztBQUN2QywwREFBMkM7QUFFM0MsTUFBcUIsU0FBUztJQUM1QixNQUFNLENBQUMsc0JBQXNCLENBQUMsT0FBZ0I7UUFDNUMsSUFBSSxRQUFnQixDQUFDO1FBQ3JCLElBQUcsT0FBTyxDQUFDLE1BQU07WUFDZixRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7O1lBQ2xELE9BQU8sSUFBSSxDQUFDO1FBRWpCLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUUzRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRUQsTUFBTSxDQUFDLHFCQUFxQixDQUFDLE1BQVc7UUFDdEMsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDMUQsUUFBUSxHQUFHLFFBQVE7YUFDaEIsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7YUFDakIsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7YUFDeEIsV0FBVyxFQUFFLENBQUM7UUFFakIsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVELE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxLQUFZLEVBQUUsUUFBZ0I7UUFDN0QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FB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b250ZW50IjpbImltcG9ydCAnY29sb3JzJztcclxuXHJcbmltcG9ydCB7IEd1aWxkLCBHdWlsZE1lbWJlciwgTWVzc2FnZSwgUm9sZSB9IGZyb20gJ2Rpc2NvcmQuanMnO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCAqIGFzIHJpbXJhZiBmcm9tICdyaW1yYWYnO1xyXG5cclxuaW1wb3J0IHJhbmtzIGZyb20gJy4uL3Jlc291cmNlcy9yYW5rcyc7XHJcbmltcG9ydCBkZWYgZnJvbSAnLi4vcmVzb3VyY2VzL3VzZXJfY29uZmlnJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlc291cmNlcyB7XHJcbiAgc3RhdGljIGdldFVzZXJuYW1lRnJvbU1lc3NhZ2UobWVzc2FnZTogTWVzc2FnZSk6IGFueSB7XHJcbiAgICBsZXQgdXNlcm5hbWU6IHN0cmluZztcclxuICAgIGlmKG1lc3NhZ2UubWVtYmVyKVxyXG4gICAgICB1c2VybmFtZSA9IG1lc3NhZ2UubWVtYmVyLnVzZXIudGFnLnJlcGxhY2UoXCIjXCIsIFwiX1wiKTtcclxuICAgIGVsc2UgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgdXNlcm5hbWUgPSB1c2VybmFtZS5yZXBsYWNlKC9bXlxcd1xcc10vZ2ksIFwiXCIpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgcmV0dXJuIHVzZXJuYW1lO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGdldFVzZXJuYW1lRnJvbU1lbWJlcihtZW1iZXI6IGFueSk6IHN0cmluZyB7XHJcbiAgICBsZXQgdXNlcm5hbWUgPSBtZW1iZXIudXNlciA/IG1lbWJlci51c2VyLnRhZyA6IG1lbWJlci50YWc7XHJcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lXHJcbiAgICAgIC5yZXBsYWNlKFwiI1wiLCBcIl9cIilcclxuICAgICAgLnJlcGxhY2UoL1teXFx3XFxzXS9naSwgXCJcIilcclxuICAgICAgLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgcmV0dXJuIHVzZXJuYW1lO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGdldFVzZXJEaXJlY3RvcnlGcm9tR3VpbGQoZ3VpbGQ6IEd1aWxkLCB1c2VybmFtZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBwYXRoLmpvaW4odGhpcy5nZXRHdWlsZERpcmVjdG9yeUZyb21HdWlsZChndWlsZCksIHVzZXJuYW1lKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBnZXRVc2VyQ29udGVudHNGcm9tTmFtZShcclxuICAgIGNsaWVudDogYW55LFxyXG4gICAgbWVzc2FnZTogTWVzc2FnZSxcclxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXHJcbiAgICBzZWFyY2g6IGJvb2xlYW4gPSBmYWxzZVxyXG4gICk6IGFueSB7XHJcbiAgICBjb25zb2xlLmxvZyhcInVzZXJuYW1lXCIsIHVzZXJuYW1lKTtcclxuXHJcbiAgICByZXR1cm4gUmVzb3VyY2VzLmdldFVzZXJDb250ZW50c0Zyb21OYW1lV2l0aEd1aWxkKFxyXG4gICAgICBjbGllbnQsXHJcbiAgICAgIG1lc3NhZ2UuZ3VpbGQgYXMgR3VpbGQsXHJcbiAgICAgIG1lc3NhZ2UsXHJcbiAgICAgIHVzZXJuYW1lLFxyXG4gICAgICBzZWFyY2hcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZ2V0VXNlckNvbnRlbnRzRnJvbU5hbWVXaXRoR3VpbGQoXHJcbiAgICBjbGllbnQ6IGFueSxcclxuICAgIGd1aWxkOiBHdWlsZCxcclxuICAgIG1lc3NhZ2U6IE1lc3NhZ2UsXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgc2VhcmNoOiBib29sZWFuID0gZmFsc2VcclxuICApOiBhbnkge1xyXG4gICAgaWYgKCFndWlsZCkgZ3VpbGQgPSBtZXNzYWdlLmd1aWxkIGFzIEd1aWxkO1xyXG4gICAgY29uc29sZS5sb2coXCJ1c2VybmFtZVwiLCB1c2VybmFtZSk7XHJcblxyXG4gICAgdXNlcm5hbWUgPSB1c2VybmFtZS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICBsZXQganNvbkZpbGUgPSBwYXRoLmpvaW4oXHJcbiAgICAgIHRoaXMuZ2V0R3VpbGREaXJlY3RvcnlGcm9tR3VpbGQoZ3VpbGQpLFxyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgdXNlcm5hbWUgKyBcIi5qc29uXCJcclxuICAgICk7XHJcblxyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGpzb25GaWxlKSkge1xyXG4gICAgICBpZiAoIXNlYXJjaCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICBsZXQgcG9zc2libGVNYXRjaGVzOiBzdHJpbmdbXSA9IFtdO1xyXG5cclxuICAgICAgbGV0IHVzZXJzID0gdGhpcy5nZXRHdWlsZFVzZXJzRnJvbUd1aWxkKGNsaWVudCwgZ3VpbGQpO1xyXG4gICAgICBmb3IgKGxldCBndWlsZFVzZXJVc2VybmFtZSBpbiBPYmplY3Qua2V5cyh1c2VycykpXHJcbiAgICAgICAgaWYgKGd1aWxkVXNlclVzZXJuYW1lLmluY2x1ZGVzKHVzZXJuYW1lKSlcclxuICAgICAgICAgIHBvc3NpYmxlTWF0Y2hlcy5wdXNoKGd1aWxkVXNlclVzZXJuYW1lKTtcclxuXHJcbiAgICAgIGlmIChwb3NzaWJsZU1hdGNoZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIGxldCBsaXN0T2ZVc2VycyA9IFwiXCI7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb3NzaWJsZU1hdGNoZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICBsaXN0T2ZVc2VycyArPSBgJHtpICsgMX0pICR7cG9zc2libGVNYXRjaGVzW2ldfWA7XHJcblxyXG4gICAgICAgIG1lc3NhZ2VcclxuICAgICAgICAgIC5yZXBseShcclxuICAgICAgICAgICAgYHRoZXJlIGFyZSBtdWx0aXBsZSB1c2VycyB3aGljaCBjb250YWluIFske3VzZXJuYW1lfV0sIHBsZWFzZSBzZWxlY3QgdGhlIGNvcnJlY3Qgb25lOlxcbiR7bGlzdE9mVXNlcnN9YFxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBtZXNzYWdlLmNoYW5uZWxcclxuICAgICAgICAgICAgICAuYXdhaXRNZXNzYWdlcyhcclxuICAgICAgICAgICAgICAgIChyZXNwb25zZTogYW55KSA9PiByZXNwb25zZS5hdXRob3IgPT09IG1lc3NhZ2UuYXV0aG9yLFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICBtYXg6IDEsXHJcbiAgICAgICAgICAgICAgICAgIHRpbWU6IDEwMDAgKiA2MCxcclxuICAgICAgICAgICAgICAgICAgZXJyb3JzOiBbXCJ0aW1lXCJdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgIC50aGVuKChjb2xsZWN0ZWQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGFuc3dlciA9IHBhcnNlSW50KGNvbGxlY3RlZC5maXJzdCgpLmNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFuc3dlciA8IDEgfHwgYW5zd2VyID4gcG9zc2libGVNYXRjaGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlLnJlcGx5KFxyXG4gICAgICAgICAgICAgICAgICAgIFwieW91IGRpZCBub3QgZW50ZXIgYSB2YWxpZCBudW1iZXIsIG5vIHVzZXIgaGFzIGJlZW4gc2VsZWN0ZWRcIlxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdXNlcm5hbWUgPSBwb3NzaWJsZU1hdGNoZXNbYW5zd2VyIC0gMV07XHJcbiAgICAgICAgICAgICAgICBqc29uRmlsZSA9IHBhdGguam9pbihcclxuICAgICAgICAgICAgICAgICAgdGhpcy5nZXRHdWlsZERpcmVjdG9yeUZyb21HdWlsZChndWlsZCksXHJcbiAgICAgICAgICAgICAgICAgIHVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgICB1c2VybmFtZSArIFwiLmpzb25cIlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgIC5jYXRjaCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlLnJlcGx5KFxyXG4gICAgICAgICAgICAgICAgICBcInlvdSBkaWQgbm90IHJlc3BvbmQgaW4gdGltZSwgbm8gdXNlciBoYXMgYmVlbiBzZWxlY3RlZFwiXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCBqc29uID0gZnMucmVhZEZpbGVTeW5jKGpzb25GaWxlKTtcclxuICAgIGxldCBjb250ZW50ID0gSlNPTi5wYXJzZShqc29uLnRvU3RyaW5nKCkpO1xyXG5cclxuICAgIHJldHVybiBjb250ZW50O1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGdldEd1aWxkTmFtZUZyb21HdWlsZChndWlsZDogR3VpbGQpOiBzdHJpbmcge1xyXG4gICAgbGV0IGd1aWxkTmFtZSA9IGd1aWxkLm5hbWUucmVwbGFjZSgvW1xcV1xcc10vZ2ksIFwiX1wiKTtcclxuICAgIHJldHVybiBgJHtndWlsZE5hbWV9LSgke2d1aWxkLmlkfSlgO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGdldEd1aWxkRGlyZWN0b3J5RnJvbUd1aWxkKGd1aWxkOiBHdWlsZCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gcGF0aC5qb2luKFxyXG4gICAgICBfX2Rpcm5hbWUsXHJcbiAgICAgIFwiLi5cIixcclxuICAgICAgXCJ1c2Vyc1wiLFxyXG4gICAgICB0aGlzLmdldEd1aWxkTmFtZUZyb21HdWlsZChndWlsZClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZ2V0R3VpbGREaXJlY3RvcnlGcm9tTmFtZShndWlsZG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLlwiLCBcInVzZXJzXCIsIGd1aWxkbmFtZSk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZ2V0R3VpbGRVc2Vyc0Zyb21HdWlsZChjbGllbnQ6IGFueSwgZ3VpbGQ6IGFueSk6IGFueSB7XHJcbiAgICBsZXQgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKGNsaWVudC51c2Vyc0luU2Vzc2lvbik7XHJcblxyXG4gICAgZm9yIChjb25zdCBbZ3VpbGRuYW1lLCB1c2Vyc10gb2YgZW50cmllcylcclxuICAgICAgaWYgKGd1aWxkbmFtZSA9PSB0aGlzLmdldEd1aWxkTmFtZUZyb21HdWlsZChndWlsZCkpIHJldHVybiB1c2VycztcclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8vY3JlYXRlcyB0aGUgdXNlciBkaXJlY3RvcnlcclxuICBzdGF0aWMgY3JlYXRlVXNlckRpcmVjdG9yeShjbGllbnQ6IGFueSwgZ3VpbGQ6IEd1aWxkLCBtZW1iZXI6IEd1aWxkTWVtYmVyKTogYW55IHtcclxuICAgIGxldCBjb250ZW50OiBhbnkgPSBkZWY7XHJcblxyXG4gICAgY29udGVudC5oaWRkZW4udXNlcm5hbWUgPSB0aGlzLmdldFVzZXJuYW1lRnJvbU1lbWJlcihtZW1iZXIpO1xyXG4gICAgY29udGVudC5oaWRkZW4uZ3VpbGRuYW1lID0gdGhpcy5nZXRHdWlsZE5hbWVGcm9tR3VpbGQoZ3VpbGQpO1xyXG5cclxuICAgIGxldCBkYXRlID0gbWVtYmVyLmpvaW5lZEF0O1xyXG4gICAgbGV0IGpvaW5lZEF0ID0gYCR7ZGF0ZSEuZ2V0TW9udGgoKSArXHJcbiAgICAgIDF9LyR7ZGF0ZSEuZ2V0RGF0ZSgpfS8ke2RhdGUhLmdldEZ1bGxZZWFyKCl9YDtcclxuICAgIGNvbnRlbnQubWlzYy5qb2luZWQgPSBqb2luZWRBdDtcclxuXHJcbiAgICBsZXQgZGlyID0gdGhpcy5nZXRVc2VyRGlyZWN0b3J5RnJvbUd1aWxkKGd1aWxkLCBjb250ZW50LmhpZGRlbi51c2VybmFtZSk7XHJcblxyXG4gICAgZnMubWtkaXJTeW5jKGRpciwge3JlY3Vyc2l2ZTogdHJ1ZX0pO1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyhcclxuICAgICAgYCR7ZGlyfS8ke2NvbnRlbnQuaGlkZGVuLnVzZXJuYW1lfS5qc29uYCxcclxuICAgICAgSlNPTi5zdHJpbmdpZnkoY29udGVudCwgbnVsbCwgXCJcXHRcIilcclxuICAgICk7XHJcbiAgICBmcy5ta2RpclN5bmMoYCR7ZGlyfS9sb2dzYCwge3JlY3Vyc2l2ZTogdHJ1ZX0pO1xyXG5cclxuICAgIGxldCByb2xlc1VzZXJIYXMgPSBtZW1iZXIucm9sZXM7XHJcbiAgICBsZXQgcmFua1JvbGVzVXNlckhhczogUm9sZVtdID0gW107XHJcblxyXG4gICAgLy9pZiB0aGUgdXNlciBhbHJlYWR5IGhhcyBwcmUtZXhpc3Rpbmcgcm9sZXNcclxuICAgIGlmIChyb2xlc1VzZXJIYXMuc2l6ZSAhPSAwKSB7XHJcbiAgICAgIGxldCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMocmFua3MuX2luZm8pO1xyXG5cclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyaWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgbGV0IHJhbmsgPSBlbnRyaWVzW2ldWzBdLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgbGV0IHJvbGUgPSBtZW1iZXIucm9sZXMuZmluZChyb2xlID0+IHJvbGUubmFtZS50b0xvd2VyQ2FzZSgpID09PSByYW5rKTtcclxuXHJcbiAgICAgICAgaWYgKHJvbGUpIHtcclxuICAgICAgICAgIHJhbmtSb2xlc1VzZXJIYXMucHVzaChyb2xlKTtcclxuXHJcbiAgICAgICAgICBjb250ZW50LnJhbmsubmFtZSA9IHJhbms7XHJcbiAgICAgICAgICBjb250ZW50LnJhbmsueHAgPSByYW5rcy5faW5mb1tyYW5rXTtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBsZXZlbCBpbiByYW5rcy5sZXZlbHMpIHtcclxuICAgICAgICAgICAgaWYgKHJhbmtzLmxldmVsc1tsZXZlbF0udG9Mb3dlckNhc2UoKSA9PT0gcmFuaykge1xyXG4gICAgICAgICAgICAgIGNvbnRlbnQucmFuay5sZXZlbCA9IHBhcnNlSW50KGxldmVsKTtcclxuICAgICAgICAgICAgICBjb250ZW50LnJhbmsubGV2ZWx1cCA9IHRoaXMuZ2V0WFBUb0xldmVsVXAoXHJcbiAgICAgICAgICAgICAgICBjb250ZW50LnJhbmsueHAsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50LnJhbmsubGV2ZWxcclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJhbmtSb2xlc1VzZXJIYXMuc3BsaWNlKC0xLCAxKTtcclxuICAgIHJhbmtSb2xlc1VzZXJIYXMuZm9yRWFjaChyb2xlID0+IHtcclxuICAgICAgbWVtYmVyLnJvbGVzLnJlbW92ZShyb2xlKS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY2xpZW50LnJlZ2lzdGVyVXNlcihjb250ZW50KTtcclxuXHJcbiAgICByZXR1cm4gY29udGVudDtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBkZXN0cm95VXNlckRpcmVjdG9yeShndWlsZDogR3VpbGQsIHVzZXJuYW1lOiBzdHJpbmcpIHtcclxuICAgIGxldCBzb3VyY2UgPSB0aGlzLmdldFVzZXJEaXJlY3RvcnlGcm9tR3VpbGQoZ3VpbGQsIHVzZXJuYW1lKTtcclxuICAgIHJpbXJhZihzb3VyY2UsIGVyciA9PiB7XHJcbiAgICAgIGlmIChlcnIpIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyB3cml0ZVVzZXJDb250ZW50VG9GaWxlKGNsaWVudDogYW55LCB1c2VybmFtZTogc3RyaW5nLCBjb250ZW50OiBhbnkpIHtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb250ZW50LCBcImhpZGRlblwiLCB7XHJcbiAgICAgIGVudW1lcmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIGxldCBkaXIgPSBwYXRoLmpvaW4oXHJcbiAgICAgIHRoaXMuZ2V0R3VpbGREaXJlY3RvcnlGcm9tTmFtZShjb250ZW50LmhpZGRlbi5ndWlsZG5hbWUpLFxyXG4gICAgICB1c2VybmFtZVxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSlcclxuICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgYCEhIEF0dGVtcHRlZCB0byB3cml0ZSBbJHt1c2VybmFtZX1dIGNvbnRlbnRzIHRvIGxvZywgYnV0IG5vIGRpcmVjdG9yeSBleGlzdHMgYXQgWyR7ZGlyfV1gXHJcbiAgICAgICAgICAucmVkXHJcbiAgICAgICk7XHJcblxyXG4gICAgaWYgKGNvbnRlbnQudXNlckxvZyAmJiBjb250ZW50LnVzZXJMb2cubGVuZ3RoICE9IDApIHtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250ZW50LnVzZXJMb2cubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgZnMuYXBwZW5kRmlsZVN5bmMoXHJcbiAgICAgICAgICBgJHtkaXJ9L2xvZ3MvJHtjbGllbnQuY29uZmlnLmZpbGVzLmxvZ19hbGx9YCxcclxuICAgICAgICAgIGNvbnRlbnQudXNlckxvZ1tpXVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICBjb250ZW50LnVzZXJMb2cgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBmcy53cml0ZUZpbGVTeW5jKFxyXG4gICAgICBgJHtkaXJ9LyR7dXNlcm5hbWV9Lmpzb25gLFxyXG4gICAgICBKU09OLnN0cmluZ2lmeShjb250ZW50LCBudWxsLCBcIlxcdFwiKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBnZXRYUFRvTGV2ZWxVcCh4cDogbnVtYmVyLCBsZXZlbDogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB4cCArIE1hdGgucm91bmQoKDQgKiBNYXRoLnBvdyhsZXZlbCwgMykpIC8gNSk7XHJcbiAgfVxyXG59Il19
