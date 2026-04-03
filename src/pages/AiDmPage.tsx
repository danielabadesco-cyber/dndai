import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';

type Phase = 'setup' | 'playing' | 'ended';
type CampaignLength = 'short' | 'regular' | 'long';

interface ActionEntry {
  action: string;
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
  maxTurns: number;
  turns: TurnEntry[];
  currentEnemyHp: number;
  currentEnemyMaxHp: number;
  currentEnemy: string;
  playerHp: number;
  playerMaxHp: number;
  playerPotions: number;
  playerPoweredUp: boolean;
  createdAt: string;
}

const AIDM_KEY = 'dndai_aidm_sessions';

function getSessions(): AiDmSession[] {
  const data = localStorage.getItem(AIDM_KEY);
  return data ? JSON.parse(data) : [];
}

function saveSession(session: AiDmSession) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.push(session);
  localStorage.setItem(AIDM_KEY, JSON.stringify(sessions));
}

function deleteSession(id: string) {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(AIDM_KEY, JSON.stringify(sessions));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---- SCENE & ENEMY DATA ----

const locationPool = [
  'a narrow cave passage lit by glowing mushrooms',
  'the ruins of an old temple half-sunken into mud',
  'a dense forest clearing where the trees seem to watch',
  'a crumbling bridge over a bottomless chasm',
  'an abandoned fortress with scorch marks on the walls',
  'a frozen lake with something moving beneath the ice',
  'a throne room covered in dust and cobwebs',
  'a swamp where the fog is so thick you can barely see',
  'a cliffside path with strong winds',
  'a library where the books whisper',
  'a graveyard where the ground is freshly disturbed',
  'a mining tunnel that keeps branching deeper',
  'a massive tree with a door carved into its trunk',
  'a village where everyone stands perfectly still',
  'a tower that seems taller on the inside',
];

const enemyPool = [
  { name: 'Goblin Pack', hp: 15, desc: 'A group of snarling goblins with rusty weapons' },
  { name: 'Skeleton Warriors', hp: 20, desc: 'Rattling skeletons rise from the ground, swords drawn' },
  { name: 'Giant Spider', hp: 25, desc: 'A massive spider drops from above, fangs dripping venom' },
  { name: 'Bandit Leader', hp: 22, desc: 'A scarred bandit steps forward, flanked by thugs' },
  { name: 'Ogre', hp: 35, desc: 'A hulking ogre smashes through a wall, roaring' },
  { name: 'Dark Spirit', hp: 18, desc: 'A shadowy spirit materializes, whispering threats' },
  { name: 'Wolf Pack', hp: 16, desc: 'Wolves circle the party, growling low and hungry' },
  { name: 'Cultist Mage', hp: 20, desc: 'A robed figure chants dark words, energy crackling around them' },
  { name: 'Mimic', hp: 22, desc: 'The chest opens to reveal rows of teeth — it\'s alive!' },
  { name: 'Troll', hp: 30, desc: 'A regenerating troll lumbers forward, wounds closing as fast as they open' },
  { name: 'Wraith', hp: 24, desc: 'A ghostly figure phases through the wall, its touch freezing cold' },
  { name: 'Dragon Wyrmling', hp: 40, desc: 'A young dragon lands before the party, smoke rising from its nostrils' },
];

const bossPool = [
  { name: 'The Shadow King', hp: 50, desc: 'A towering figure made of pure darkness rises before the party. The final battle has begun.' },
  { name: 'Ancient Dragon', hp: 60, desc: 'A massive ancient dragon unfurls its wings. The ground shakes with each step.' },
  { name: 'The Lich Lord', hp: 45, desc: 'A skeletal mage in rotting robes floats above a runic circle. Undead magic pulses from every direction.' },
  { name: 'Demon Prince', hp: 55, desc: 'A horned demon tears through a portal, flames licking its body. This is the source of all the evil.' },
];

const discoveryPool = [
  'There\'s a chest nearby. It might have supplies.',
  'Glowing runes on the floor pulse with energy.',
  'A wounded traveler lies against the wall, still breathing.',
  'Strange symbols cover the walls — warnings, maybe.',
  'A magical item sits on a pedestal, humming.',
  'A journal lies open on the ground.',
  'An old weapon is embedded in the wall.',
  'A healing spring bubbles from a crack in the stone.',
  'Herbs grow along the path — some look medicinal.',
  'A merchant\'s abandoned cart sits here, still stocked.',
];

// ---- CONNECTED SCENE GENERATION ----

function generateScene(session: AiDmSession): { scene: string; enemy: { name: string; hp: number } } {
  const turnNum = session.turns.length + 1;
  const progress = turnNum / session.maxTurns;
  const lastTurn = session.turns.length > 0 ? session.turns[session.turns.length - 1] : null;
  const lastActions = lastTurn ? lastTurn.actions : [];
  const lastOutcome = lastActions.length > 0 ? lastActions[lastActions.length - 1].outcome : '';
  const location = pick(locationPool);

  // Final boss
  if (progress >= 0.9) {
    const boss = pick(bossPool);
    const connection = lastOutcome
      ? `The trail from the last encounter leads here. ${lastOutcome.includes('down') || lastOutcome.includes('defeated') ? 'After defeating the previous threat, ' : 'Still recovering from the last fight, '}the party pushes forward to ${location}.`
      : `The party arrives at ${location}.`;
    return {
      scene: `FINAL CONFRONTATION — Turn ${turnNum}/${session.maxTurns}. ${connection} ${boss.desc} This is the source of everything connected to "${session.storyline.slice(0, 60)}". End this now.`,
      enemy: { name: boss.name, hp: boss.hp },
    };
  }

  const enemy = pick(enemyPool);

  // First turn
  if (!lastTurn) {
    return {
      scene: `The adventure begins at ${location}. The air is tense. Based on "${session.storyline.slice(0, 80)}", something dangerous lurks here. ${enemy.desc}. ${pick(discoveryPool)}`,
      enemy: { name: enemy.name, hp: enemy.hp },
    };
  }

  // Connect to previous turn
  const wasDefeated = lastActions.some(a => a.outcome.toLowerCase().includes('down') || a.outcome.toLowerCase().includes('defeated') || a.outcome.toLowerCase().includes('taken down') || a.outcome.toLowerCase().includes('collapses'));
  const wasHurt = lastActions.some(a => a.outcome.toLowerCase().includes('fail') || a.outcome.toLowerCase().includes('miss') || a.outcome.toLowerCase().includes('disaster'));

  let connection: string;
  if (wasDefeated) {
    connection = `After defeating the ${session.currentEnemy || 'enemy'}, the party catches their breath and moves on. They arrive at ${location}.`;
  } else if (wasHurt) {
    connection = `Battered from the last fight with the ${session.currentEnemy || 'enemy'}, the party presses forward to ${location}. They need to be more careful.`;
  } else {
    connection = `The party continues their journey. The events of the last encounter still fresh in their minds, they reach ${location}.`;
  }

  // Mid-game gets harder
  const scaledHp = Math.round(enemy.hp * (1 + progress * 0.5));

  // Add storyline connection occasionally
  const storylineHook = progress > 0.3 && Math.random() > 0.5
    ? ` Something about this place connects to "${session.storyline.slice(0, 60)}" — the signs are getting clearer.`
    : '';

  return {
    scene: `${connection} ${enemy.desc}.${storylineHook} ${Math.random() > 0.5 ? pick(discoveryPool) : ''}`.trim(),
    enemy: { name: enemy.name, hp: scaledHp },
  };
}

// ---- OUTCOME GENERATION ----

function parseAction(actions: string) {
  const lower = actions.toLowerCase();
  const whoMatch = lower.match(/^([\w\s]+?)\s+(throws?|attacks?|casts?|shoots?|swings?|stabs?|slashe?s?|kicks?|punche?s?|pushes?|pulls?|grabs?|picks?\s*up|runs?|jumps?|dodges?|blocks?|hides?|sneaks?|climbs?|opens?|closes?|breaks?|cuts?|fires?|uses?|drinks?|eats?|reads?|touches?|lifts?|drops?|slams?|smashes?|charges?|tackles?|bites?|claws?|heals?|shields?|parries?|rolls?|dives?|searches?|examines?|inspects?|looks?)\b/i);
  const who = whoMatch ? whoMatch[1].trim() : 'The player';
  const verbMatch = lower.match(/\b(throws?|attacks?|casts?|shoots?|swings?|stabs?|slashe?s?|kicks?|punche?s?|pushes?|pulls?|grabs?|picks?\s*up|runs?|jumps?|dodges?|blocks?|hides?|sneaks?|climbs?|opens?|closes?|breaks?|cuts?|fires?|uses?|drinks?|eats?|reads?|touches?|lifts?|drops?|slams?|smashes?|charges?|tackles?|bites?|claws?|heals?|shields?|parries?|rolls?|dives?|searches?|examines?|inspects?|looks?)\b/);
  const verb = verbMatch ? verbMatch[1] : 'acts';
  const objectMatch = lower.match(/(?:throws?|swings?|fires?|shoots?|casts?|uses?|grabs?|picks?\s*up|lifts?|drops?|slams?|smashes?)\s+(?:a\s+|an\s+|the\s+|his\s+|her\s+|their\s+)?([\w\s]+?)(?:\s+(?:at|toward|into|onto|against|on|over|through)\b|$)/);
  const object = objectMatch ? objectMatch[1].trim() : '';
  const targetMatch = lower.match(/(?:at|toward|against|on|into|onto)\s+(?:a\s+|an\s+|the\s+|one\s+of\s+the\s+)?([\w\s]+?)(?:\.|,|!|$)/);
  const target = targetMatch ? targetMatch[1].trim() : '';
  return { who, verb, object, target };
}

function generateOutcome(roll: number, action: string, enemyName: string, enemyHp: number, poweredUp: boolean): { text: string; damage: number; enemyDamage: number } {
  const { who, verb, object } = parseAction(action);
  const obj = object || 'the attack';
  const baseDmg = poweredUp ? 2 : 0;

  if (roll === 20) {
    const dmg = 12 + baseDmg;
    return {
      text: `NATURAL 20! ${who} ${verb}s with perfection! The ${obj} hits the ${enemyName} dead on — devastating impact! ${enemyHp - dmg <= 0 ? `The ${enemyName} collapses! Defeated!` : `The ${enemyName} staggers, badly wounded (${Math.max(0, enemyHp - dmg)} HP left).`}`,
      damage: dmg,
      enemyDamage: 0,
    };
  }
  if (roll >= 17) {
    const dmg = 8 + baseDmg;
    return {
      text: `Strong hit! ${who} ${verb}s and the ${obj} connects hard with the ${enemyName}. ${enemyHp - dmg <= 0 ? `The ${enemyName} goes down!` : `The ${enemyName} takes heavy damage (${Math.max(0, enemyHp - dmg)} HP left).`}`,
      damage: dmg,
      enemyDamage: 0,
    };
  }
  if (roll >= 13) {
    const dmg = 5 + baseDmg;
    return {
      text: `Solid hit! ${who} ${verb}s and lands the ${obj} on the ${enemyName}. Good damage dealt. ${enemyHp - dmg <= 0 ? `The ${enemyName} falls!` : `The ${enemyName} winces (${Math.max(0, enemyHp - dmg)} HP left).`}`,
      damage: dmg,
      enemyDamage: 0,
    };
  }
  if (roll >= 8) {
    const dmg = 2 + baseDmg;
    const eDmg = 3;
    return {
      text: `Partial hit. ${who} ${verb}s but the ${obj} only grazes the ${enemyName} (${Math.max(0, enemyHp - dmg)} HP left). The ${enemyName} retaliates — strikes back for ${eDmg} damage!`,
      damage: dmg,
      enemyDamage: eDmg,
    };
  }
  if (roll >= 4) {
    const eDmg = 5;
    return {
      text: `Miss! ${who} ${verb}s but the ${obj} misses the ${enemyName} completely. The ${enemyName} takes advantage and attacks — ${eDmg} damage to the party!`,
      damage: 0,
      enemyDamage: eDmg,
    };
  }
  if (roll === 1) {
    const eDmg = 8;
    return {
      text: `CRITICAL FAIL! ${who} ${verb}s but it goes horribly wrong — ${who} stumbles and the ${enemyName} strikes hard! ${eDmg} damage taken! The ${enemyName} looks stronger than ever.`,
      damage: 0,
      enemyDamage: eDmg,
    };
  }
  const eDmg = 6;
  return {
    text: `Bad miss. The ${obj} doesn't connect. The ${enemyName} counterattacks for ${eDmg} damage.`,
    damage: 0,
    enemyDamage: eDmg,
  };
}

// ---- COMPONENT ----

export default function AiDmPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessions, setSessions] = useState<AiDmSession[]>([]);
  const [storyline, setStoryline] = useState('');
  const [length, setLength] = useState<CampaignLength>('regular');
  const [session, setSession] = useState<AiDmSession | null>(null);
  const [currentScene, setCurrentScene] = useState('');
  const [playerAction, setPlayerAction] = useState('');
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [outcome, setOutcome] = useState('');
  const [rolling, setRolling] = useState(false);
  const [lastActionType, setLastActionType] = useState<string>('');

  useEffect(() => { setSessions(getSessions()); }, []);

  const lengthTurns: Record<CampaignLength, number> = { short: 8, regular: 15, long: 25 };

  function doSave(s: AiDmSession) { saveSession(s); setSession({ ...s }); }

  function startNewSession() {
    if (!storyline.trim()) return;
    const maxTurns = lengthTurns[length];
    const newSession: AiDmSession = {
      id: uuidv4(), storyline: storyline.trim(), length, maxTurns,
      turns: [], currentEnemyHp: 0, currentEnemyMaxHp: 0, currentEnemy: '',
      playerHp: 30, playerMaxHp: 30, playerPotions: 3, playerPoweredUp: false,
      createdAt: new Date().toISOString(),
    };
    const { scene, enemy } = generateScene(newSession);
    newSession.currentEnemy = enemy.name;
    newSession.currentEnemyHp = enemy.hp;
    newSession.currentEnemyMaxHp = enemy.hp;
    newSession.turns.push({ id: uuidv4(), turn: 1, situation: scene, actions: [], resolved: false });
    doSave(newSession);
    setCurrentScene(scene);
    setPhase('playing');
  }

  function resumeSession(s: AiDmSession) {
    setSession(s);
    const currentTurn = s.turns[s.turns.length - 1];
    if (s.turns.filter(t => t.resolved).length >= s.maxTurns || s.playerHp <= 0) {
      setPhase('ended');
    } else {
      setCurrentScene(currentTurn?.situation || '');
      setPhase('playing');
    }
  }

  function advanceToNextTurn(s: AiDmSession) {
    // Mark current turn resolved
    const turns = [...s.turns];
    turns[turns.length - 1].resolved = true;

    const updated = { ...s, turns, playerPoweredUp: false };

    if (turns.filter(t => t.resolved).length >= s.maxTurns || s.playerHp <= 0) {
      doSave(updated);
      setPhase('ended');
      return;
    }

    // Generate next scene
    const { scene, enemy } = generateScene(updated);
    updated.currentEnemy = enemy.name;
    updated.currentEnemyHp = enemy.hp;
    updated.currentEnemyMaxHp = enemy.hp;
    updated.turns.push({ id: uuidv4(), turn: turns.filter(t => t.resolved).length + 1, situation: scene, actions: [], resolved: false });
    doSave(updated);
    setCurrentScene(scene);
    setOutcome('');
    setPlayerAction('');
    setDiceRoll(null);
    setLastActionType('');
  }

  // ---- QUICK ACTIONS (no dice, no turn advance) ----

  function handleLookAround() {
    if (!session) return;
    const finds = [
      'You look around carefully. You spot a loose stone in the wall — there might be something behind it.',
      'Looking around, you notice scratch marks on the floor leading to a hidden passage.',
      `You scan the area. The ${session.currentEnemy} has a blind spot on its left side.`,
      'You find some old arrows scattered on the ground. Could be useful.',
      'Looking around, you see a chandelier hanging above the enemy — it looks unstable.',
      'You notice a healing herb growing in a crack. You grab it. (+2 HP)',
      'Looking carefully, you spot a weakness in the enemy\'s armor — a gap near the shoulder.',
      'You find nothing special, but you feel more aware of your surroundings.',
    ];
    const find = pick(finds);
    const isHeal = find.includes('+2 HP');
    const updated = { ...session };
    if (isHeal) updated.playerHp = Math.min(updated.playerMaxHp, updated.playerHp + 2);

    const currentTurn = updated.turns[updated.turns.length - 1];
    currentTurn.actions.push({ action: 'Look around', diceRoll: 0, outcome: find, type: 'explore' });
    doSave(updated);
    setOutcome(find);
    setLastActionType('explore');
  }

  function handleDrinkPotion() {
    if (!session || session.playerPotions <= 0) return;
    const heal = 8 + Math.floor(Math.random() * 5);
    const updated = { ...session };
    updated.playerPotions -= 1;
    updated.playerHp = Math.min(updated.playerMaxHp, updated.playerHp + heal);

    const text = `You drink a healing potion. Warmth spreads through your body. +${heal} HP restored! (${updated.playerPotions} potions left)`;
    const currentTurn = updated.turns[updated.turns.length - 1];
    currentTurn.actions.push({ action: 'Drink potion', diceRoll: 0, outcome: text, type: 'utility' });
    doSave(updated);
    setOutcome(text);
    setLastActionType('utility');
  }

  function handlePowerUp() {
    if (!session || session.playerPoweredUp) return;
    const updated = { ...session, playerPoweredUp: true };
    const texts = [
      'You focus your energy. Your weapons glow with power. Next attacks deal +2 bonus damage this encounter!',
      'You channel your inner strength. A surge of power flows through you. +2 damage on all attacks this encounter!',
      'You enter a battle stance. Your muscles tighten, your focus sharpens. Powered up — +2 damage!',
    ];
    const text = pick(texts);
    const currentTurn = updated.turns[updated.turns.length - 1];
    currentTurn.actions.push({ action: 'Power up', diceRoll: 0, outcome: text, type: 'utility' });
    doSave(updated);
    setOutcome(text);
    setLastActionType('utility');
  }

  function handleDodge() {
    if (!session) return;
    const roll = Math.floor(Math.random() * 20) + 1;
    const updated = { ...session };
    let text: string;
    if (roll >= 12) {
      text = `You ready yourself to dodge (rolled ${roll}). You\'re prepared — the next enemy attack will miss!`;
    } else {
      const dmg = 2;
      updated.playerHp = Math.max(0, updated.playerHp - dmg);
      text = `You try to dodge (rolled ${roll}) but stumble slightly. The ${session.currentEnemy} clips you for ${dmg} damage.`;
    }
    const currentTurn = updated.turns[updated.turns.length - 1];
    currentTurn.actions.push({ action: 'Dodge/Defend', diceRoll: roll, outcome: text, type: 'combat' });
    doSave(updated);
    setOutcome(text);
    setDiceRoll(roll);
    setLastActionType('combat');
  }

  // ---- MAIN COMBAT ACTION ----

  async function handleRollAndResolve() {
    if (!session || !playerAction.trim()) return;
    setRolling(true);

    let finalRoll = 1;
    for (let i = 0; i < 10; i++) {
      finalRoll = Math.floor(Math.random() * 20) + 1;
      setDiceRoll(finalRoll);
      await new Promise(r => setTimeout(r, 80));
    }
    setRolling(false);

    const result = generateOutcome(finalRoll, playerAction.trim(), session.currentEnemy, session.currentEnemyHp, session.playerPoweredUp);
    const updated = { ...session };
    updated.currentEnemyHp = Math.max(0, updated.currentEnemyHp - result.damage);
    updated.playerHp = Math.max(0, updated.playerHp - result.enemyDamage);

    const currentTurn = updated.turns[updated.turns.length - 1];
    currentTurn.actions.push({ action: playerAction.trim(), diceRoll: finalRoll, outcome: result.text, type: 'combat' });
    doSave(updated);
    setOutcome(result.text);
    setLastActionType('combat');
    setPlayerAction('');
  }

  function getOutcomeColor(roll: number | null): string {
    if (!roll) return 'var(--color-text-muted)';
    if (roll === 20) return '#FFD700';
    if (roll >= 13) return '#3a9e3a';
    if (roll >= 8) return '#d4a017';
    if (roll === 1) return '#8b0000';
    return '#c0392b';
  }

  // ---- SETUP VIEW ----
  if (phase === 'setup') {
    return (
      <Layout title="AI DM" showBack>
        <div className="space-y-4 stagger-in">
          <div className="text-center py-4">
            <h2 className="text-xl mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)', fontWeight: 900 }}>
              AI DUNGEON MASTER
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>The AI runs the game. You play.</p>
          </div>

          {sessions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Continue a Session</h3>
              {sessions.map(s => (
                <div key={s.id} className="rounded-lg p-3 card-hover flex items-center justify-between"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex-1 cursor-pointer" onClick={() => resumeSession(s)}>
                    <p className="font-bold text-sm">{s.storyline.slice(0, 50)}...</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Turn {s.turns.filter(t => t.resolved).length}/{s.maxTurns} &middot; {s.length} &middot; HP: {s.playerHp}/{s.playerMaxHp}
                    </p>
                  </div>
                  <button onClick={() => { deleteSession(s.id); setSessions(getSessions()); }} className="text-xs px-2 py-1"
                    style={{ background: 'none', color: 'var(--color-danger)' }}>Delete</button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-accent)' }}>New Session</h3>
            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Storyline / Theme</label>
              <textarea value={storyline} onChange={e => setStoryline(e.target.value)} rows={4}
                placeholder="e.g. Demon Slayer: fight demons, protect your sister, grow stronger through training..." />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Campaign Length</label>
              <div className="flex gap-2">
                {(['short', 'regular', 'long'] as const).map(l => (
                  <button key={l} onClick={() => setLength(l)} className="flex-1 py-3 rounded-lg text-center"
                    style={{ backgroundColor: length === l ? 'var(--color-primary)' : 'var(--color-surface-light)', color: length === l ? 'white' : 'var(--color-text-muted)' }}>
                    <div className="font-bold text-sm capitalize">{l}</div>
                    <div className="text-xs">{lengthTurns[l]} turns</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={startNewSession} disabled={!storyline.trim()} className="w-full py-3 font-bold rounded-lg"
              style={{ backgroundColor: storyline.trim() ? 'var(--color-accent)' : 'var(--color-border)', color: 'var(--color-bg)' }}>
              Start Adventure
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ---- ENDED VIEW ----
  if (phase === 'ended' && session) {
    const won = session.playerHp > 0;
    return (
      <Layout title={won ? 'Victory!' : 'Defeated...'} showBack>
        <div className="space-y-4 stagger-in">
          <div className="text-center py-6">
            <h2 className="text-xl mb-2" style={{ fontFamily: 'var(--font-heading)', color: won ? 'var(--color-accent)' : 'var(--color-danger)', fontWeight: 900 }}>
              {won ? 'ADVENTURE COMPLETE' : 'YOU HAVE FALLEN'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {session.turns.filter(t => t.resolved).length} encounters &middot; {session.length} campaign
            </p>
          </div>
          <div className="space-y-3">
            {session.turns.filter(t => t.actions.length > 0).map((turn) => (
              <div key={turn.id} className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-accent)' }}>Encounter {turn.turn}</p>
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>{turn.situation.slice(0, 100)}...</p>
                {turn.actions.map((a, i) => (
                  <p key={i} className="text-xs mb-1" style={{ color: a.diceRoll ? getOutcomeColor(a.diceRoll) : 'var(--color-text-muted)' }}>
                    {a.action}: {a.outcome.slice(0, 100)}...
                  </p>
                ))}
              </div>
            ))}
          </div>
          <button onClick={() => { setSession(null); setPhase('setup'); setSessions(getSessions()); }}
            className="w-full py-3 font-bold rounded-lg" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}>
            Back to Menu
          </button>
        </div>
      </Layout>
    );
  }

  // ---- PLAYING VIEW ----
  if (phase === 'playing' && session) {
    const resolvedCount = session.turns.filter(t => t.resolved).length;
    const progress = resolvedCount / session.maxTurns;
    const enemyDefeated = session.currentEnemyHp <= 0;
    const playerDead = session.playerHp <= 0;

    if (playerDead) {
      setTimeout(() => setPhase('ended'), 500);
    }

    return (
      <Layout title="AI DM" showBack>
        <div className="space-y-3 stagger-in">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <span>Encounter {resolvedCount + 1} / {session.maxTurns}</span>
              <span>{session.maxTurns - resolvedCount} left</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-light)' }}>
              <div className="h-2 rounded-full transition-all" style={{
                width: `${progress * 100}%`,
                backgroundColor: progress >= 0.8 ? 'var(--color-danger)' : 'var(--color-accent)',
              }} />
            </div>
          </div>

          {/* HP Bars */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg p-2" style={{ backgroundColor: 'var(--color-surface)' }}>
              <p className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>YOU</p>
              <div className="w-full h-2 rounded-full mt-1" style={{ backgroundColor: 'var(--color-surface-light)' }}>
                <div className="h-2 rounded-full transition-all" style={{
                  width: `${(session.playerHp / session.playerMaxHp) * 100}%`,
                  backgroundColor: session.playerHp > 15 ? '#3a9e3a' : session.playerHp > 8 ? '#d4a017' : '#c0392b',
                }} />
              </div>
              <p className="text-xs mt-1">{session.playerHp}/{session.playerMaxHp} HP</p>
            </div>
            <div className="flex-1 rounded-lg p-2" style={{ backgroundColor: 'var(--color-surface)' }}>
              <p className="text-xs font-bold" style={{ color: 'var(--color-danger)' }}>{session.currentEnemy}</p>
              <div className="w-full h-2 rounded-full mt-1" style={{ backgroundColor: 'var(--color-surface-light)' }}>
                <div className="h-2 rounded-full transition-all" style={{
                  width: `${(session.currentEnemyHp / session.currentEnemyMaxHp) * 100}%`,
                  backgroundColor: '#c0392b',
                }} />
              </div>
              <p className="text-xs mt-1">{session.currentEnemyHp}/{session.currentEnemyMaxHp} HP</p>
            </div>
          </div>

          {/* Scene */}
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-accent)' }}>What's Happening</h3>
            <p className="text-sm">{currentScene}</p>
          </div>

          {/* Last outcome */}
          {outcome && (
            <div className="rounded-lg p-3" style={{
              backgroundColor: lastActionType === 'utility' ? 'rgba(0,204,102,0.1)' : lastActionType === 'explore' ? 'rgba(100,149,237,0.1)' : `${getOutcomeColor(diceRoll)}15`,
              borderLeft: `3px solid ${lastActionType === 'utility' ? 'var(--color-accent)' : lastActionType === 'explore' ? 'cornflowerblue' : getOutcomeColor(diceRoll)}`,
            }}>
              {diceRoll && lastActionType === 'combat' && (
                <span className="text-xs font-bold" style={{ color: getOutcomeColor(diceRoll) }}>d20: {diceRoll} &middot; </span>
              )}
              <span className="text-sm">{outcome}</span>
            </div>
          )}

          {/* Enemy defeated — advance */}
          {enemyDefeated && !playerDead ? (
            <div className="space-y-2">
              <div className="text-center py-2">
                <p className="font-bold" style={{ color: 'var(--color-accent)' }}>Enemy Defeated!</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>The {session.currentEnemy} has been slain.</p>
              </div>
              <button onClick={() => advanceToNextTurn(session)} className="w-full py-3 font-bold rounded-lg"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                {resolvedCount + 1 >= session.maxTurns ? 'See Adventure Summary' : 'Continue to Next Encounter'}
              </button>
            </div>
          ) : !playerDead && (
            <>
              {/* Quick action buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button onClick={handleLookAround} className="py-2 px-1 rounded-lg text-xs font-bold text-center"
                  style={{ backgroundColor: 'var(--color-surface-light)', color: 'cornflowerblue', border: '1px solid rgba(100,149,237,0.3)' }}>
                  Look Around
                </button>
                <button onClick={handleDrinkPotion} disabled={session.playerPotions <= 0}
                  className="py-2 px-1 rounded-lg text-xs font-bold text-center"
                  style={{ backgroundColor: 'var(--color-surface-light)', color: session.playerPotions > 0 ? '#3a9e3a' : 'var(--color-border)', border: `1px solid ${session.playerPotions > 0 ? 'rgba(58,158,58,0.3)' : 'var(--color-border)'}` }}>
                  Potion ({session.playerPotions})
                </button>
                <button onClick={handlePowerUp} disabled={session.playerPoweredUp}
                  className="py-2 px-1 rounded-lg text-xs font-bold text-center"
                  style={{ backgroundColor: 'var(--color-surface-light)', color: session.playerPoweredUp ? 'var(--color-border)' : '#FFD700', border: `1px solid ${session.playerPoweredUp ? 'var(--color-border)' : 'rgba(255,215,0,0.3)'}` }}>
                  {session.playerPoweredUp ? 'Powered!' : 'Power Up'}
                </button>
                <button onClick={handleDodge} className="py-2 px-1 rounded-lg text-xs font-bold text-center"
                  style={{ backgroundColor: 'var(--color-surface-light)', color: 'var(--color-warning)', border: '1px solid rgba(181,163,106,0.3)' }}>
                  Dodge
                </button>
              </div>

              {/* Custom action */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Your Action
                </label>
                <textarea value={playerAction} onChange={e => setPlayerAction(e.target.value)} rows={2}
                  placeholder="I swing my sword at the enemy, I cast fireball, I throw a rock..." />
              </div>
              <button onClick={handleRollAndResolve} disabled={!playerAction.trim() || rolling}
                className="w-full py-3 font-bold rounded-lg"
                style={{ backgroundColor: playerAction.trim() && !rolling ? 'var(--color-accent)' : 'var(--color-border)', color: 'var(--color-bg)' }}>
                {rolling ? `Rolling... ${diceRoll}` : 'Roll d20 & Attack'}
              </button>
            </>
          )}
        </div>
      </Layout>
    );
  }

  return null;
}
