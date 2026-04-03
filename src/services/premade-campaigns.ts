import type { CampaignBase } from '../types';

export interface PremadeCampaign {
  name: string;
  description: string;
  base: CampaignBase;
}

export const premadeCampaigns: PremadeCampaign[] = [
  {
    name: "The Lost Mines of Ashenvale",
    description: "A classic dungeon crawl through ancient dwarven mines overrun by goblins and darker forces.",
    base: {
      worldDescription: "The Sword Coast region, where the frontier town of Phandalin sits near the long-lost Wave Echo Cave. Ancient dwarven and gnomish mines honeycomb the hills, and bandits, goblins, and worse lurk in the wilderness.",
      startingScenario: "The party has been hired to escort a wagon of supplies to Phandalin. Along the trail, they discover signs of an ambush — dead horses and goblin tracks leading into the forest.",
      mainConflict: "A mysterious figure known as the Black Spider seeks to control the Forge of Spells hidden deep within Wave Echo Cave, and will stop at nothing to eliminate anyone who gets in the way.",
      tone: "Classic heroic fantasy with exploration, combat, and mystery"
    }
  },
  {
    name: "Curse of the Crimson Throne",
    description: "Political intrigue and dark magic threaten a city ruled by a tyrant queen.",
    base: {
      worldDescription: "The sprawling city of Korvosa, a metropolis built on the ruins of an ancient civilization. Corruption festers in its noble houses, thieves guilds control the underbelly, and the castle looms above it all.",
      startingScenario: "King Eodred II has died under suspicious circumstances, and his young queen Ileosa has seized power. Riots break out in the streets. Each party member has a personal grudge against a local crime lord who has just been found dead.",
      mainConflict: "Queen Ileosa has discovered an ancient artifact that grants her terrible power, and she plans to use plague and necromancy to cement her rule over Korvosa forever.",
      tone: "Dark urban fantasy with political intrigue, moral dilemmas, and horror elements"
    }
  },
  {
    name: "Skyward Odyssey",
    description: "An airship adventure across floating islands in a world where the ground has been lost to an ancient catastrophe.",
    base: {
      worldDescription: "The Shattered Expanse — a world where a magical cataclysm shattered the surface centuries ago. Civilization now thrives on floating islands connected by airship trade routes. Sky pirates, cloud giants, and elemental storms are constant threats.",
      startingScenario: "The party are crew members aboard the merchant airship 'The Windborne Star'. During a routine cargo run, a distress signal flare erupts from a previously uncharted floating island shrouded in perpetual storm clouds.",
      mainConflict: "An ancient order seeks to reassemble fragments of the original cataclysm weapon to 'reset' the world, believing they can rebuild it better. The fragments are scattered across the most dangerous islands in the Expanse.",
      tone: "High adventure with exploration, wonder, and swashbuckling action"
    }
  }
];
