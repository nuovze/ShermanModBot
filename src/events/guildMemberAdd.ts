import { GuildMember, Role, TextChannel } from 'discord.js';

import rsrc from '../classes/Resources';

module.exports = (client: any, member: GuildMember) => {
  const guild = member.guild;
  const defaultChannel = guild.channels.find(
    channel => channel.name === "welcome"
  );

  if (
    !((defaultChannel): defaultChannel is TextChannel =>
      defaultChannel.type === "text")(defaultChannel)
  )
    return;

  let unrankedRole: any = guild.roles.get("609248072706424863");
  if (unrankedRole) unrankedRole = unrankedRole as Role;

  member.addRole(unrankedRole).catch(err => {
    console.log(err);
  });

  let serverRules = guild.channels.get(
    client.config.channels.shermanzeros_hangout.server_rules
  );
  let serverInfo = guild.channels.get(
    client.config.channels.shermanzeros_hangout.server_information
  );
  let autoRoles = guild.channels.get(
    client.config.channels.shermanzeros_hangout.auto_roles
  );

  defaultChannel
    .send(
      `Welcome ${member.user} to **${guild.name}**!  You are member **#${guild.memberCount}!  Check out the ${serverRules} and ${serverInfo} regarding the different channels.  **Please change your nickname to match your Twitch account name, and link your Twitch and Discord together.**  Be sure to assign yourself some roles over in ${autoRoles}, based on what you want to see!  Get to know everyone, have a great time, and thanks for joining!`
    )
    .catch(err => {
      console.log(err);
    });

  rsrc.createUserDirectory(client, member.guild, member);
};