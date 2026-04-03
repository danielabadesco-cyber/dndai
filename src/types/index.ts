export interface CustomStat {
  id: string;
  name: string;
  value: number;
}

export interface Character {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  gold: number;
  xp: number;
  // Optional fields
  characterClass?: string;
  level?: number;
  status?: string;
  customStats: CustomStat[];
  notes: string;
  createdAt: string;
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  text: string;
  type: 'story' | 'combat' | 'note' | 'custom';
}

export interface CampaignBase {
  worldDescription: string;
  startingScenario: string;
  mainConflict: string;
  tone: string;
}

export interface ProgressionOutcome {
  type: 'success' | 'failure' | 'partial' | 'wildcard' | 'custom';
  text: string;
  nextSteps: string;
}

export interface ProgressionEntry {
  id: string;
  timestamp: string;
  situation: string;
  playerActions: string;
  diceRoll: number | null;
  outcomes: ProgressionOutcome[];
  chosen?: 'success' | 'failure' | 'partial' | 'wildcard' | 'custom';
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  campaignBase: CampaignBase;
  characters: Character[];
  dmNotes: string;
  eventLog: EventLogEntry[];
  storyProgress: string;
  createdAt: string;
  updatedAt: string;
  // Progression Helper
  storylineBase?: string;
  progressionHistory?: ProgressionEntry[];
}
