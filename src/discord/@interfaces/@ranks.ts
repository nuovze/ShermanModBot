export class Ranks {
  static readonly levels: indexer = {
    "0": "unranked",
    "5": "bronze",
    "10": "silver",
    "15": "gold",
    "20": "platinum",
    "25": "diamond",
    "30": "masters",
    "35": "grandmaster"
  };

  static readonly urls: indexer = {
    bronze: "https://i.ibb.co/Bt7v30V/01-bronze.png",
    silver: "https://i.ibb.co/k49yxwb/02-silver.png",
    gold: "https://i.ibb.co/k5PhGLv/03-gold.png",
    platinum: "https://i.ibb.co/T2PFwyt/04-plat.png",
    diamond: "https://i.ibb.co/hRnvbWh/05-diamond.png",
    masters: "https://i.ibb.co/zfHh6Fh/06-masters.png",
    grandmaster: "https://i.ibb.co/8g04NTS/07-grandmaster.png"
  };

  static readonly info: indexer = {
    unranked: 0,
    bronze: 180,
    silver: 2420,
    gold: 11520,
    platinum: 35280,
    diamond: 84500,
    masters: 172980,
    grandmaster: 317520
  };
}

type indexer = { readonly [value in keyof any]: any[value] };
