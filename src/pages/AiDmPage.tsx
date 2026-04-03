import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';

type Phase = 'setup' | 'characters' | 'playing' | 'ended';
type CampaignLength = 'short' | 'regular' | 'long';
type Difficulty = 'easy' | 'medium' | 'hard';
type EncounterType = 'combat' | 'shop' | 'puzzle' | 'quest' | 'rest';

interface PlayerChar {
  id: string;
  name: string;
  charClass: string;
  hp: number;
  maxHp: number;
  alive: boolean;
}

interface ActionEntry {
  action: string;
  character: string;
  diceRoll: number;
  outcome: string;
  type: 'combat' | 'explore' | 'interact' | 'utility';
}

interface TurnEntry {
  id: string;
  turn: number;
  situation: string;
  actions: ActionEntry[];
  resolved: boolean;
}

interface AiDmSession {
  id: string;
  storyline: string;
  length: CampaignLength;
  difficulty: Difficulty;
  maxTurns: number;
  characters: PlayerChar[];
  turns: TurnEntry[];
  currentEnemyHp: number;
  currentEnemyMaxHp: number;
  currentEnemy: string;
  currentEnemyDmg: number;
  encounterType: EncounterType;
  actionsSinceEnemyTurn: number;
  gold: number;
  potions: number;
  createdAt: string;
}

const AIDM_KEY = 'dndai_aidm_sessions';

function getSessions(): AiDmSession[] {
  try {
    const data = localStorage.getItem(AIDM_KEY);
    if (!data) return [];
    const sessions = JSON.parse(data);
    // Validate sessions have the new format fields
    return sessions.filter(
      (s: AiDmSession) =>
        Array.isArray(s.characters) &&
        s.encounterType !== undefined &&
        s.gold !== undefined &&
        s.actionsSinceEnemyTurn !== undefined &&
        s.currentEnemyDmg !== undefined
    );
  } catch {
    localStorage.removeItem(AIDM_KEY);
    return [];
  }
}

function saveSession(session: AiDmSession) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.push(session);
  localStorage.setItem(AIDM_KEY, JSON.stringify(sessions));
}

function deleteSession(id: string) {
  localStorage.setItem(AIDM_KEY, JSON.stringify(getSessions().filter(s => s.id !== id)));
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ---- CLASSES ----
const CLASS_LIST = [
  { name: 'Barbarian', emoji: '🪓', hp: { easy: 50, medium: 42, hard: 35 }, desc: 'High HP, brute force' },
  { name: 'Warrior', emoji: '⚔️', hp: { easy: 45, medium: 38, hard: 30 }, desc: 'Balanced fighter' },
  { name: 'Paladin', emoji: '🛡️', hp: { easy: 42, medium: 35, hard: 28 }, desc: 'Tank with some healing' },
  { name: 'Ranger', emoji: '🏹', hp: { easy: 38, medium: 30, hard: 24 }, desc: 'Ranged specialist' },
  { name: 'Rogue', emoji: '🗡️', hp: { easy: 35, medium: 28, hard: 22 }, desc: 'Stealth & crits' },
  { name: 'Cleric', emoji: '✨', hp: { easy: 36, medium: 30, hard: 24 }, desc: 'Healer support' },
  { name: 'Mage', emoji: '🔮', hp: { easy: 30, medium: 22, hard: 16 }, desc: 'Powerful spells, fragile' },
  { name: 'Bard', emoji: '🎵', hp: { easy: 32, medium: 26, hard: 20 }, desc: 'Clever & charismatic' },
];

// Difficulty damage multipliers
const DIFF_MULT: Record<Difficulty, number> = { easy: 0.6, medium: 1.0, hard: 1.5 };
const DIFF_PUNISH: Record<Difficulty, number> = { easy: 0.5, medium: 1.0, hard: 2.0 };

// ---- SCENE DATA ----
const locationPool = [
  'a narrow cave passage lit by glowing mushrooms', 'the ruins of an old temple half-sunken into mud',
  'a dense forest clearing where the trees seem alive', 'a crumbling bridge over a bottomless chasm',
  'an abandoned fortress with scorch marks everywhere', 'a frozen lake with something beneath the ice',
  'a throne room covered in dust and cobwebs', 'a swamp where the fog blinds everyone',
  'a cliffside path with howling winds', 'a library where books whisper',
  'a graveyard with freshly disturbed ground', 'a mining tunnel branching deeper',
  'a massive tree with a carved door', 'a village where everyone stands still, staring',
  'a tower taller on the inside', 'an underground river with bioluminescent fish',
  'a colosseum overgrown with vines', 'a floating island connected by chains',
];

const enemyPool = [
  { name: 'Goblin Pack', hp: 15, dmg: 4, desc: 'Snarling goblins with rusty weapons surround the party' },
  { name: 'Skeleton Warriors', hp: 22, dmg: 5, desc: 'Rattling skeletons rise from the ground, swords drawn' },
  { name: 'Giant Spider', hp: 28, dmg: 6, desc: 'A massive spider drops from above, fangs dripping venom' },
  { name: 'Bandit Leader & Thugs', hp: 25, dmg: 5, desc: 'A scarred bandit steps forward flanked by thugs' },
  { name: 'Ogre', hp: 38, dmg: 8, desc: 'A hulking ogre smashes through, club raised' },
  { name: 'Dark Spirit', hp: 20, dmg: 7, desc: 'A shadowy spirit materializes with freezing touch' },
  { name: 'Wolf Pack', hp: 18, dmg: 5, desc: 'Wolves circle the party, growling and snapping' },
  { name: 'Cultist Mage', hp: 22, dmg: 7, desc: 'A robed figure chants, dark energy crackling' },
  { name: 'Troll', hp: 35, dmg: 7, desc: 'A regenerating troll lumbers forward, wounds closing' },
  { name: 'Wraith', hp: 26, dmg: 8, desc: 'A ghostly figure phases through the wall, its touch deadly cold' },
  { name: 'Minotaur', hp: 32, dmg: 7, desc: 'A massive minotaur charges, horns lowered' },
];

const bossPool = [
  { name: 'The Shadow King', hp: 55, dmg: 10, desc: 'A towering figure of pure darkness rises. The final battle begins.' },
  { name: 'Ancient Dragon', hp: 65, dmg: 12, desc: 'A massive dragon unfurls its wings. The ground shakes.' },
  { name: 'Lich Lord', hp: 50, dmg: 11, desc: 'A skeletal mage floats above a runic circle. Death magic everywhere.' },
  { name: 'Demon Prince', hp: 60, dmg: 12, desc: 'A horned demon tears through a portal. Flames lick its body.' },
];

const discoveryPool = [
  'A chest nearby might have supplies.', 'Glowing runes pulse on the floor.',
  'A wounded traveler begs for help.', 'Warning symbols cover the walls.',
  'A healing spring bubbles from stone.', 'Herbs grow along the path.',
  'An abandoned supply cart sits here.', 'A weapon rack still has gear.',
];

// ---- NON-COMBAT ENCOUNTERS ----
const shopEncounters = [
  { scene: 'A traveling merchant has set up a makeshift stall. They sell potions (10 gold), weapons, and mysterious trinkets. "Welcome, adventurers! What catches your eye?"' },
  { scene: 'The party finds an underground bazaar lit by lanterns. Vendors hawk rare items and stolen goods. A shady dealer whispers, "I have something special..."' },
  { scene: 'A friendly dwarf runs a forge here. "Need repairs? Upgrades? Potions? I got it all — for the right price." He eyes the party\'s gold pouch.' },
];

const puzzleEncounters = [
  { scene: 'A massive stone door blocks the path. Three symbols are carved into it — a sun, a moon, and a star. Three levers sit on the wall. The wrong combination could be deadly.', hint: 'Look at the shadows on the floor for clues.' },
  { scene: 'The floor is a grid of tiles. Some glow faintly. A skeleton lies crumpled on a dark tile — clearly someone chose wrong. The exit is on the other side.', hint: 'Only step on glowing tiles.' },
  { scene: 'A riddle is inscribed on the wall: "I have cities but no houses, forests but no trees, water but no fish. What am I?" A door waits for the answer.', hint: 'Think about what represents these things without being real.' },
  { scene: 'Four colored potions sit on a table. A note reads: "One heals, one poisons, one empowers, one does nothing. Choose wisely." The party needs healing.', hint: 'The green one smells like herbs.' },
];

const questEncounters = [
  { scene: 'A village elder approaches the party. "Please, our children were taken into the forest by something... dark. We have gold — 20 pieces if you bring them back."', reward: 20 },
  { scene: 'A wounded knight begs for help. "My squad was ambushed. If you can retrieve our banner from the enemy camp nearby, the kingdom will reward you — 25 gold."', reward: 25 },
  { scene: 'A crying merchant says their cart was robbed. "The thieves went that way! Recover my goods and I\'ll give you potions and 15 gold."', reward: 15 },
];

const restEncounters = [
  { scene: 'The party finds a safe campsite by a stream. The fire crackles warmly. Everyone rests and recovers.', heal: 5 },
  { scene: 'A kind hermit offers shelter in their hut. "Rest here, travelers. You look like you need it." Hot soup and rest soothe the wounds.', heal: 8 },
  { scene: 'The party discovers a hidden hot spring. The magical waters soothe their wounds. Everyone feels renewed.', heal: 6 },
];

// ---- STUPID ACTION DETECTION ----
function isStupidAction(action: string, _situation: string): boolean {
  const a = action.toLowerCase();
  const stupidPatterns = [
    /dance|dab|floss|twerk|sing.*enemy|hug.*enemy|kiss.*enemy|lick|eat.*rock|eat.*dirt|eat.*poison/,
    /throw.*self|jump.*off|jump.*cliff|walk.*into.*fire|drink.*poison|stab.*self|hit.*self/,
    /sleep|nap|sit.*down|do.*nothing|ignore|walk.*away.*from.*fight|turn.*back.*on/,
    /pet.*the.*dragon|pet.*the.*ogre|pet.*the.*troll|pet.*the.*demon|befriend.*enemy/,
    /throw.*weapon.*away|disarm.*self|remove.*armor|strip|get.*naked/,
  ];
  return stupidPatterns.some(p => p.test(a));
}

function isCleverAction(action: string): boolean {
  const a = action.toLowerCase();
  const cleverPatterns = [
    /use.*environment|push.*into|lure.*into.*trap|collapse.*on|drop.*chandelier/,
    /flank|sneak.*behind|distract.*then|bait.*into|feint|trick/,
    /use.*weakness|aim.*gap.*armor|target.*wound|exploit/,
    /set.*trap|ambush|coordinate|combo|together/,
  ];
  return cleverPatterns.some(p => p.test(a));
}

// ---- ENCOUNTER TYPE DETERMINATION ----
function determineEncounterType(
  turnNum: number,
  maxTurns: number,
  lastEncounterType: EncounterType | null
): EncounterType {
  // First and last turns always combat
  if (turnNum === 1 || turnNum >= maxTurns) return 'combat';
  // Near the end (boss territory) always combat
  const progress = turnNum / maxTurns;
  if (progress >= 0.85) return 'combat';
  // Never two non-combats in a row
  if (lastEncounterType !== null && lastEncounterType !== 'combat') return 'combat';
  // ~35% chance of non-combat
  if (Math.random() < 0.35) {
    const roll = Math.random();
    if (roll < 0.25) return 'shop';
    if (roll < 0.5) return 'puzzle';
    if (roll < 0.75) return 'quest';
    return 'rest';
  }
  return 'combat';
}

// ---- SCENE GENERATION ----
function generateScene(session: AiDmSession): {
  scene: string;
  enemy: typeof enemyPool[0];
  encounterType: EncounterType;
  nonCombatData?: { shopEncounter?: typeof shopEncounters[0]; puzzleEncounter?: typeof puzzleEncounters[0]; questEncounter?: typeof questEncounters[0]; restEncounter?: typeof restEncounters[0] };
} {
  const turnNum = session.turns.filter(t => t.resolved).length + 1;
  const progress = turnNum / session.maxTurns;
  const lastTurn = session.turns.length > 0 ? session.turns[session.turns.length - 1] : null;
  const lastActions = lastTurn ? lastTurn.actions : [];
  const location = pick(locationPool);
  const aliveNames = session.characters.filter(c => c.alive).map(c => c.name).join(', ');
  const deadNames = session.characters.filter(c => !c.alive).map(c => c.name);

  const lastEncounterType = session.encounterType ?? null;
  const encounterType = determineEncounterType(turnNum, session.maxTurns, lastEncounterType);

  // Final boss
  if (progress >= 0.85) {
    const boss = pick(bossPool);
    const scaledHp = Math.round(boss.hp * (session.difficulty === 'hard' ? 1.3 : session.difficulty === 'easy' ? 0.7 : 1));
    const connection = lastActions.length > 0
      ? `After the last battle, ${aliveNames} push forward to ${location}. `
      : '';
    const deadNote = deadNames.length > 0 ? `The party fights on without ${deadNames.join(', ')}, who fell earlier. ` : '';
    return {
      scene: `FINAL BOSS — Turn ${turnNum}/${session.maxTurns}. ${connection}${deadNote}${boss.desc} This is connected to "${session.storyline.slice(0, 60)}". Everything leads to this moment.`,
      enemy: { ...boss, hp: scaledHp },
      encounterType: 'combat',
    };
  }

  // Non-combat encounters
  if (encounterType !== 'combat') {
    const enemy = pick(enemyPool); // Placeholder enemy (not used in display)
    if (encounterType === 'shop') {
      const shopData = pick(shopEncounters);
      return { scene: shopData.scene, enemy, encounterType: 'shop', nonCombatData: { shopEncounter: shopData } };
    }
    if (encounterType === 'puzzle') {
      const puzzleData = pick(puzzleEncounters);
      return { scene: puzzleData.scene + ` Hint: ${puzzleData.hint}`, enemy, encounterType: 'puzzle', nonCombatData: { puzzleEncounter: puzzleData } };
    }
    if (encounterType === 'quest') {
      const questData = pick(questEncounters);
      return { scene: questData.scene, enemy, encounterType: 'quest', nonCombatData: { questEncounter: questData } };
    }
    // rest
    const restData = pick(restEncounters);
    return { scene: restData.scene + ` Each surviving character heals ${restData.heal} HP.`, enemy, encounterType: 'rest', nonCombatData: { restEncounter: restData } };
  }

  // Normal combat encounter
  const enemy = pick(enemyPool);
  const scaledHp = Math.round(enemy.hp * (1 + progress * 0.5) * (session.difficulty === 'hard' ? 1.3 : session.difficulty === 'easy' ? 0.7 : 1));
  const scaledDmg = Math.round(enemy.dmg * DIFF_MULT[session.difficulty]);

  let connection: string;
  if (!lastTurn) {
    connection = `The adventure begins. ${aliveNames} arrive at ${location}.`;
  } else {
    const wasClean = lastActions.some(a => a.diceRoll >= 15);
    connection = wasClean
      ? `After a strong victory over the ${session.currentEnemy}, ${aliveNames} confidently move to ${location}.`
      : `Battered but alive, ${aliveNames} press on to ${location}.`;
  }

  const deadNote = deadNames.length > 0 ? ` The loss of ${deadNames.join(', ')} weighs on the party.` : '';
  const discovery = Math.random() > 0.5 ? ' ' + pick(discoveryPool) : '';
  const storyHook = progress > 0.3 && Math.random() > 0.5
    ? ` Something here connects to "${session.storyline.slice(0, 50)}"...`
    : '';

  return {
    scene: `${connection} ${enemy.desc}.${deadNote}${discovery}${storyHook}`.trim(),
    enemy: { ...enemy, hp: scaledHp, dmg: scaledDmg },
    encounterType: 'combat',
  };
}

// ---- OUTCOME GENERATION ----
function generateOutcome(
  roll: number, action: string, charName: string, charClass: string,
  enemyName: string, enemyHp: number, difficulty: Difficulty, poweredUp: boolean
): { text: string; damage: number; enemyDamage: number; targetChar?: string } {

  const stupid = isStupidAction(action, '');
  const clever = isCleverAction(action);
  const mult = DIFF_MULT[difficulty];
  const punish = DIFF_PUNISH[difficulty];
  const powerBonus = poweredUp ? 3 : 0;

  // Class bonuses
  const classBonus = charClass === 'Rogue' && roll >= 18 ? 4 : charClass === 'Mage' ? 2 : charClass === 'Barbarian' ? 1 : 0;
  const cleverBonus = clever ? 3 : 0;

  // STUPID ACTIONS — get punished
  if (stupid) {
    const stupidDmg = Math.round((6 + Math.floor(Math.random() * 6)) * punish);
    if (difficulty === 'hard') {
      return {
        text: `${charName} tries to "${action}". That was incredibly stupid. The ${enemyName} doesn't hesitate — it strikes ${charName} for ${stupidDmg} damage while they're being an idiot. ${stupidDmg >= 15 ? `${charName} is in critical condition from their own foolishness.` : `The ${enemyName} looks at ${charName} with contempt.`}`,
        damage: 0, enemyDamage: stupidDmg, targetChar: charName,
      };
    }
    if (difficulty === 'medium') {
      return {
        text: `${charName} tries to "${action}". Bad idea. The ${enemyName} takes the opening and hits ${charName} for ${stupidDmg} damage. Don't do that again.`,
        damage: 0, enemyDamage: stupidDmg, targetChar: charName,
      };
    }
    const easyDmg = Math.round(stupidDmg * 0.5);
    return {
      text: `${charName} tries to "${action}". The ${enemyName} looks confused but takes a swing anyway — ${easyDmg} damage to ${charName}. Maybe try something smarter?`,
      damage: 0, enemyDamage: easyDmg, targetChar: charName,
    };
  }

  // CLEVER ACTIONS — get rewarded
  if (clever && roll >= 10) {
    const dmg = 8 + cleverBonus + classBonus + powerBonus;
    return {
      text: `Clever move! ${charName} ${action}. The ${enemyName} doesn't see it coming — the strategy pays off! ${dmg} damage dealt.${enemyHp - dmg <= 0 ? ` The ${enemyName} goes down!` : ` (${Math.max(0, enemyHp - dmg)} HP left)`}`,
      damage: dmg, enemyDamage: 0,
    };
  }

  // NAT 20
  if (roll === 20) {
    const dmg = 14 + classBonus + powerBonus + (charClass === 'Rogue' ? 6 : 0);
    return {
      text: `NATURAL 20! ${charName} (${charClass}) executes "${action}" with absolute perfection! ${dmg} massive damage to the ${enemyName}!${enemyHp - dmg <= 0 ? ` The ${enemyName} is DESTROYED!` : ` The ${enemyName} reels (${Math.max(0, enemyHp - dmg)} HP).`}`,
      damage: dmg, enemyDamage: 0,
    };
  }
  if (roll >= 17) {
    const dmg = 9 + classBonus + powerBonus;
    return {
      text: `Great hit! ${charName} ${action} — connects hard! ${dmg} damage to the ${enemyName}.${enemyHp - dmg <= 0 ? ` The ${enemyName} collapses!` : ` (${Math.max(0, enemyHp - dmg)} HP left)`}`,
      damage: dmg, enemyDamage: 0,
    };
  }
  if (roll >= 13) {
    const dmg = 6 + classBonus + powerBonus;
    return {
      text: `Solid hit. ${charName} ${action} — lands it. ${dmg} damage to the ${enemyName}.${enemyHp - dmg <= 0 ? ` Down it goes!` : ` (${Math.max(0, enemyHp - dmg)} HP left)`}`,
      damage: dmg, enemyDamage: 0,
    };
  }
  if (roll >= 8) {
    const dmg = 3 + powerBonus;
    const eDmg = Math.round(4 * mult);
    return {
      text: `Partial. ${charName} ${action} — grazes the ${enemyName} for ${dmg}. But the ${enemyName} retaliates and hits ${charName} for ${eDmg}!${enemyHp - dmg <= 0 ? ` Barely enough — the ${enemyName} falls!` : ` (${Math.max(0, enemyHp - dmg)} HP left)`}`,
      damage: dmg, enemyDamage: eDmg, targetChar: charName,
    };
  }
  if (roll >= 4) {
    const eDmg = Math.round(6 * mult);
    return {
      text: `Miss! ${charName} ${action} — but the ${enemyName} dodges and strikes back! ${eDmg} damage to ${charName}!`,
      damage: 0, enemyDamage: eDmg, targetChar: charName,
    };
  }
  if (roll === 1) {
    const eDmg = Math.round(10 * mult);
    return {
      text: `CRITICAL FAIL! ${charName} tries "${action}" and it goes horribly wrong. ${charName} stumbles and the ${enemyName} punishes them — ${eDmg} damage!${eDmg >= 12 ? ` ${charName} is in serious trouble!` : ''}`,
      damage: 0, enemyDamage: eDmg, targetChar: charName,
    };
  }
  const eDmg = Math.round(7 * mult);
  return {
    text: `Bad miss. ${charName} ${action} — doesn't connect. The ${enemyName} counterattacks for ${eDmg} to ${charName}.`,
    damage: 0, enemyDamage: eDmg, targetChar: charName,
  };
}

// ---- ENEMY ATTACK HELPER ----
function generateEnemyAttack(
  enemyName: string,
  enemyDmg: number,
  targetName: string,
  isSurprise: boolean
): { text: string; damage: number } {
  const dmg = Math.max(1, enemyDmg + Math.floor(Math.random() * 4) - 1);
  if (isSurprise) {
    return {
      text: `SURPRISE ATTACK! The ${enemyName} is fast — it lunges at ${targetName} for ${dmg} damage before anyone can react!`,
      damage: dmg,
    };
  }
  const lines = [
    `The ${enemyName} seizes the moment and slashes ${targetName} for ${dmg} damage!`,
    `Counter-attack! The ${enemyName} strikes ${targetName} hard — ${dmg} damage!`,
    `The ${enemyName} retaliates, hitting ${targetName} for ${dmg} damage!`,
    `Monster's turn! The ${enemyName} hammers ${targetName} for ${dmg} damage!`,
  ];
  return { text: pick(lines), damage: dmg };
}

// ---- COMPONENT ----
export default function AiDmPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessions, setSessions] = useState<AiDmSession[]>([]);
  const [storyline, setStoryline] = useState('');
  const [length, setLength] = useState<CampaignLength>('regular');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Character creation
  const [charName, setCharName] = useState('');
  const [charClass, setCharClass] = useState('Warrior');
  const [pendingChars, setPendingChars] = useState<PlayerChar[]>([]);

  // Playing
  const [session, setSession] = useState<AiDmSession | null>(null);
  const [currentScene, setCurrentScene] = useState('');
  const [playerAction, setPlayerAction] = useState('');
  const [puzzleInput, setPuzzleInput] = useState('');
  const [activeChar, setActiveChar] = useState<string>('');
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [outcome, setOutcome] = useState('');
  const [rolling, setRolling] = useState(false);
  const [lastActionType, setLastActionType] = useState<'combat' | 'utility' | 'enemy' | ''>('');
  const [questReward, setQuestReward] = useState(0);

  useEffect(() => { setSessions(getSessions()); }, []);
  const lengthTurns: Record<CampaignLength, number> = { short: 8, regular: 15, long: 25 };

  function doSave(s: AiDmSession) { saveSession(s); setSession({ ...s }); }

  function addCharacter() {
    if (!charName.trim()) return;
    const cls = CLASS_LIST.find(c => c.name === charClass)!;
    const hp = cls.hp[difficulty];
    setPendingChars([...pendingChars, { id: uuidv4(), name: charName.trim(), charClass, hp, maxHp: hp, alive: true }]);
    setCharName('');
  }

  function removeChar(id: string) { setPendingChars(pendingChars.filter(c => c.id !== id)); }

  function startGame() {
    if (pendingChars.length === 0) return;
    const maxTurns = lengthTurns[length];
    const newSession: AiDmSession = {
      id: uuidv4(), storyline: storyline.trim(), length, difficulty, maxTurns,
      characters: pendingChars, turns: [],
      currentEnemyHp: 0, currentEnemyMaxHp: 0, currentEnemy: '',
      currentEnemyDmg: 0,
      encounterType: 'combat',
      actionsSinceEnemyTurn: 0,
      gold: 15,
      potions: pendingChars.length + 1,
      createdAt: new Date().toISOString(),
    };
    const { scene, enemy, encounterType } = generateScene(newSession);
    newSession.currentEnemy = enemy.name;
    newSession.currentEnemyHp = enemy.hp;
    newSession.currentEnemyMaxHp = enemy.hp;
    newSession.currentEnemyDmg = enemy.dmg;
    newSession.encounterType = encounterType;
    newSession.actionsSinceEnemyTurn = 0;
    newSession.turns.push({ id: uuidv4(), turn: 1, situation: scene, actions: [], resolved: false });
    doSave(newSession);
    setCurrentScene(scene);
    setActiveChar(pendingChars[0].id);
    setQuestReward(0);
    setPhase('playing');
  }

  function resumeSession(s: AiDmSession) {
    setSession(s);
    const alive = s.characters.filter(c => c.alive);
    if (alive.length === 0 || s.turns.filter(t => t.resolved).length >= s.maxTurns) {
      setPhase('ended');
    } else {
      setCurrentScene(s.turns[s.turns.length - 1]?.situation || '');
      setActiveChar(alive[0].id);
      setQuestReward(0);
      setPhase('playing');
    }
  }

  function advanceToNextTurn(s: AiDmSession) {
    const turns = [...s.turns];
    turns[turns.length - 1].resolved = true;
    const updated = { ...s, turns };
    const allDead = updated.characters.every(c => !c.alive);
    if (allDead || turns.filter(t => t.resolved).length >= s.maxTurns) {
      doSave(updated);
      setPhase('ended');
      return;
    }
    const { scene, enemy, encounterType } = generateScene(updated);
    updated.currentEnemy = enemy.name;
    updated.currentEnemyHp = enemy.hp;
    updated.currentEnemyMaxHp = enemy.hp;
    updated.currentEnemyDmg = enemy.dmg;
    updated.encounterType = encounterType;
    updated.actionsSinceEnemyTurn = 0;
    updated.turns.push({ id: uuidv4(), turn: turns.filter(t => t.resolved).length + 1, situation: scene, actions: [], resolved: false });

    // Auto-apply rest healing when advancing into a rest encounter
    if (encounterType === 'rest') {
      const restData = restEncounters.find(r => scene.includes(r.scene)) ?? restEncounters[0];
      const healAmt = restData.heal;
      updated.characters = updated.characters.map(c =>
        c.alive ? { ...c, hp: Math.min(c.maxHp, c.hp + healAmt) } : c
      );
    }

    doSave(updated);
    setCurrentScene(scene);
    setOutcome('');
    setPlayerAction('');
    setPuzzleInput('');
    setDiceRoll(null);
    setLastActionType('');
    setQuestReward(0);
  }

  // ---- ENEMY TURN (triggered after N player actions in combat) ----
  function maybeDoEnemyTurn(updated: AiDmSession, forceAttack: boolean): { updated: AiDmSession; enemyText: string | null } {
    if (updated.encounterType !== 'combat' || updated.currentEnemyHp <= 0) return { updated, enemyText: null };

    const actionsThreshold = updated.difficulty === 'hard' ? 2 : 3;
    const isSurpriseChance = Math.random() < 0.2;

    if (!forceAttack && !isSurpriseChance && updated.actionsSinceEnemyTurn < actionsThreshold) {
      return { updated, enemyText: null };
    }

    const aliveChars = updated.characters.filter(c => c.alive);
    if (aliveChars.length === 0) return { updated, enemyText: null };

    const target = pick(aliveChars);
    const { text, damage } = generateEnemyAttack(
      updated.currentEnemy,
      updated.currentEnemyDmg,
      target.name,
      isSurpriseChance && !forceAttack
    );

    target.hp = Math.max(0, target.hp - damage);
    if (target.hp === 0) {
      target.alive = false;
    }
    updated.actionsSinceEnemyTurn = 0;

    const fullText = target.hp === 0
      ? text + ` ${target.name} HAS FALLEN!`
      : text;

    return { updated, enemyText: fullText };
  }

  // ---- QUICK ACTIONS ----
  function quickAction(type: string) {
    if (!session) return;
    const updated = { ...session, characters: session.characters.map(c => ({ ...c })) };
    const char = updated.characters.find(c => c.id === activeChar);
    if (!char || !char.alive) return;
    const turn = updated.turns[updated.turns.length - 1];
    let text = '';

    if (type === 'look') {
      const finds = [
        `${char.name} looks around carefully. Spots a weak point in the ${session.currentEnemy}'s left flank.`,
        `${char.name} scans the area. There's a loose rock above the enemy — could be useful.`,
        `${char.name} finds a small healing herb nearby. +3 HP restored.`,
        `${char.name} notices the ${session.currentEnemy} favors its right side — there's an opening on the left.`,
        `${char.name} spots an old potion on the ground. The party gains +1 potion!`,
        `${char.name} examines the surroundings but finds nothing special.`,
      ];
      text = pick(finds);
      if (text.includes('+3 HP')) char.hp = Math.min(char.maxHp, char.hp + 3);
      if (text.includes('+1 potion')) updated.potions += 1;
    } else if (type === 'potion') {
      if (updated.potions <= 0) return;
      const heal = 8 + Math.floor(Math.random() * 5);
      updated.potions -= 1;
      char.hp = Math.min(char.maxHp, char.hp + heal);
      text = `${char.name} drinks a healing potion. +${heal} HP restored! (${char.hp}/${char.maxHp}) — ${updated.potions} potions left.`;
    } else if (type === 'power') {
      text = `${char.name} focuses energy. Powered up — next attack deals bonus damage!`;
    } else if (type === 'dodge') {
      const roll = Math.floor(Math.random() * 20) + 1;
      if (roll >= 10) {
        text = `${char.name} readies a dodge (rolled ${roll}). Prepared for the next attack!`;
      } else {
        const dmg = Math.round(3 * DIFF_MULT[session.difficulty]);
        char.hp = Math.max(0, char.hp - dmg);
        if (char.hp === 0) char.alive = false;
        text = `${char.name} tries to dodge (rolled ${roll}) but stumbles. The ${session.currentEnemy} clips them for ${dmg}!${!char.alive ? ` ${char.name} FALLS!` : ''}`;
      }
    }

    updated.actionsSinceEnemyTurn += 1;
    turn.actions.push({ action: type, character: char.name, diceRoll: 0, outcome: text, type: 'utility' });

    const { updated: afterEnemy, enemyText } = maybeDoEnemyTurn(updated, updated.actionsSinceEnemyTurn >= (updated.difficulty === 'hard' ? 2 : 3));

    let finalText = text;
    if (enemyText) {
      finalText = text + '\n\n' + enemyText;
      turn.actions.push({ action: 'enemy_attack', character: updated.currentEnemy, diceRoll: 0, outcome: enemyText, type: 'combat' });
      setLastActionType('enemy');
    } else {
      setLastActionType('utility');
    }

    doSave(afterEnemy);
    setOutcome(finalText);
  }

  // ---- MAIN COMBAT ACTION ----
  async function handleRollAndResolve() {
    if (!session || !playerAction.trim()) return;
    const char = session.characters.find(c => c.id === activeChar);
    if (!char || !char.alive) return;
    setRolling(true);

    let finalRoll = 1;
    for (let i = 0; i < 10; i++) {
      finalRoll = Math.floor(Math.random() * 20) + 1;
      setDiceRoll(finalRoll);
      await new Promise(r => setTimeout(r, 80));
    }
    setRolling(false);

    const updated = { ...session, characters: session.characters.map(c => ({ ...c })) };
    const result = generateOutcome(finalRoll, playerAction.trim(), char.name, char.charClass, updated.currentEnemy, updated.currentEnemyHp, updated.difficulty, false);
    updated.currentEnemyHp = Math.max(0, updated.currentEnemyHp - result.damage);

    // Apply enemy damage to the targeted character (or active char)
    const targetId = result.targetChar
      ? updated.characters.find(c => c.name === result.targetChar && c.alive)?.id || activeChar
      : activeChar;
    const targetChar = updated.characters.find(c => c.id === targetId);
    if (targetChar && result.enemyDamage > 0) {
      targetChar.hp = Math.max(0, targetChar.hp - result.enemyDamage);
      if (targetChar.hp === 0) {
        targetChar.alive = false;
        result.text += ` ${targetChar.name} HAS FALLEN! They're out of the fight.`;
      }
    }

    updated.actionsSinceEnemyTurn += 1;
    const turn = updated.turns[updated.turns.length - 1];
    turn.actions.push({ action: playerAction.trim(), character: char.name, diceRoll: finalRoll, outcome: result.text, type: 'combat' });

    // Check monster turn after player action
    const shouldForce = updated.actionsSinceEnemyTurn >= (updated.difficulty === 'hard' ? 2 : 3) && updated.currentEnemyHp > 0;
    const { updated: afterEnemy, enemyText } = maybeDoEnemyTurn(updated, shouldForce);

    let finalText = result.text;
    if (enemyText && afterEnemy.currentEnemyHp > 0) {
      finalText = result.text + '\n\n' + enemyText;
      turn.actions.push({ action: 'enemy_attack', character: updated.currentEnemy, diceRoll: 0, outcome: enemyText, type: 'combat' });
      setLastActionType('enemy');
    } else {
      setLastActionType('combat');
    }

    doSave(afterEnemy);
    setOutcome(finalText);
    setPlayerAction('');
  }

  // ---- SHOP ACTIONS ----
  function handleShopBuyPotion() {
    if (!session) return;
    const updated = { ...session, characters: session.characters.map(c => ({ ...c })) };
    if (updated.gold < 10) {
      setOutcome("Not enough gold! You need 10 gold to buy a potion.");
      setLastActionType('utility');
      return;
    }
    updated.gold -= 10;
    updated.potions += 1;
    const text = `Purchased a healing potion for 10 gold. You now have ${updated.potions} potions and ${updated.gold} gold remaining.`;
    doSave(updated);
    setOutcome(text);
    setLastActionType('utility');
  }

  function handleShopRepair() {
    if (!session) return;
    const updated = { ...session, characters: session.characters.map(c => ({ ...c })) };
    if (updated.gold < 5) {
      setOutcome("Not enough gold! Repair costs 5 gold.");
      setLastActionType('utility');
      return;
    }
    updated.gold -= 5;
    // Heal all alive characters 5 HP
    updated.characters = updated.characters.map(c =>
      c.alive ? { ...c, hp: Math.min(c.maxHp, c.hp + 5) } : c
    );
    const text = `Paid 5 gold for armor repairs. All characters restored 5 HP. Gold remaining: ${updated.gold}.`;
    doSave(updated);
    setOutcome(text);
    setLastActionType('utility');
  }

  // ---- PUZZLE ACTION ----
  async function handlePuzzleSolve() {
    if (!session || !puzzleInput.trim()) return;
    setRolling(true);
    let finalRoll = 1;
    for (let i = 0; i < 10; i++) {
      finalRoll = Math.floor(Math.random() * 20) + 1;
      setDiceRoll(finalRoll);
      await new Promise(r => setTimeout(r, 80));
    }
    setRolling(false);

    const updated = { ...session, characters: session.characters.map(c => ({ ...c })) };
    const turn = updated.turns[updated.turns.length - 1];

    if (finalRoll >= 10) {
      const reward = pick([5, 8, 10]);
      updated.gold += reward;
      const text = `Rolled ${finalRoll}! The party solves the puzzle. "${puzzleInput.trim()}" — correct! You gain ${reward} gold and pass safely.`;
      turn.actions.push({ action: puzzleInput.trim(), character: 'Party', diceRoll: finalRoll, outcome: text, type: 'interact' });
      doSave(updated);
      setOutcome(text);
      setLastActionType('utility');
    } else {
      const trapDmg = Math.round(6 * DIFF_MULT[session.difficulty]);
      const aliveChars = updated.characters.filter(c => c.alive);
      if (aliveChars.length > 0) {
        const victim = pick(aliveChars);
        victim.hp = Math.max(0, victim.hp - trapDmg);
        if (victim.hp === 0) victim.alive = false;
        const text = `Rolled ${finalRoll}. The puzzle rejects "${puzzleInput.trim()}" — a trap springs! ${victim.name} takes ${trapDmg} damage!${!victim.alive ? ` ${victim.name} FALLS!` : ''}`;
        turn.actions.push({ action: puzzleInput.trim(), character: 'Party', diceRoll: finalRoll, outcome: text, type: 'interact' });
        doSave(updated);
        setOutcome(text);
        setLastActionType('combat');
      }
    }
    setPuzzleInput('');
  }

  // ---- QUEST ACTION ----
  function handleQuestComplete(reward: number) {
    if (!session) return;
    const updated = { ...session };
    updated.gold += reward;
    const text = `Quest complete! The party earns ${reward} gold. Total gold: ${updated.gold}.`;
    const turn = updated.turns[updated.turns.length - 1];
    turn.actions.push({ action: 'complete_quest', character: 'Party', diceRoll: 0, outcome: text, type: 'interact' });
    doSave(updated);
    setOutcome(text);
    setLastActionType('utility');
    setQuestReward(reward);
  }

  function getOutcomeColor(roll: number | null, type: 'combat' | 'utility' | 'enemy' | ''): string {
    if (type === 'enemy') return '#c0392b';
    if (type === 'utility') return 'var(--color-accent)';
    if (!roll) return 'var(--color-text-muted)';
    if (roll === 20) return '#FFD700';
    if (roll >= 13) return '#3a9e3a';
    if (roll >= 8) return '#d4a017';
    if (roll === 1) return '#8b0000';
    return '#c0392b';
  }

  // ==== SETUP VIEW ====
  if (phase === 'setup') {
    return (
      <Layout title="AI DM" showBack>
        <div className="space-y-4 stagger-in">
          <div className="text-center py-4">
            <h2 className="text-xl mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)', fontWeight: 900 }}>AI DUNGEON MASTER</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>The AI runs the game. You play.</p>
          </div>

          {sessions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Continue</h3>
              {sessions.map(s => (
                <div key={s.id} className="rounded-lg p-3 card-hover flex items-center justify-between"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex-1 cursor-pointer" onClick={() => resumeSession(s)}>
                    <p className="font-bold text-sm">{s.storyline.slice(0, 40)}...</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {s.characters.filter(c => c.alive).length}/{s.characters.length} alive &middot; Turn {s.turns.filter(t => t.resolved).length}/{s.maxTurns} &middot; {s.difficulty} &middot; {s.gold}g
                    </p>
                  </div>
                  <button onClick={() => { deleteSession(s.id); setSessions(getSessions()); }} className="text-xs px-2 py-1" style={{ background: 'none', color: 'var(--color-danger)' }}>X</button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-accent)' }}>New Session</h3>
            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Storyline</label>
              <textarea value={storyline} onChange={e => setStoryline(e.target.value)} rows={3} placeholder="e.g. Demon Slayer, Lord of the Rings, pirates..." />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Difficulty</label>
              <div className="flex gap-2">
                {([['easy', 'Easy', 'Less damage, forgiving'] as const, ['medium', 'Medium', 'Balanced challenge'] as const, ['hard', 'Hard', 'Brutal. No mercy.'] as const]).map(([d, label, desc]) => (
                  <button key={d} onClick={() => setDifficulty(d)} className="flex-1 py-2 rounded-lg text-center"
                    style={{ backgroundColor: difficulty === d ? 'var(--color-primary)' : 'var(--color-surface-light)', color: difficulty === d ? 'white' : 'var(--color-text-muted)' }}>
                    <div className="font-bold text-xs">{label}</div>
                    <div className="text-xs opacity-70">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Length</label>
              <div className="flex gap-2">
                {(['short', 'regular', 'long'] as const).map(l => (
                  <button key={l} onClick={() => setLength(l)} className="flex-1 py-2 rounded-lg text-center"
                    style={{ backgroundColor: length === l ? 'var(--color-primary)' : 'var(--color-surface-light)', color: length === l ? 'white' : 'var(--color-text-muted)' }}>
                    <div className="font-bold text-xs capitalize">{l}</div>
                    <div className="text-xs">{lengthTurns[l]} turns</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { if (storyline.trim()) setPhase('characters'); }} disabled={!storyline.trim()}
              className="w-full py-3 font-bold rounded-lg"
              style={{ backgroundColor: storyline.trim() ? 'var(--color-accent)' : 'var(--color-border)', color: 'var(--color-bg)' }}>
              Next: Create Characters
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ==== CHARACTER CREATION ====
  if (phase === 'characters') {
    const selectedClass = CLASS_LIST.find(c => c.name === charClass)!;
    return (
      <Layout title="Create Party" showBack>
        <div className="space-y-4 stagger-in">
          <div className="text-center py-2">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Add your party members. Each player picks a name and class.
            </p>
            <p className="text-xs mt-1" style={{ color: difficulty === 'hard' ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
              Difficulty: <strong>{difficulty.toUpperCase()}</strong>
            </p>
          </div>

          {/* Added characters */}
          {pendingChars.map(c => {
            const cls = CLASS_LIST.find(cl => cl.name === c.charClass)!;
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg p-3"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <span className="text-xl">{cls.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{c.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.charClass} — {c.hp} HP</p>
                </div>
                <button onClick={() => removeChar(c.id)} className="text-xs px-2 py-1" style={{ background: 'none', color: 'var(--color-danger)' }}>Remove</button>
              </div>
            );
          })}

          {/* Add character form */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="mb-3">
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Player Name</label>
              <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="Enter name..." />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold uppercase mb-2" style={{ color: 'var(--color-text-muted)' }}>Class</label>
              <div className="grid grid-cols-2 gap-2">
                {CLASS_LIST.map(cls => (
                  <button key={cls.name} onClick={() => setCharClass(cls.name)}
                    className="py-2 px-2 rounded-lg text-left text-xs"
                    style={{
                      backgroundColor: charClass === cls.name ? 'var(--color-primary)' : 'var(--color-surface-light)',
                      color: charClass === cls.name ? 'white' : 'var(--color-text)',
                      border: charClass === cls.name ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                    }}>
                    <span>{cls.emoji} <strong>{cls.name}</strong></span>
                    <span className="block" style={{ color: charClass === cls.name ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}>
                      {cls.hp[difficulty]} HP — {cls.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={addCharacter} disabled={!charName.trim()}
              className="w-full py-2 font-bold rounded-lg text-sm"
              style={{ backgroundColor: charName.trim() ? 'var(--color-accent)' : 'var(--color-border)', color: 'var(--color-bg)' }}>
              + Add {charName.trim() || 'Character'}  ({selectedClass.name} — {selectedClass.hp[difficulty]} HP)
            </button>
          </div>

          {pendingChars.length > 0 && (
            <button onClick={startGame} className="w-full py-4 font-bold rounded-lg text-lg"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
              Start Adventure with {pendingChars.length} Player{pendingChars.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </Layout>
    );
  }

  // ==== ENDED ====
  if (phase === 'ended' && session) {
    const anyAlive = session.characters.some(c => c.alive);
    return (
      <Layout title={anyAlive ? 'Victory!' : 'Defeated'} showBack>
        <div className="space-y-4 stagger-in">
          <div className="text-center py-4">
            <h2 className="text-xl mb-2" style={{ fontFamily: 'var(--font-heading)', color: anyAlive ? 'var(--color-accent)' : 'var(--color-danger)', fontWeight: 900 }}>
              {anyAlive ? 'ADVENTURE COMPLETE' : 'TOTAL PARTY KILL'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {session.difficulty.toUpperCase()} &middot; {session.turns.filter(t => t.resolved).length} encounters &middot; {session.gold} gold earned
            </p>
          </div>
          {session.characters.map(c => {
            const cls = CLASS_LIST.find(cl => cl.name === c.charClass)!;
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg p-3"
                style={{ backgroundColor: 'var(--color-surface)', opacity: c.alive ? 1 : 0.5 }}>
                <span className="text-lg">{cls.emoji}</span>
                <div>
                  <p className="font-bold text-sm">{c.name} <span className="text-xs" style={{ color: c.alive ? 'var(--color-accent)' : 'var(--color-danger)' }}>{c.alive ? 'SURVIVED' : 'FALLEN'}</span></p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.charClass} — {c.hp}/{c.maxHp} HP</p>
                </div>
              </div>
            );
          })}
          <button onClick={() => { setSession(null); setPhase('setup'); setPendingChars([]); setSessions(getSessions()); }}
            className="w-full py-3 font-bold rounded-lg" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}>
            Back to Menu
          </button>
        </div>
      </Layout>
    );
  }

  // ==== PLAYING ====
  if (phase === 'playing' && session) {
    const resolved = session.turns.filter(t => t.resolved).length;
    const progress = resolved / session.maxTurns;
    const enemyDefeated = session.currentEnemyHp <= 0;
    const aliveChars = session.characters.filter(c => c.alive);
    const allDead = aliveChars.length === 0;
    const isCombat = session.encounterType === 'combat';
    const isShop = session.encounterType === 'shop';
    const isPuzzle = session.encounterType === 'puzzle';
    const isQuest = session.encounterType === 'quest';
    const isRest = session.encounterType === 'rest';

    if (allDead) setTimeout(() => setPhase('ended'), 300);

    // Find current quest reward from questEncounters data
    const currentQuestData = isQuest
      ? questEncounters.find(q => currentScene.includes(q.scene.slice(0, 40))) ?? questEncounters[0]
      : null;

    return (
      <Layout title="AI DM" showBack>
        <div className="space-y-3">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <span>Encounter {resolved + 1}/{session.maxTurns}</span>
              <div className="flex items-center gap-3">
                <span className="font-bold" style={{ color: '#FFD700' }}>💰 {session.gold}g</span>
                <span className="uppercase text-xs font-bold" style={{ color: session.difficulty === 'hard' ? 'var(--color-danger)' : session.difficulty === 'easy' ? 'var(--color-accent)' : 'var(--color-warning)' }}>{session.difficulty}</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-light)' }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: progress >= 0.8 ? 'var(--color-danger)' : 'var(--color-accent)' }} />
            </div>
          </div>

          {/* Encounter type badge */}
          {!isCombat && (
            <div className="text-center py-1 rounded-lg text-xs font-bold uppercase tracking-widest"
              style={{
                backgroundColor: isShop ? 'rgba(255,215,0,0.12)' : isPuzzle ? 'rgba(100,149,237,0.12)' : isQuest ? 'rgba(0,204,102,0.12)' : 'rgba(64,196,99,0.12)',
                color: isShop ? '#FFD700' : isPuzzle ? 'cornflowerblue' : isQuest ? 'var(--color-accent)' : '#3a9e3a',
                border: `1px solid ${isShop ? 'rgba(255,215,0,0.3)' : isPuzzle ? 'rgba(100,149,237,0.3)' : 'rgba(0,204,102,0.3)'}`,
              }}>
              {isShop ? '🛒 Shop Encounter' : isPuzzle ? '🧩 Puzzle Encounter' : isQuest ? '📜 Quest Encounter' : '🏕️ Rest Encounter'}
            </div>
          )}

          {/* Party HP */}
          <div className="space-y-1">
            {session.characters.map(c => {
              const cls = CLASS_LIST.find(cl => cl.name === c.charClass)!;
              const isActive = c.id === activeChar;
              return (
                <div key={c.id} className="flex items-center gap-2 rounded p-2 cursor-pointer"
                  onClick={() => c.alive && setActiveChar(c.id)}
                  style={{
                    backgroundColor: isActive ? 'rgba(0,204,102,0.1)' : 'var(--color-surface)',
                    border: isActive ? '1px solid var(--color-accent)' : '1px solid transparent',
                    opacity: c.alive ? 1 : 0.4,
                  }}>
                  <span className="text-sm">{cls.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold truncate">{c.name}</span>
                      <span style={{ color: c.alive ? 'var(--color-text-muted)' : 'var(--color-danger)' }}>{c.alive ? `${c.hp}/${c.maxHp}` : 'DEAD'}</span>
                    </div>
                    {c.alive && (
                      <div className="w-full h-1.5 rounded-full mt-0.5" style={{ backgroundColor: 'var(--color-surface-light)' }}>
                        <div className="h-1.5 rounded-full transition-all" style={{
                          width: `${(c.hp / c.maxHp) * 100}%`,
                          backgroundColor: c.hp / c.maxHp > 0.5 ? '#3a9e3a' : c.hp / c.maxHp > 0.25 ? '#d4a017' : '#c0392b',
                        }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enemy HP — only in combat */}
          {isCombat && (
            <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold" style={{ color: 'var(--color-danger)' }}>{session.currentEnemy}</span>
                <div className="flex items-center gap-2">
                  {session.actionsSinceEnemyTurn > 0 && (
                    <span className="text-xs" style={{ color: 'var(--color-warning)' }}>
                      ⚡ {session.difficulty === 'hard' ? 2 : 3 - session.actionsSinceEnemyTurn} actions until attack
                    </span>
                  )}
                  <span>{session.currentEnemyHp}/{session.currentEnemyMaxHp}</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-light)' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${(session.currentEnemyHp / session.currentEnemyMaxHp) * 100}%`, backgroundColor: '#c0392b' }} />
              </div>
            </div>
          )}

          {/* Scene */}
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--color-accent)' }}>What's Happening</p>
            <p className="text-sm">{currentScene}</p>
          </div>

          {/* Outcome */}
          {outcome && (
            <div className="rounded-lg p-3" style={{
              backgroundColor: lastActionType === 'enemy' ? 'rgba(192,57,43,0.1)' : lastActionType === 'utility' ? 'rgba(0,204,102,0.08)' : `${getOutcomeColor(diceRoll, lastActionType)}15`,
              borderLeft: `3px solid ${getOutcomeColor(diceRoll, lastActionType)}`,
            }}>
              {diceRoll && lastActionType === 'combat' && <span className="text-xs font-bold" style={{ color: getOutcomeColor(diceRoll, lastActionType) }}>d20: {diceRoll} &middot; </span>}
              {lastActionType === 'enemy' && <span className="text-xs font-bold" style={{ color: '#c0392b' }}>MONSTER ATTACKS &middot; </span>}
              <span className="text-sm" style={{ whiteSpace: 'pre-line' }}>{outcome}</span>
            </div>
          )}

          {/* ---- NON-COMBAT ENCOUNTER UI ---- */}
          {!isCombat && !allDead && (
            <div className="space-y-3">
              {/* SHOP */}
              {isShop && (
                <div className="space-y-2">
                  <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>Gold: <strong style={{ color: '#FFD700' }}>{session.gold}g</strong> &middot; Potions: <strong>{session.potions}</strong></p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleShopBuyPotion} disabled={session.gold < 10}
                      className="py-2 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: session.gold >= 10 ? 'rgba(255,215,0,0.15)' : 'var(--color-surface-light)', color: session.gold >= 10 ? '#FFD700' : 'var(--color-border)', border: '1px solid rgba(255,215,0,0.3)' }}>
                      Buy Potion (10g)
                    </button>
                    <button onClick={handleShopRepair} disabled={session.gold < 5}
                      className="py-2 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: session.gold >= 5 ? 'rgba(0,204,102,0.12)' : 'var(--color-surface-light)', color: session.gold >= 5 ? 'var(--color-accent)' : 'var(--color-border)', border: '1px solid rgba(0,204,102,0.3)' }}>
                      Repair Armor +5HP (5g)
                    </button>
                  </div>
                  <button onClick={() => advanceToNextTurn(session)} className="w-full py-3 font-bold rounded-lg"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    Leave Shop & Continue
                  </button>
                </div>
              )}

              {/* PUZZLE */}
              {isPuzzle && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Your solution / approach:</label>
                    <textarea value={puzzleInput} onChange={e => setPuzzleInput(e.target.value)} rows={2}
                      placeholder="Describe how you solve or bypass the puzzle..." />
                  </div>
                  <button onClick={handlePuzzleSolve} disabled={!puzzleInput.trim() || rolling}
                    className="w-full py-3 font-bold rounded-lg"
                    style={{ backgroundColor: puzzleInput.trim() && !rolling ? 'cornflowerblue' : 'var(--color-border)', color: 'white' }}>
                    {rolling ? `Rolling... ${diceRoll}` : 'Roll d20 & Attempt Puzzle'}
                  </button>
                  <button onClick={() => advanceToNextTurn(session)} className="w-full py-2 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-muted)' }}>
                    Skip Puzzle & Continue
                  </button>
                </div>
              )}

              {/* QUEST */}
              {isQuest && (
                <div className="space-y-2">
                  {questReward === 0 ? (
                    <button onClick={() => handleQuestComplete(currentQuestData?.reward ?? 15)}
                      className="w-full py-3 font-bold rounded-lg"
                      style={{ backgroundColor: 'rgba(0,204,102,0.15)', color: 'var(--color-accent)', border: '1px solid rgba(0,204,102,0.4)' }}>
                      Complete Quest &amp; Collect Reward ({currentQuestData?.reward ?? 15}g)
                    </button>
                  ) : (
                    <p className="text-center text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                      Quest complete! +{questReward}g collected.
                    </p>
                  )}
                  <button onClick={() => advanceToNextTurn(session)} className="w-full py-3 font-bold rounded-lg"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    Continue Adventure
                  </button>
                </div>
              )}

              {/* REST */}
              {isRest && (
                <div className="space-y-2">
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(64,196,99,0.1)', border: '1px solid rgba(64,196,99,0.3)' }}>
                    <p className="text-sm font-bold" style={{ color: '#3a9e3a' }}>All characters have been healed!</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {session.characters.filter(c => c.alive).map(c => `${c.name}: ${c.hp}/${c.maxHp} HP`).join(' · ')}
                    </p>
                  </div>
                  <button onClick={() => advanceToNextTurn(session)} className="w-full py-3 font-bold rounded-lg"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    Continue Adventure
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ---- COMBAT UI ---- */}
          {isCombat && (
            <>
              {enemyDefeated && !allDead ? (
                <div className="space-y-2">
                  <p className="text-center font-bold" style={{ color: 'var(--color-accent)' }}>Enemy Defeated!</p>
                  <button onClick={() => advanceToNextTurn(session)} className="w-full py-3 font-bold rounded-lg" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    {resolved + 1 >= session.maxTurns ? 'See Summary' : 'Next Encounter'}
                  </button>
                </div>
              ) : !allDead && (
                <>
                  {/* Active character indicator */}
                  <p className="text-xs text-center" style={{ color: 'var(--color-accent)' }}>
                    Acting as: <strong>{aliveChars.find(c => c.id === activeChar)?.name || aliveChars[0]?.name}</strong>
                    {aliveChars.length > 1 && ' (tap a character above to switch)'}
                  </p>

                  {/* Quick actions */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button onClick={() => quickAction('look')} className="py-2 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-surface-light)', color: 'cornflowerblue', border: '1px solid rgba(100,149,237,0.2)' }}>Look</button>
                    <button onClick={() => quickAction('potion')} disabled={session.potions <= 0}
                      className="py-2 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-surface-light)', color: session.potions > 0 ? '#3a9e3a' : 'var(--color-border)' }}>Potion({session.potions})</button>
                    <button onClick={() => quickAction('power')} className="py-2 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-surface-light)', color: '#FFD700' }}>Power Up</button>
                    <button onClick={() => quickAction('dodge')} className="py-2 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-surface-light)', color: 'var(--color-warning)' }}>Dodge</button>
                  </div>

                  {/* Action input */}
                  <div>
                    <textarea value={playerAction} onChange={e => setPlayerAction(e.target.value)} rows={2}
                      placeholder={`What does ${aliveChars.find(c => c.id === activeChar)?.name || 'the player'} do?`} />
                  </div>
                  <button onClick={handleRollAndResolve} disabled={!playerAction.trim() || rolling}
                    className="w-full py-3 font-bold rounded-lg"
                    style={{ backgroundColor: playerAction.trim() && !rolling ? 'var(--color-accent)' : 'var(--color-border)', color: 'var(--color-bg)' }}>
                    {rolling ? `Rolling... ${diceRoll}` : 'Roll d20 & Act'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </Layout>
    );
  }

  return null;
}
