import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';
import type { Campaign, ProgressionEntry, ProgressionOutcome } from '../types';
import { getCampaign, saveCampaign } from '../services/storage';

type View = 'setup' | 'input' | 'results' | 'history';

export default function ProgressionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [view, setView] = useState<View>('input');

  const [storylineBase, setStorylineBase] = useState('');
  const [editingStoryline, setEditingStoryline] = useState(false);

  const [situation, setSituation] = useState('');
  const [playerActions, setPlayerActions] = useState('');
  const [diceRoll, setDiceRoll] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const [currentEntry, setCurrentEntry] = useState<ProgressionEntry | null>(null);

  // Custom outcome
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customNext, setCustomNext] = useState('');

  useEffect(() => {
    if (!id) return;
    const c = getCampaign(id);
    if (!c) { navigate('/'); return; }
    setCampaign(c);
    setStorylineBase(c.storylineBase || '');
    if (!c.storylineBase) setView('setup');
  }, [id, navigate]);

  function save(updated: Campaign) {
    saveCampaign(updated);
    setCampaign({ ...updated });
  }

  function saveStoryline() {
    if (!campaign) return;
    save({ ...campaign, storylineBase });
    setEditingStoryline(false);
    setView('input');
  }

  // Parse the player's action into parts we can use to build specific outcomes
  function parseAction(actions: string) {
    const lower = actions.toLowerCase();

    // Find who is doing it
    const whoMatch = lower.match(/^([\w\s]+?)\s+(throws?|attacks?|casts?|shoots?|swings?|stabs?|slashe?s?|kicks?|punche?s?|pushes?|pulls?|grabs?|picks?\s*up|runs?|jumps?|dodges?|blocks?|hides?|sneaks?|climbs?|opens?|closes?|breaks?|cuts?|fires?|uses?|drinks?|eats?|reads?|touches?|lifts?|drops?|slams?|smashes?|charges?|tackles?|bites?|claws?|heals?|shields?|parries?|rolls?|dives?|searches?|examines?|inspects?)\b/i);
    const who = whoMatch ? whoMatch[1].trim() : 'The player';

    // Find the action verb
    const verbMatch = lower.match(/\b(throws?|attacks?|casts?|shoots?|swings?|stabs?|slashe?s?|kicks?|punche?s?|pushes?|pulls?|grabs?|picks?\s*up|runs?|jumps?|dodges?|blocks?|hides?|sneaks?|climbs?|opens?|closes?|breaks?|cuts?|fires?|uses?|drinks?|eats?|reads?|touches?|lifts?|drops?|slams?|smashes?|charges?|tackles?|bites?|claws?|heals?|shields?|parries?|rolls?|dives?|searches?|examines?|inspects?)\b/);
    const verb = verbMatch ? verbMatch[1] : 'acts';

    // Find what object/weapon/item is being used
    const objectMatch = lower.match(/(?:throws?|swings?|fires?|shoots?|casts?|uses?|grabs?|picks?\s*up|lifts?|drops?|slams?|smashes?)\s+(?:a\s+|an\s+|the\s+|his\s+|her\s+|their\s+)?([\w\s]+?)(?:\s+(?:at|toward|into|onto|against|on|over|through)\b|$)/);
    const object = objectMatch ? objectMatch[1].trim() : '';

    // Find the target
    const targetMatch = lower.match(/(?:at|toward|against|on|into|onto)\s+(?:a\s+|an\s+|the\s+|one\s+of\s+the\s+)?([\w\s]+?)(?:\.|,|!|$)/);
    const target = targetMatch ? targetMatch[1].trim() : '';

    return { who, verb, object, target };
  }

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateOutcomes(roll: number | null, _camp: Campaign, _sit: string, actions: string): ProgressionOutcome[] {
    const r = roll ?? 10;
    const { who, verb, object, target } = parseAction(actions);

    const obj = object || 'it';
    const tgt = target || 'the target';
    const isThrow = /throw/i.test(verb);
    const isAttack = /attack|swing|stab|slash|kick|punch|charge|tackle|bite|claw/i.test(verb);
    const isCast = /cast|use/i.test(verb);
    const isShoot = /shoot|fire/i.test(verb);
    const isMove = /run|jump|dodge|dive|climb|sneak|hide|roll/i.test(verb);
    const isInteract = /grab|pick|push|pull|open|close|break|lift|drop|slam|smash|search|examine|inspect|touch|read/i.test(verb);

    // --- SUCCESS ---
    let successText: string;
    let successNext: string;
    if (r === 20) {
      if (isThrow) {
        successText = `${who} throws the ${obj} with incredible precision. It flies straight and ${pick([
          `smashes right into ${tgt}'s face, stunning them completely and sending them stumbling back`,
          `hits ${tgt} square in the chest, knocking the wind out of them and sending them crashing to the ground`,
          `cracks against ${tgt}'s head with a loud thud, dazing them — they can barely stand`,
          `nails ${tgt} dead center, the impact so hard it knocks them off their feet`
        ])}. A perfect throw.`;
      } else if (isAttack) {
        successText = `${who} ${verb}s with deadly precision. The ${obj || 'strike'} ${pick([
          `cuts deep into ${tgt}, hitting a vital spot — they let out a scream and drop to one knee`,
          `connects with full force, ${tgt} staggers back with a deep wound, clearly in bad shape`,
          `lands a devastating blow on ${tgt}, the impact echoes — bones crack and ${tgt} collapses`,
          `finds the perfect opening and strikes ${tgt} hard, the hit is so clean they don't even see it coming`
        ])}. Masterful execution.`;
      } else if (isCast) {
        successText = `${who} casts ${obj || 'the spell'} flawlessly. ${pick([
          `The magic surges with extra power and ${tgt} is engulfed in the effect — they have no chance to resist`,
          `The spell hits ${tgt} at full force, the magic wraps around them completely, leaving them helpless`,
          `A brilliant flash of energy strikes ${tgt} perfectly, the effect is doubled — far more powerful than expected`,
          `The spell connects perfectly with ${tgt}, the magical energy overloads and the effect is devastating`
        ])}`;
      } else if (isShoot) {
        successText = `${who} fires the ${obj || 'shot'} and it hits ${tgt} ${pick([
          `right between the eyes — a perfect shot that drops them instantly`,
          `in the weak spot, piercing straight through — ${tgt} stumbles and falls`,
          `with pinpoint accuracy, the projectile buries itself deep and ${tgt} goes limp`,
          `dead center — the impact sends ${tgt} spinning backwards`
        ])}.`;
      } else if (isMove) {
        successText = `${who} ${verb}s with perfect timing. ${pick([
          `They move so fast that ${tgt || 'everyone'} doesn't even register what happened until it's too late`,
          `The movement is flawless — exactly where they need to be, exactly when they need to be there`,
          `They pull it off like they've done it a thousand times, gaining a huge advantage in position`
        ])}.`;
      } else if (isInteract) {
        successText = `${who} ${verb}s the ${obj} perfectly. ${pick([
          `It works exactly as intended — ${tgt || 'the obstacle'} gives way immediately`,
          `No resistance at all, the ${obj} responds perfectly and the result is even better than hoped`,
          `A clean success — the ${obj} does exactly what ${who} wanted, and then some`
        ])}.`;
      } else {
        successText = `${who} ${verb}s and it works perfectly. ${pick([
          `The ${obj || 'action'} connects with ${tgt} in the best possible way — couldn't have gone better`,
          `Everything lines up perfectly. ${tgt || 'The target'} is completely affected by the action`,
          `Flawless. The result is exactly what was intended, with a little extra on top`
        ])}.`;
      }
      successNext = `${tgt || 'The target'} is in serious trouble after that hit. This is a huge opening — strike again, help allies, or push forward while the advantage is there.`;
    } else if (r >= 15) {
      successText = isThrow
        ? `${who} throws the ${obj} and it hits ${tgt} solidly. ${pick([`It smacks them in the shoulder, making them lose their grip on their weapon`, `It catches them in the side, forcing them to stumble sideways`, `It hits them in the leg, slowing them down significantly`])}.`
        : isAttack
        ? `${who} ${verb}s and lands a solid hit on ${tgt}. ${pick([`The blow cuts across their arm, drawing blood and weakening their attacks`, `The strike connects with their side, they grunt in pain and back up`, `A strong hit to ${tgt}'s body, they're clearly hurt and getting slower`])}.`
        : isCast
        ? `${who} casts ${obj || 'the spell'} and it hits ${tgt} cleanly. ${pick([`The magic takes hold — ${tgt} is visibly affected and struggling`, `The spell wraps around ${tgt}, limiting their movement and options`, `The energy strikes ${tgt} and they reel from the impact`])}.`
        : isShoot
        ? `${who} fires and the ${obj || 'shot'} hits ${tgt}. ${pick([`It pierces their armor and they stagger back in pain`, `A clean hit — ${tgt} grabs the wound and loses focus`, `The shot lands in their leg, they stumble and slow down`])}.`
        : `${who} ${verb}s and it works well. ${pick([`${tgt || 'The target'} is clearly affected — the action had real impact`, `It goes smoothly and achieves what was intended`, `A strong result — the situation shifts in the party's favor`])}.`;
      successNext = `${tgt || 'The target'} is weakened. Follow up now while they're hurt, or use this moment to reposition.`;
    } else {
      successText = isThrow
        ? `${who} throws the ${obj} and it hits ${tgt}, but just barely. ${pick([`It clips their arm — not a great hit but enough to distract them`, `It bounces off their shoulder, making them flinch for a second`, `It tags them lightly, enough to get their attention but not much damage`])}.`
        : isAttack
        ? `${who} ${verb}s and manages to hit ${tgt}. ${pick([`A shallow cut — it stings but won't slow them down much`, `The blow lands but without much force, ${tgt} shrugs it off partially`, `It connects but at a bad angle — does some damage but not a lot`])}.`
        : `${who} ${verb}s and it works, barely. ${pick([`${tgt || 'The target'} is slightly affected — it did something but nothing dramatic`, `It gets the job done, just not impressively`, `A small win — the action has some effect but there's more work to do`])}.`;
      successNext = `It worked, but the threat isn't gone. Keep the pressure on or try something bigger.`;
    }

    // --- FAILURE ---
    let failText: string;
    let failNext: string;
    if (r === 1) {
      failText = isThrow
        ? `${who} throws the ${obj} and it goes completely wrong. ${pick([
          `The ${obj} slips out of their hand at the wrong angle and flies backwards, almost hitting an ally`,
          `The throw is so bad the ${obj} hits the ceiling/wall and bounces back, landing at ${who}'s feet`,
          `The ${obj} wobbles mid-air and misses ${tgt} entirely, smashing something important nearby instead`,
          `${who}'s grip slips and the ${obj} flies sideways, breaking something the party needed`
        ])}. Embarrassing and dangerous.`
        : isAttack
        ? `${who} ${verb}s at ${tgt} and completely whiffs. ${pick([
          `They overextend and trip, falling flat on the ground right in front of ${tgt}`,
          `The ${obj || 'weapon'} gets stuck in the floor/wall and ${who} has to waste time pulling it out`,
          `They swing so wildly they pull a muscle, the pain makes them drop their guard completely`,
          `The strike misses so badly that ${who} loses balance and crashes into an ally`
        ])}. ${tgt} now has a wide opening.`
        : `${who} ${verb}s and everything goes wrong. ${pick([
          `Not only does it fail, but it backfires — the situation is now worse than before`,
          `The action fails spectacularly and creates a new problem the party didn't have before`,
          `It goes so badly that ${tgt || 'the enemy'} actually benefits from the attempt`
        ])}.`;
      failNext = `Disaster. ${who} is exposed and vulnerable. Someone needs to cover them, or they need to recover fast before ${tgt || 'the enemy'} takes advantage.`;
    } else if (r <= 5) {
      failText = isThrow
        ? `${who} throws the ${obj} but it misses ${tgt} by a lot. ${pick([`It sails over their head and disappears into the darkness`, `It hits the ground way short, skidding to a stop nowhere near ${tgt}`, `The throw is weak and ${tgt} easily sidesteps it`])}.`
        : isAttack
        ? `${who} ${verb}s at ${tgt} but misses completely. ${pick([`${tgt} sees it coming and dodges easily, now they're ready to counter`, `The attack hits nothing but air, and ${who} is off balance`, `${tgt} blocks it without effort and shoves ${who} back`])}.`
        : `${who} ${verb}s but it fails. ${pick([`Nothing happens — the action has no effect on ${tgt || 'the situation'}`, `It doesn't work and ${tgt || 'the enemy'} now knows what ${who} was trying to do`, `The attempt falls flat and wastes valuable time`])}.`;
      failNext = `The miss gave ${tgt || 'the enemy'} confidence. They might press the attack. Get ready to defend or try something different.`;
    } else {
      failText = isThrow
        ? `${who} throws the ${obj} at ${tgt} but it misses. ${pick([`It goes just a bit to the left, close but not enough`, `${tgt} shifts slightly and the ${obj} flies past them`, `The throw was on target but ${tgt} reacted in time to avoid it`])}.`
        : isAttack
        ? `${who} ${verb}s at ${tgt} but doesn't connect. ${pick([`${tgt} pulls back just in time, the strike grazes past them`, `The hit was close but ${tgt} managed to deflect it at the last second`, `${who} commits to the attack but ${tgt} is just slightly out of reach`])}.`
        : `${who} ${verb}s but it doesn't quite work. ${pick([`Almost — but not enough to make a difference`, `Close, but ${tgt || 'the situation'} remains unchanged`, `The attempt fizzles out before having any real effect`])}.`;
      failNext = `It didn't work this time. Try again from a different angle, switch tactics, or have someone else take a shot.`;
    }

    // --- PARTIAL ---
    const partialText = isThrow
      ? `${who} throws the ${obj} at ${tgt}. ${pick([
        `It hits, but only clips ${tgt}'s arm — enough to make them flinch but not enough to stop them. The ${obj} breaks on impact`,
        `The ${obj} hits ${tgt} in the leg, slowing them down but they're still moving. They're limping now but angry`,
        `It connects with ${tgt}'s side but at a bad angle — the ${obj} bounces off. ${tgt} felt it but they're not seriously hurt`,
        `The ${obj} hits ${tgt} and knocks something out of their hand, but ${tgt} themselves is still standing and ready to fight`
      ])}.`
      : isAttack
      ? `${who} ${verb}s at ${tgt} and partially connects. ${pick([
        `The ${obj || 'strike'} cuts ${tgt} but it's a shallow wound — they bleed but they're not going down. They snarl and prepare to retaliate`,
        `The blow glances off ${tgt}'s armor but the force still pushes them back. They're dazed for a moment but recovering`,
        `${who} hits ${tgt} but they moved at the last second — it's a weaker hit than intended. ${tgt} is hurt but still dangerous`,
        `The attack lands on ${tgt}'s arm, making them drop something. But ${tgt} is still on their feet and now they're furious`
      ])}.`
      : isCast
      ? `${who} casts ${obj || 'the spell'} at ${tgt}. ${pick([
        `The spell partially takes effect — ${tgt} is slowed but not fully frozen. They're fighting through it`,
        `The magic hits ${tgt} but they resist some of it. The effect is weaker than expected, but it's something`,
        `The spell works on ${tgt} for a moment then flickers out. They were affected briefly but are recovering`
      ])}.`
      : `${who} ${verb}s and it partially works. ${pick([
        `The action affects ${tgt || 'the situation'} but not fully — the result is halfway there with a complication`,
        `It does something, but not everything ${who} hoped. Part of the goal is achieved but there's a new problem`,
        `Some effect on ${tgt || 'the target'}, but they're not out of the fight. The situation shifted but not completely`
      ])}.`;
    const partialNext = `${tgt || 'The target'} is hurt but not done. Either finish what was started or switch to deal with the complication.`;

    // --- WILDCARD ---
    const wildcardText = isThrow
      ? `${who} throws the ${obj} at ${tgt} but ${pick([
        `it misses and smashes into a support beam — the ceiling starts cracking and chunks of debris rain down on the whole area, ${tgt} included`,
        `it hits a lantern on the way, spilling oil everywhere. The ${obj} sparks on impact and now there's a growing fire between the party and ${tgt}`,
        `it ricochets off ${tgt}'s armor and hits something behind them — a cage door swings open and something else comes out`,
        `the ${obj} breaks open on impact and something was inside it — a cloud of dust/gas fills the area, blinding everyone including ${tgt}`,
        `it misses ${tgt} but hits a hidden switch on the wall. Something mechanical clicks and the room starts to change`
      ])}.`
      : isAttack
      ? `${who} ${verb}s at ${tgt} and ${pick([
        `the strike hits the ground instead, cracking the floor — the surface gives way and both ${who} and ${tgt} start sliding into a lower level`,
        `the force of the blow sends ${tgt} crashing through a wall, revealing a hidden room behind it that nobody knew was there`,
        `the impact dislodges something from ${tgt} — a glowing object falls from their pocket and starts humming with energy`,
        `${tgt} blocks it but the clash creates a shockwave that pushes everyone back and knocks things off the walls`,
        `the attack connects but ${tgt} grabs ${who}'s ${obj || 'arm'} — they're now locked together and a third enemy is approaching`
      ])}.`
      : `${who} ${verb}s and ${pick([
        `something completely unplanned happens — the environment reacts in a way nobody expected`,
        `the action triggers a chain reaction that changes the whole encounter`,
        `it works, but it also wakes something up / activates something / alerts someone unexpected`,
        `the result is nothing like what was intended — the situation is now completely different`
      ])}.`;
    const wildcardNext = r >= 10
      ? `The chaos might actually help. Look for an opportunity in the mess — there could be an advantage here if someone acts fast.`
      : `Things are out of control. Deal with the immediate chaos first, then figure out the next move.`;

    return [
      { type: 'success' as const, text: successText, nextSteps: successNext },
      { type: 'failure' as const, text: failText, nextSteps: failNext },
      { type: 'partial' as const, text: partialText, nextSteps: partialNext },
      { type: 'wildcard' as const, text: wildcardText, nextSteps: wildcardNext },
    ];
  }

  async function handleGenerate() {
    if (!campaign || !situation.trim()) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1000));

    const roll = diceRoll ? parseInt(diceRoll) : null;
    const outcomes = generateOutcomes(roll, campaign, situation.trim(), playerActions.trim() || 'The players act');

    const entry: ProgressionEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      situation: situation.trim(),
      playerActions: playerActions.trim(),
      diceRoll: roll,
      outcomes,
    };

    setCurrentEntry(entry);
    setGenerating(false);
    setShowCustom(false);
    setCustomText('');
    setCustomNext('');
    setView('results');
  }

  function generateSituation() {
    if (!campaign) return;
    const storyline = campaign.storylineBase || '';
    const conflict = campaign.campaignBase.mainConflict;
    const hist = campaign.progressionHistory || [];
    const last = hist.length > 0 ? hist[hist.length - 1] : null;
    const lastChosen = last ? last.outcomes.find(o => o.type === last.chosen) : null;

    // Location pools
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
      'a cliffside path with strong winds threatening to push everyone off',
      'a library where the books whisper when you get close',
      'a graveyard where the ground is freshly disturbed',
      'a tavern that has been barricaded from the inside',
      'a mining tunnel that keeps branching deeper underground',
      'a battlefield littered with old weapons and bones',
    ];

    // What's happening pools
    const events = [
      'Strange noises echo from deeper inside. Something is moving.',
      'The air suddenly gets cold. Breath turns to mist.',
      'A group of enemies blocks the path ahead. They haven\'t noticed the party yet.',
      'The ground begins to shake. Dust falls from above.',
      'A wounded stranger stumbles toward the party, begging for help.',
      'A trap is spotted just in time — the area is rigged.',
      'An eerie silence falls. Too quiet. Something is wrong.',
      'A locked door stands before the party. Behind it, voices argue.',
      'The party finds a campsite recently abandoned. The fire is still warm.',
      'A creature watches from the shadows, not attacking — just waiting.',
      'An ally calls out from somewhere ahead. They sound scared.',
      'A magical barrier blocks the way forward, humming with energy.',
      'The environment starts changing — walls shift, paths rearrange.',
      'Something valuable glints in a dangerous spot. Getting it won\'t be easy.',
      'A rival group arrives at the same location. Tension is immediate.',
    ];

    // Build the situation from context
    let generated = '';

    if (lastChosen) {
      // Continue from previous outcome
      const continuations = [
        `After what just happened, the party pushes forward. They arrive at ${pick(locations)}.`,
        `The aftermath settles. The party moves on and finds themselves at ${pick(locations)}.`,
        `With the last encounter behind them, the party continues. They reach ${pick(locations)}.`,
      ];
      generated = `${pick(continuations)} ${pick(events)}`;
    } else {
      // First entry — use campaign world and conflict to set the scene
      generated = `The party is at ${pick(locations)}. ${pick(events)} This all ties back to "${conflict.slice(0, 80)}".`;
    }

    // Add storyline flavor if available
    if (storyline && Math.random() > 0.5) {
      const flavors = [
        `Something about this feels connected to the storyline — a familiar pattern emerging.`,
        `The situation echoes themes from the storyline. The stakes are rising.`,
        `This mirrors a turning point. What happens next could change everything.`,
      ];
      generated += ' ' + pick(flavors);
    }

    setSituation(generated);
  }

  function chooseOutcome(type: ProgressionOutcome['type']) {
    if (!campaign || !currentEntry) return;
    const chosen = { ...currentEntry, chosen: type };
    const history = [...(campaign.progressionHistory || []), chosen];
    const updatedCampaign = { ...campaign, progressionHistory: history };
    save(updatedCampaign);
    setCurrentEntry(null);
    setPlayerActions('');
    setDiceRoll('');
    // Auto-generate next situation based on what just happened
    setSituation('');
    setView('input');
    // Delay so state updates first, then generate
    setTimeout(() => generateSituation(), 100);
  }

  function submitCustomOutcome() {
    if (!campaign || !currentEntry || !customText.trim()) return;
    const customOutcome: ProgressionOutcome = {
      type: 'custom',
      text: customText.trim(),
      nextSteps: customNext.trim() || 'The DM decides what happens next.',
    };
    const updated = { ...currentEntry, outcomes: [...currentEntry.outcomes, customOutcome] };
    setCurrentEntry(updated);
    // Auto-choose the custom outcome
    const chosen = { ...updated, chosen: 'custom' as const };
    const history = [...(campaign.progressionHistory || []), chosen];
    const updatedCampaign = { ...campaign, progressionHistory: history };
    save(updatedCampaign);
    setCurrentEntry(null);
    setSituation('');
    setPlayerActions('');
    setDiceRoll('');
    setCustomText('');
    setCustomNext('');
    setShowCustom(false);
    setView('input');
    setTimeout(() => generateSituation(), 100);
  }

  function rollD20() {
    setDiceRoll(String(Math.floor(Math.random() * 20) + 1));
  }

  if (!campaign) return null;
  const history = campaign.progressionHistory || [];

  const outcomeStyles: Record<string, { color: string; bg: string; label: string }> = {
    success: { color: '#3a9e3a', bg: 'rgba(58, 158, 58, 0.15)', label: 'SUCCESS' },
    failure: { color: '#c0392b', bg: 'rgba(192, 57, 43, 0.15)', label: 'FAILURE' },
    partial: { color: '#d4a017', bg: 'rgba(212, 160, 23, 0.15)', label: 'PARTIAL' },
    wildcard: { color: '#8e44ad', bg: 'rgba(142, 68, 173, 0.15)', label: 'WILDCARD' },
    custom: { color: '#2980b9', bg: 'rgba(41, 128, 185, 0.15)', label: 'CUSTOM' },
  };

  // Setup view
  if (view === 'setup' || editingStoryline) {
    return (
      <Layout title="Storyline Base" showBack>
        <div className="space-y-4 stagger-in">
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-accent)' }}>
              Set Your Storyline
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Describe a storyline, anime plot, movie, or book that will be the foundation for how your campaign progresses. The outcomes will follow the themes, pacing, and story beats you describe here.
            </p>
            <textarea
              value={storylineBase}
              onChange={e => setStorylineBase(e.target.value)}
              rows={8}
              placeholder="e.g. Demon Slayer: Tanjiro's family is killed by demons, and his sister Nezuko is turned into one. He joins the Demon Slayer Corps, trains under harsh masters, faces increasingly powerful demons in arcs of escalating difficulty. Key themes: bonds of family, never giving up, enemies who have tragic backstories, power unlocked through emotional breakthroughs..."
            />
          </div>
          <div className="flex gap-2">
            {editingStoryline && (
              <button
                onClick={() => { setStorylineBase(campaign.storylineBase || ''); setEditingStoryline(false); setView('input'); }}
                className="flex-1 py-3 rounded-lg font-bold"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={saveStoryline}
              disabled={!storylineBase.trim()}
              className="flex-1 py-3 text-white font-bold rounded-lg"
              style={{ backgroundColor: storylineBase.trim() ? 'var(--color-primary)' : 'var(--color-border)' }}
            >
              Save Storyline
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Input view
  if (view === 'input') {
    return (
      <Layout title="Progression" showBack>
        <div className="space-y-4 stagger-in">
          {/* Storyline indicator */}
          <div className="flex items-center justify-between rounded-lg p-3"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex-1 min-w-0">
              <span className="text-xs uppercase font-semibold" style={{ color: 'var(--color-accent)' }}>Storyline Base</span>
              <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                {campaign.storylineBase?.slice(0, 80)}...
              </p>
            </div>
            <button
              onClick={() => setEditingStoryline(true)}
              className="text-xs px-2 py-1 rounded ml-2"
              style={{ backgroundColor: 'var(--color-surface-light)', color: 'var(--color-accent)' }}
            >
              Edit
            </button>
          </div>

          {/* Last outcome context */}
          {history.length > 0 && (() => {
            const last = history[history.length - 1];
            const lastOutcome = last.outcomes.find(o => o.type === last.chosen);
            const style = last.chosen ? outcomeStyles[last.chosen] : null;
            return (
              <div className="rounded-lg p-3" style={{ backgroundColor: style?.bg || 'var(--color-surface)', borderLeft: `3px solid ${style?.color || 'var(--color-border)'}` }}>
                <p className="text-xs uppercase font-semibold mb-1" style={{ color: style?.color }}>
                  Last: {style?.label}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {lastOutcome?.text.slice(0, 120)}...
                </p>
                {lastOutcome?.nextSteps && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-accent)' }}>
                    Suggested next: {lastOutcome.nextSteps.slice(0, 120)}...
                  </p>
                )}
              </div>
            );
          })()}

          {history.length > 0 && (
            <button
              onClick={() => setView('history')}
              className="w-full py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
            >
              View Full History ({history.length} entries)
            </button>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                What's happening?
              </label>
              <button
                onClick={generateSituation}
                className="text-xs px-3 py-1 rounded font-bold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
              >
                Auto-Generate
              </button>
            </div>
            <textarea
              value={situation}
              onChange={e => setSituation(e.target.value)}
              rows={3}
              placeholder="Type your own or hit Auto-Generate..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Player Actions
            </label>
            <textarea
              value={playerActions}
              onChange={e => setPlayerActions(e.target.value)}
              rows={3}
              placeholder="The fighter charges in with his sword raised, the mage casts detect magic..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Dice Roll (d20)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={diceRoll}
                onChange={e => setDiceRoll(e.target.value)}
                placeholder="1-20"
                min={1}
                max={20}
                className="flex-1"
              />
              <button
                onClick={rollD20}
                className="px-4 py-2 rounded-lg font-bold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
              >
                Roll d20
              </button>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!situation.trim() || generating}
            className="w-full py-4 text-white font-bold rounded-lg text-lg"
            style={{ backgroundColor: situation.trim() && !generating ? 'var(--color-primary)' : 'var(--color-border)' }}
          >
            {generating ? 'Generating Outcomes...' : 'Generate Outcomes'}
          </button>
        </div>
      </Layout>
    );
  }

  // Results view
  if (view === 'results' && currentEntry) {
    return (
      <Layout title="Outcomes" showBack>
        <div className="space-y-4 stagger-in">
          {/* Context */}
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Situation</p>
            <p className="text-sm">{currentEntry.situation}</p>
            {currentEntry.playerActions && (
              <>
                <p className="text-xs uppercase font-semibold mt-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>Actions</p>
                <p className="text-sm">{currentEntry.playerActions}</p>
              </>
            )}
            {currentEntry.diceRoll !== null && (
              <p className="text-sm mt-2 font-bold" style={{ color: 'var(--color-accent)' }}>
                d20 Roll: {currentEntry.diceRoll}
                {currentEntry.diceRoll === 20 && ' — NATURAL 20!'}
                {currentEntry.diceRoll === 1 && ' — CRITICAL FAIL!'}
              </p>
            )}
          </div>

          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Choose an outcome:
          </p>

          {/* 4 Generated Outcomes */}
          {currentEntry.outcomes.filter(o => o.type !== 'custom').map(outcome => {
            const style = outcomeStyles[outcome.type];
            return (
              <div key={outcome.type} className="rounded-lg p-4 card-hover"
                style={{ backgroundColor: style.bg, border: `1px solid ${style.color}40` }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: style.color }}>
                  {style.label}
                </span>
                <p className="text-sm mt-2 mb-2" style={{ color: 'var(--color-text)' }}>{outcome.text}</p>
                <div className="rounded p-2 mb-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <p className="text-xs uppercase font-semibold mb-1" style={{ color: style.color }}>What happens next</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{outcome.nextSteps}</p>
                </div>
                <button
                  onClick={() => chooseOutcome(outcome.type)}
                  className="w-full py-2 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: style.color, color: 'white' }}
                >
                  Choose {style.label}
                </button>
              </div>
            );
          })}

          {/* Custom Outcome */}
          <div className="rounded-lg p-4" style={{ backgroundColor: outcomeStyles.custom.bg, border: `1px solid ${outcomeStyles.custom.color}40` }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: outcomeStyles.custom.color }}>
              CUSTOM OUTCOME
            </span>
            {!showCustom ? (
              <div className="mt-2">
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  None of the above? Write your own outcome.
                </p>
                <button
                  onClick={() => setShowCustom(true)}
                  className="w-full py-2 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: outcomeStyles.custom.color, color: 'white' }}
                >
                  Write Custom Outcome
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: outcomeStyles.custom.color }}>
                    What happens as a result of their actions?
                  </label>
                  <textarea
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    rows={4}
                    placeholder="Describe what the players' actions cause to happen..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: outcomeStyles.custom.color }}>
                    What could happen next?
                  </label>
                  <textarea
                    value={customNext}
                    onChange={e => setCustomNext(e.target.value)}
                    rows={3}
                    placeholder="What does this lead to next in the story..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="flex-1 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCustomOutcome}
                    disabled={!customText.trim()}
                    className="flex-1 py-2 rounded-lg text-sm font-bold"
                    style={{ backgroundColor: customText.trim() ? outcomeStyles.custom.color : 'var(--color-border)', color: 'white' }}
                  >
                    Save Custom
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setView('input')}
            className="w-full py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
          >
            Back to Input (discard)
          </button>
        </div>
      </Layout>
    );
  }

  // History view
  if (view === 'history') {
    return (
      <Layout title="History" showBack>
        <div className="space-y-4 stagger-in">
          <button
            onClick={() => setView('input')}
            className="text-sm"
            style={{ background: 'none', color: 'var(--color-accent)' }}
          >
            &larr; Back to Progression
          </button>

          {history.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No progression entries yet.</p>
          ) : (
            [...history].reverse().map((entry, i) => {
              const chosenOutcome = entry.outcomes.find(o => o.type === entry.chosen);
              const style = entry.chosen ? outcomeStyles[entry.chosen] : null;
              return (
                <div key={entry.id} className="rounded-lg p-4"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                      #{history.length - i}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mb-1">{entry.situation}</p>
                  {entry.playerActions && (
                    <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      Actions: {entry.playerActions}
                    </p>
                  )}
                  {entry.diceRoll !== null && (
                    <p className="text-xs mb-2 font-bold" style={{ color: 'var(--color-accent)' }}>
                      Roll: {entry.diceRoll}
                    </p>
                  )}
                  {entry.chosen && chosenOutcome && (
                    <div className="rounded p-3 mt-2" style={{ backgroundColor: style?.bg, borderLeft: `3px solid ${style?.color}` }}>
                      <span className="text-xs font-bold uppercase" style={{ color: style?.color }}>
                        {style?.label}
                      </span>
                      <p className="text-xs mt-1">{chosenOutcome.text}</p>
                      {chosenOutcome.nextSteps && (
                        <p className="text-xs mt-2" style={{ color: 'var(--color-accent)' }}>
                          Next: {chosenOutcome.nextSteps}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Layout>
    );
  }

  return null;
}
