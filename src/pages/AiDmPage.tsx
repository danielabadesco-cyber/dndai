import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';

type Phase = 'setup' | 'playing' | 'ended';
type CampaignLength = 'short' | 'regular' | 'long';

interface TurnEntry {
  id: string;
  turn: number;
  situation: string;
  playerAction: string;
  diceRoll: number;
  outcome: string;
}

interface AiDmSession {
  id: string;
  storyline: string;
  length: CampaignLength;
  maxTurns: number;
  turns: TurnEntry[];
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

// ---- Scene generation ----

const locations = [
  'a narrow cave passage lit by glowing mushrooms',
  'the ruins of an old temple, half-sunken into mud',
  'a dense forest clearing where the trees seem to watch',
  'a crumbling bridge over a bottomless chasm',
  'a bustling underground market full of shady merchants',
  'an abandoned fortress with scorch marks on the walls',
  'a frozen lake with something moving beneath the ice',
  'a throne room covered in dust and cobwebs',
  'a swamp where the fog is so thick you can barely see',
  'a cliffside path with strong winds pushing everyone around',
  'a library where the books whisper when you get close',
  'a graveyard where the ground is freshly disturbed',
  'a tavern that has been barricaded from the inside',
  'a mining tunnel that keeps branching deeper underground',
  'a battlefield littered with old weapons and bones',
  'a massive tree with a door carved into its trunk',
  'a river of glowing water flowing through a dark canyon',
  'a village where everyone stands perfectly still, staring',
  'a tower that seems taller on the inside than the outside',
  'a crossroads where three paths lead into darkness',
];

const threats = [
  'A group of goblins appears, weapons drawn.',
  'A massive creature stirs in the darkness ahead.',
  'Bandits emerge from hiding, blocking the path.',
  'The ground cracks open and skeletal hands reach out.',
  'A hooded figure steps forward and demands something.',
  'Poisonous gas starts seeping from the walls.',
  'A trap triggers — arrows fly from the walls.',
  'An ogre smashes through a wall, roaring.',
  'Wolves circle the party, growling low.',
  'A rival adventurer challenges the party.',
  'The ceiling begins to collapse.',
  'A dark spirit materializes, whispering threats.',
  'Vines shoot from the ground, trying to grab everyone.',
  'A dragon\'s shadow passes overhead.',
  'The door slams shut. Something locks it from the other side.',
];

const discoveries = [
  'There\'s a chest in the corner, but something about it feels off.',
  'A glowing rune is etched into the floor.',
  'A wounded NPC lies against the wall, barely conscious.',
  'A map is pinned to the wall showing a hidden location.',
  'Strange symbols are carved everywhere — some kind of warning.',
  'A magical item sits on a pedestal, pulsing with energy.',
  'Footprints lead in two different directions.',
  'A journal is found with entries that stop mid-sentence.',
  'An old weapon is stuck in the wall, still humming with power.',
  'A mirror shows a reflection of a different place entirely.',
];

const twists = [
  'But something feels wrong — this is too easy.',
  'Then the lights go out.',
  'A distant explosion shakes the ground.',
  'Someone — or something — is following the party.',
  'The weather changes suddenly. A storm is coming.',
  'An NPC the party trusted earlier appears — on the enemy\'s side.',
  'The path behind the party has disappeared.',
  'Time seems to move differently here.',
];

function generateScene(turn: number, maxTurns: number, lastOutcome: string | null): string {
  const location = pick(locations);
  const progress = turn / maxTurns;

  if (turn === 1) {
    return `The adventure begins. The party finds themselves at ${location}. ${pick(discoveries)} ${pick(threats)}`;
  }

  if (progress >= 0.9) {
    return `FINAL CONFRONTATION. After everything the party has been through, they arrive at ${location}. The source of all their problems is here. This is the last stand. ${pick(threats)} There's no turning back now.`;
  }

  if (progress >= 0.7) {
    return `The stakes are getting higher. The party pushes forward to ${location}. ${pick(threats)} ${pick(twists)}`;
  }

  if (progress >= 0.4) {
    return `The party continues deeper into danger. They reach ${location}. ${pick(discoveries)} ${pick(threats)}`;
  }

  // Early game
  const hasLast = lastOutcome ? `After the last encounter, the party moves on. ` : '';
  return `${hasLast}They arrive at ${location}. ${Math.random() > 0.5 ? pick(threats) : pick(discoveries)} ${Math.random() > 0.6 ? pick(twists) : ''}`.trim();
}

// ---- Outcome generation based on dice ----

function parseAction(actions: string) {
  const lower = actions.toLowerCase();
  const whoMatch = lower.match(/^([\w\s]+?)\s+(throws?|attacks?|casts?|shoots?|swings?|stabs?|slashe?s?|kicks?|punche?s?|pushes?|pulls?|grabs?|picks?\s*up|runs?|jumps?|dodges?|blocks?|hides?|sneaks?|climbs?|opens?|closes?|breaks?|cuts?|fires?|uses?|drinks?|eats?|reads?|touches?|lifts?|drops?|slams?|smashes?|charges?|tackles?|bites?|claws?|heals?|shields?|parries?|rolls?|dives?|searches?|examines?|inspects?)\b/i);
  const who = whoMatch ? whoMatch[1].trim() : 'The player';
  const verbMatch = lower.match(/\b(throws?|attacks?|casts?|shoots?|swings?|stabs?|slashe?s?|kicks?|punche?s?|pushes?|pulls?|grabs?|picks?\s*up|runs?|jumps?|dodges?|blocks?|hides?|sneaks?|climbs?|opens?|closes?|breaks?|cuts?|fires?|uses?|drinks?|eats?|reads?|touches?|lifts?|drops?|slams?|smashes?|charges?|tackles?|bites?|claws?|heals?|shields?|parries?|rolls?|dives?|searches?|examines?|inspects?)\b/);
  const verb = verbMatch ? verbMatch[1] : 'acts';
  const objectMatch = lower.match(/(?:throws?|swings?|fires?|shoots?|casts?|uses?|grabs?|picks?\s*up|lifts?|drops?|slams?|smashes?)\s+(?:a\s+|an\s+|the\s+|his\s+|her\s+|their\s+)?([\w\s]+?)(?:\s+(?:at|toward|into|onto|against|on|over|through)\b|$)/);
  const object = objectMatch ? objectMatch[1].trim() : '';
  const targetMatch = lower.match(/(?:at|toward|against|on|into|onto)\s+(?:a\s+|an\s+|the\s+|one\s+of\s+the\s+)?([\w\s]+?)(?:\.|,|!|$)/);
  const target = targetMatch ? targetMatch[1].trim() : '';
  return { who, verb, object, target };
}

function generateSingleOutcome(roll: number, action: string): string {
  const { who, verb, object, target } = parseAction(action);
  const obj = object || 'it';
  const tgt = target || 'the target';

  if (roll === 20) {
    return pick([
      `NATURAL 20! ${who} ${verb}s with absolute perfection. The ${obj} hits ${tgt} with devastating force — a legendary move that turns the tide completely. ${tgt} is taken down in spectacular fashion.`,
      `CRITICAL HIT! ${who} ${verb}s and everything connects perfectly. The ${obj} strikes ${tgt} in their weakest spot. The impact is massive — ${tgt} goes down hard. The party cheers.`,
      `NAT 20! ${who} executes the move flawlessly. The ${obj} finds its mark on ${tgt} with incredible precision. The result is beyond what anyone expected — total domination.`,
    ]);
  }
  if (roll >= 17) {
    return pick([
      `Great success! ${who} ${verb}s and the ${obj} hits ${tgt} solidly. ${tgt} takes a heavy blow — they stagger back, clearly hurt. The party has the upper hand.`,
      `Strong hit! ${who} ${verb}s skillfully. The ${obj} connects with ${tgt}'s weak point. ${tgt} cries out in pain and stumbles. Major damage dealt.`,
    ]);
  }
  if (roll >= 13) {
    return pick([
      `It works! ${who} ${verb}s and the ${obj} hits ${tgt}. Not the cleanest hit, but ${tgt} definitely felt it. They wince and shift their stance — the fight continues but the party is doing well.`,
      `Solid move. ${who} ${verb}s and manages to land the ${obj} on ${tgt}. ${tgt} takes the hit and backs up. Progress is made.`,
    ]);
  }
  if (roll >= 8) {
    return pick([
      `Partial result. ${who} ${verb}s but the ${obj} only grazes ${tgt}. It does a little damage but ${tgt} is still very much in the fight. They smirk and prepare to counter.`,
      `Mixed outcome. ${who} ${verb}s and the ${obj} clips ${tgt}'s side. Some effect, but ${tgt} shakes it off. Not enough to change the situation much.`,
    ]);
  }
  if (roll >= 4) {
    return pick([
      `Miss! ${who} ${verb}s but the ${obj} misses ${tgt} entirely. ${tgt} dodges and now has an opening. The party needs to rethink.`,
      `No luck. ${who} ${verb}s but ${tgt} sees it coming and avoids the ${obj}. The attempt is wasted and ${tgt} looks more confident now.`,
    ]);
  }
  if (roll === 1) {
    return pick([
      `CRITICAL FAIL! ${who} ${verb}s but the ${obj} goes completely wrong — it slips, breaks, or hits the wrong target. ${tgt} takes advantage and strikes back. Things just got much worse.`,
      `NAT 1! Disaster. ${who} tries to ${verb} but everything goes sideways. The ${obj} flies in the wrong direction. ${who} trips, stumbles, or hurts themselves. ${tgt} laughs and prepares to attack.`,
    ]);
  }
  return pick([
    `Bad attempt. ${who} ${verb}s but ${tgt} easily avoids the ${obj}. The miss is embarrassing and ${tgt} uses the moment to close in.`,
    `Failure. ${who} ${verb}s with the ${obj} but it falls short of ${tgt}. Nothing happens except wasted time. ${tgt} is already moving to retaliate.`,
  ]);
}

// ---- COMPONENT ----

export default function AiDmPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessions, setSessions] = useState<AiDmSession[]>([]);

  // Setup state
  const [storyline, setStoryline] = useState('');
  const [length, setLength] = useState<CampaignLength>('regular');

  // Playing state
  const [session, setSession] = useState<AiDmSession | null>(null);
  const [currentScene, setCurrentScene] = useState('');
  const [playerAction, setPlayerAction] = useState('');
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [outcome, setOutcome] = useState('');
  const [rolling, setRolling] = useState(false);
  const [showingOutcome, setShowingOutcome] = useState(false);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const lengthTurns: Record<CampaignLength, number> = {
    short: 8,
    regular: 15,
    long: 25,
  };

  function startNewSession() {
    if (!storyline.trim()) return;
    const maxTurns = lengthTurns[length];
    const newSession: AiDmSession = {
      id: uuidv4(),
      storyline: storyline.trim(),
      length,
      maxTurns,
      turns: [],
      createdAt: new Date().toISOString(),
    };
    saveSession(newSession);
    setSession(newSession);
    setCurrentScene(generateScene(1, maxTurns, null));
    setPhase('playing');
  }

  function resumeSession(s: AiDmSession) {
    setSession(s);
    const lastTurn = s.turns.length > 0 ? s.turns[s.turns.length - 1] : null;
    if (s.turns.length >= s.maxTurns) {
      setPhase('ended');
    } else {
      setCurrentScene(generateScene(s.turns.length + 1, s.maxTurns, lastTurn?.outcome || null));
      setPhase('playing');
    }
  }

  function handleDeleteSession(id: string) {
    if (confirm('Delete this session?')) {
      deleteSession(id);
      setSessions(getSessions());
    }
  }

  async function handleRollAndResolve() {
    if (!session || !playerAction.trim()) return;
    setRolling(true);

    // Animate dice roll
    let finalRoll = 1;
    for (let i = 0; i < 10; i++) {
      finalRoll = Math.floor(Math.random() * 20) + 1;
      setDiceRoll(finalRoll);
      await new Promise(r => setTimeout(r, 80));
    }

    setRolling(false);

    // Generate outcome
    const result = generateSingleOutcome(finalRoll, playerAction.trim());
    setOutcome(result);
    setShowingOutcome(true);

    // Save turn
    const turn: TurnEntry = {
      id: uuidv4(),
      turn: session.turns.length + 1,
      situation: currentScene,
      playerAction: playerAction.trim(),
      diceRoll: finalRoll,
      outcome: result,
    };
    const updated = { ...session, turns: [...session.turns, turn] };
    saveSession(updated);
    setSession(updated);
  }

  function nextTurn() {
    if (!session) return;
    setShowingOutcome(false);
    setOutcome('');
    setPlayerAction('');
    setDiceRoll(null);

    if (session.turns.length >= session.maxTurns) {
      setPhase('ended');
    } else {
      const lastTurn = session.turns[session.turns.length - 1];
      setCurrentScene(generateScene(session.turns.length + 1, session.maxTurns, lastTurn?.outcome || null));
    }
  }

  const outcomeStyles: Record<string, { color: string; label: string }> = {
    '20': { color: '#FFD700', label: 'LEGENDARY' },
    'high': { color: '#3a9e3a', label: 'SUCCESS' },
    'mid': { color: '#d4a017', label: 'PARTIAL' },
    'low': { color: '#c0392b', label: 'FAILURE' },
    '1': { color: '#8b0000', label: 'CRITICAL FAIL' },
  };

  function getOutcomeStyle(roll: number | null) {
    if (!roll) return outcomeStyles['mid'];
    if (roll === 20) return outcomeStyles['20'];
    if (roll >= 13) return outcomeStyles['high'];
    if (roll >= 8) return outcomeStyles['mid'];
    if (roll === 1) return outcomeStyles['1'];
    return outcomeStyles['low'];
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
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              The AI runs the game. You play.
            </p>
          </div>

          {/* Existing sessions */}
          {sessions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Continue a Session
              </h3>
              {sessions.map(s => (
                <div key={s.id} className="rounded-lg p-3 card-hover flex items-center justify-between"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex-1 cursor-pointer" onClick={() => resumeSession(s)}>
                    <p className="font-bold text-sm">{s.storyline.slice(0, 50)}...</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Turn {s.turns.length}/{s.maxTurns} &middot; {s.length}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteSession(s.id)} className="text-xs px-2 py-1"
                    style={{ background: 'none', color: 'var(--color-danger)' }}>Delete</button>
                </div>
              ))}
            </div>
          )}

          {/* New session */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-accent)' }}>
              New Session
            </h3>

            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Storyline / Theme
              </label>
              <textarea
                value={storyline}
                onChange={e => setStoryline(e.target.value)}
                rows={4}
                placeholder="e.g. Demon Slayer: fight demons, protect your sister, grow stronger through training and battles..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Campaign Length
              </label>
              <div className="flex gap-2">
                {(['short', 'regular', 'long'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLength(l)}
                    className="flex-1 py-3 rounded-lg text-center"
                    style={{
                      backgroundColor: length === l ? 'var(--color-primary)' : 'var(--color-surface-light)',
                      color: length === l ? 'white' : 'var(--color-text-muted)',
                    }}
                  >
                    <div className="font-bold text-sm capitalize">{l}</div>
                    <div className="text-xs">{lengthTurns[l]} turns</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startNewSession}
              disabled={!storyline.trim()}
              className="w-full py-3 text-white font-bold rounded-lg"
              style={{ backgroundColor: storyline.trim() ? 'var(--color-accent)' : 'var(--color-border)', color: 'var(--color-bg)' }}
            >
              Start Adventure
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ---- ENDED VIEW ----
  if (phase === 'ended' && session) {
    return (
      <Layout title="Adventure Complete" showBack>
        <div className="space-y-4 stagger-in">
          <div className="text-center py-6">
            <h2 className="text-xl mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)', fontWeight: 900 }}>
              ADVENTURE COMPLETE
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {session.turns.length} turns played &middot; {session.length} campaign
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Adventure Log
            </h3>
            {session.turns.map((turn) => {
              const style = getOutcomeStyle(turn.diceRoll);
              return (
                <div key={turn.id} className="rounded-lg p-3"
                  style={{ backgroundColor: 'var(--color-surface)', borderLeft: `3px solid ${style.color}` }}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    <span>Turn {turn.turn}</span>
                    <span className="font-bold" style={{ color: style.color }}>d20: {turn.diceRoll}</span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{turn.situation.slice(0, 100)}...</p>
                  <p className="text-sm font-semibold mb-1">Action: {turn.playerAction}</p>
                  <p className="text-sm" style={{ color: style.color }}>{turn.outcome.slice(0, 150)}...</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => { setSession(null); setPhase('setup'); setSessions(getSessions()); }}
            className="w-full py-3 font-bold rounded-lg"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
          >
            Back to Menu
          </button>
        </div>
      </Layout>
    );
  }

  // ---- PLAYING VIEW ----
  if (phase === 'playing' && session) {
    const progress = session.turns.length / session.maxTurns;
    const turnsLeft = session.maxTurns - session.turns.length;

    return (
      <Layout title="AI DM" showBack>
        <div className="space-y-4 stagger-in">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <span>Turn {session.turns.length + 1} of {session.maxTurns}</span>
              <span>{turnsLeft} turns left</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-light)' }}>
              <div className="h-2 rounded-full transition-all" style={{
                width: `${progress * 100}%`,
                backgroundColor: progress >= 0.8 ? 'var(--color-danger)' : 'var(--color-accent)',
              }} />
            </div>
          </div>

          {/* Scene */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-accent)' }}>
              What's Happening
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>{currentScene}</p>
          </div>

          {!showingOutcome ? (
            <>
              {/* Player action input */}
              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  What do you do?
                </label>
                <textarea
                  value={playerAction}
                  onChange={e => setPlayerAction(e.target.value)}
                  rows={3}
                  placeholder="I throw my sword at the goblin, I cast fireball, I try to sneak past..."
                />
              </div>

              {/* Roll & Resolve */}
              <button
                onClick={handleRollAndResolve}
                disabled={!playerAction.trim() || rolling}
                className="w-full py-4 font-bold rounded-lg text-lg"
                style={{
                  backgroundColor: playerAction.trim() && !rolling ? 'var(--color-accent)' : 'var(--color-border)',
                  color: 'var(--color-bg)',
                }}
              >
                {rolling ? `Rolling... ${diceRoll}` : 'Roll d20 & See What Happens'}
              </button>
            </>
          ) : (
            <>
              {/* Dice result */}
              <div className="text-center py-2">
                <div className="inline-block px-6 py-3 rounded-xl" style={{
                  backgroundColor: getOutcomeStyle(diceRoll).color + '20',
                  border: `2px solid ${getOutcomeStyle(diceRoll).color}`,
                }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: getOutcomeStyle(diceRoll).color }}>
                    {getOutcomeStyle(diceRoll).label}
                  </p>
                  <p className="text-4xl font-bold" style={{ color: getOutcomeStyle(diceRoll).color, fontFamily: 'var(--font-heading)' }}>
                    {diceRoll}
                  </p>
                </div>
              </div>

              {/* Action recap */}
              <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-surface-light)' }}>
                <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Your Action</p>
                <p className="text-sm">{playerAction}</p>
              </div>

              {/* Outcome */}
              <div className="rounded-lg p-4" style={{
                backgroundColor: getOutcomeStyle(diceRoll).color + '15',
                border: `1px solid ${getOutcomeStyle(diceRoll).color}40`,
              }}>
                <p className="text-xs uppercase font-bold tracking-widest mb-2" style={{ color: getOutcomeStyle(diceRoll).color }}>
                  Outcome
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>{outcome}</p>
              </div>

              {/* Next turn */}
              <button
                onClick={nextTurn}
                className="w-full py-3 font-bold rounded-lg"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                {session.turns.length >= session.maxTurns ? 'See Adventure Summary' : 'Continue Adventure'}
              </button>
            </>
          )}
        </div>
      </Layout>
    );
  }

  return null;
}
