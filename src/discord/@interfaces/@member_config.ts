export interface MemberConfigType {
  hidden: {
    [key: string]: string;
    username: string | null;
    guildname: string | null;
  };

  rank: {
    [key: string]: string | number;
    name: string;
    rankup: number;
    level: number;
    xp: number;
    levelup: number;
  };

  misc: {
    [key: string]: string | number;
    joined: string | null;
    first_message: string | null;
    warnings: number;
  };

  race: {
    [key: string]: number;
    wins: number;
  };

  permissions: {
    [key: string]: boolean;
  };

  memberLog: Array<string>;
}
