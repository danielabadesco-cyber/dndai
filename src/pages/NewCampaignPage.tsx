import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';
import type { Campaign, CampaignBase } from '../types';
import { saveCampaign } from '../services/storage';
import { premadeCampaigns } from '../services/premade-campaigns';
import type { PremadeCampaign } from '../services/premade-campaigns';

type Mode = 'choose' | 'custom' | 'premade' | 'ai-input' | 'ai-results';

function getInitialMode(param: string | null): Mode {
  if (param === 'ai') return 'ai-input';
  if (param === 'premade') return 'premade';
  if (param === 'custom') return 'custom';
  return 'choose';
}

interface AiOption {
  name: string;
  base: CampaignBase;
}

export default function NewCampaignPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(getInitialMode(searchParams.get('mode')));

  // Custom campaign state
  const [customName, setCustomName] = useState('');
  const [customWorld, setCustomWorld] = useState('');
  const [customScenario, setCustomScenario] = useState('');
  const [customConflict, setCustomConflict] = useState('');
  const [customTone, setCustomTone] = useState('');

  // AI generation state
  const [aiIdea, setAiIdea] = useState('');
  const [aiOptions, setAiOptions] = useState<AiOption[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  function createCampaign(name: string, description: string, base: CampaignBase) {
    const campaign: Campaign = {
      id: uuidv4(),
      name,
      description,
      campaignBase: base,
      characters: [],
      dmNotes: '',
      eventLog: [{
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        text: `Campaign "${name}" created.`,
        type: 'note'
      }],
      storyProgress: base.startingScenario,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveCampaign(campaign);
    navigate(`/campaign/${campaign.id}`);
  }

  function handleCustomSubmit() {
    if (!customName.trim()) return;
    createCampaign(customName, customTone, {
      worldDescription: customWorld,
      startingScenario: customScenario,
      mainConflict: customConflict,
      tone: customTone,
    });
  }

  function handlePremadeSelect(pm: PremadeCampaign) {
    createCampaign(pm.name, pm.description, pm.base);
  }

  function generateTitle(idea: string, style: number): string {
    const words = idea.trim().toLowerCase().split(/\s+/);
    const key = words.find(w => w.length > 3) || words[0] || 'quest';
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const capKey = cap(key);

    const epicTitles = [
      `The ${capKey} Chronicles`,
      `Rise of the ${capKey}`,
      `${capKey}: Age of Legends`,
      `The Last ${capKey}`,
      `Throne of ${capKey}`,
      `${capKey} Ascendant`,
      `The ${capKey} Prophecy`,
      `War of the ${capKey}`,
    ];
    const darkTitles = [
      `${capKey}: Blood & Shadow`,
      `The ${capKey} Conspiracy`,
      `Curse of the ${capKey}`,
      `${capKey}: The Fallen`,
      `Shadow of the ${capKey}`,
      `The ${capKey} Betrayal`,
      `${capKey}: Ashes & Ruin`,
      `The Shattered ${capKey}`,
    ];
    const lightTitles = [
      `The ${capKey} Expedition`,
      `${capKey} & Company`,
      `The Great ${capKey} Caper`,
      `Tales of ${capKey}`,
      `${capKey}: An Unlikely Adventure`,
      `The Magnificent ${capKey}`,
      `${capKey} Unleashed`,
      `The ${capKey} Gambit`,
    ];

    const lists = [epicTitles, darkTitles, lightTitles];
    const list = lists[style] || epicTitles;
    return list[Math.floor(Math.random() * list.length)];
  }

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickUnique<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async function handleAiGenerate() {
    if (!aiIdea.trim()) return;
    setAiLoading(true);

    await new Promise(r => setTimeout(r, 1500));

    const idea = aiIdea.trim();

    const allTones = [
      'Epic high fantasy', 'Dark and gritty', 'Lighthearted adventure',
      'Horror and suspense', 'Political intrigue', 'Survival and exploration',
      'Mystery and investigation', 'War and conquest', 'Mythological epic',
      'Steampunk adventure', 'Cosmic horror', 'Heist and deception',
      'Revenge saga', 'Coming of age', 'Pirate adventure',
    ];

    const allWorlds = [
      `A vast continent where ancient empires have crumbled, leaving behind ruins filled with forgotten magic and dangerous relics tied to "${idea}".`,
      `A sprawling underground kingdom where sunlight is a myth and bioluminescent fungi light the way. "${idea}" shapes every aspect of survival here.`,
      `A chain of floating islands above an endless storm. Airships connect the settlements, and "${idea}" is woven into the very winds.`,
      `A frozen wasteland where warmth is currency and fire is sacred. The concept of "${idea}" drives every faction's struggle to survive.`,
      `A cursed forest that shifts and changes every night. Those who enter seeking "${idea}" rarely return the same.`,
      `A coastal city built on the back of a sleeping titan. "${idea}" is central to the prophecy that the titan will one day wake.`,
      `A desert realm where oases hold hidden civilizations. "${idea}" is the key to finding water — and power.`,
      `A war-torn realm of shattered kingdoms, where "${idea}" is both the cause of the war and the only hope for peace.`,
      `A magical academy on the edge of reality, where students study "${idea}" and the boundaries between worlds grow thin.`,
      `A realm where the dead walk alongside the living. "${idea}" determines whether spirits are allies or enemies.`,
    ];

    const allScenarios = [
      `The party meets in a tavern that's on fire. A stranger throws them a map and says one word before dying: "${idea}".`,
      `The players wake up in a dungeon with no memory of how they got there. The walls are covered in symbols related to "${idea}".`,
      `A festival is interrupted when the sky cracks open. Something falls from above, and it's connected to "${idea}".`,
      `The party is hired to protect a caravan, but the cargo is alive — and it whispers about "${idea}".`,
      `A bounty has been placed on something called "${idea}". Every faction in the region wants it, and the party just stumbled onto a clue.`,
      `The party's village is destroyed overnight. The only survivor says a single name connected to "${idea}" before collapsing.`,
      `A dying king summons the party. His last wish involves "${idea}", and refusing means war.`,
      `The ground splits open in the town square, revealing ancient stairs going down. Carved into the first step: "${idea}".`,
      `The party finds a ship washed ashore with no crew. The captain's log mentions "${idea}" on every page.`,
      `A child appears claiming to be from the future. They say "${idea}" will destroy everything unless the party acts now.`,
    ];

    const allConflicts = [
      'An ancient sealed evil is breaking free, and its corruption spreads faster each day.',
      'Two powerful factions are on the brink of war, and both sides want the party to join them.',
      'A plague is spreading that turns people into monsters. The cure exists, but someone is hoarding it.',
      'A god has gone silent, and without their blessing, the land is dying. Someone — or something — has taken their place.',
      'A powerful artifact has been shattered into pieces, and every fragment warps reality around it.',
      'A secret society is rewriting history using forbidden magic. The party discovers the truth by accident.',
      'The barrier between worlds is failing. Creatures from the other side are pouring through.',
      'A tyrant has united the enemy forces under one banner. The resistance is losing and desperate.',
      'An ancient prophecy is coming true, but its wording is ambiguous — it could mean salvation or destruction.',
      'Someone is assassinating leaders one by one. The pattern points to something bigger than politics.',
    ];

    const tones = pickUnique(allTones, 3);

    const options: AiOption[] = tones.map((tone, i) => ({
      name: generateTitle(idea, i),
      base: {
        worldDescription: pick(allWorlds),
        startingScenario: pick(allScenarios),
        mainConflict: pick(allConflicts),
        tone,
      }
    }));

    setAiOptions(options);
    setAiLoading(false);
    setMode('ai-results');
  }

  if (mode === 'choose') {
    return (
      <Layout title="New Campaign" showBack>
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            How would you like to create your campaign?
          </h2>
          <button
            onClick={() => setMode('ai-input')}
            className="w-full py-4 px-4 rounded-lg text-left"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            <div className="font-bold text-lg">AI Generated</div>
            <div className="text-sm opacity-80">Describe an idea and get 3 campaign options</div>
          </button>
          <button
            onClick={() => setMode('premade')}
            className="w-full py-4 px-4 rounded-lg text-left"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          >
            <div className="font-bold text-lg">Pre-Made Campaign</div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Choose from built-in campaigns</div>
          </button>
          <button
            onClick={() => setMode('custom')}
            className="w-full py-4 px-4 rounded-lg text-left"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          >
            <div className="font-bold text-lg">Custom Campaign</div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Build everything from scratch</div>
          </button>
        </div>
      </Layout>
    );
  }

  if (mode === 'premade') {
    return (
      <Layout title="Pre-Made Campaigns" showBack>
        <div className="space-y-4">
          <button onClick={() => setMode('choose')} className="text-sm mb-2"
            style={{ background: 'none', color: 'var(--color-primary)' }}>
            &larr; Back to dashboard
          </button>
          {premadeCampaigns.map((pm, i) => (
            <div key={i} className="rounded-lg p-4"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>{pm.name}</h3>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>{pm.description}</p>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Tone: {pm.base.tone}
              </p>
              <button
                onClick={() => handlePremadeSelect(pm)}
                className="w-full py-2 text-white rounded-lg"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Start This Campaign
              </button>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  if (mode === 'custom') {
    return (
      <Layout title="Custom Campaign" showBack>
        <div className="space-y-4">
          <button onClick={() => setMode('choose')} className="text-sm mb-2"
            style={{ background: 'none', color: 'var(--color-primary)' }}>
            &larr; Back to dashboard
          </button>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Campaign Name *</label>
            <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Rise of the Dragon Lords" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>World Description</label>
            <textarea value={customWorld} onChange={e => setCustomWorld(e.target.value)} rows={3} placeholder="Describe the world..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Starting Scenario</label>
            <textarea value={customScenario} onChange={e => setCustomScenario(e.target.value)} rows={3} placeholder="How does the adventure begin?" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Main Conflict</label>
            <textarea value={customConflict} onChange={e => setCustomConflict(e.target.value)} rows={2} placeholder="The central threat or challenge..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Tone</label>
            <input value={customTone} onChange={e => setCustomTone(e.target.value)} placeholder="e.g. Dark fantasy, Heroic, Comedic" />
          </div>
          <button
            onClick={handleCustomSubmit}
            disabled={!customName.trim()}
            className="w-full py-3 text-white font-bold rounded-lg"
            style={{ backgroundColor: customName.trim() ? 'var(--color-primary)' : 'var(--color-border)' }}
          >
            Create Campaign
          </button>
        </div>
      </Layout>
    );
  }

  if (mode === 'ai-input') {
    return (
      <Layout title="AI Campaign Generator" showBack>
        <div className="space-y-4">
          <button onClick={() => setMode('choose')} className="text-sm mb-2"
            style={{ background: 'none', color: 'var(--color-primary)' }}>
            &larr; Back to dashboard
          </button>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Describe your campaign idea and the AI will generate 3 campaign options for you to choose from.
          </p>
          <textarea
            value={aiIdea}
            onChange={e => setAiIdea(e.target.value)}
            rows={4}
            placeholder="e.g. A pirate adventure in a world where the ocean is alive and sentient..."
          />
          <button
            onClick={handleAiGenerate}
            disabled={!aiIdea.trim() || aiLoading}
            className="w-full py-3 text-white font-bold rounded-lg"
            style={{ backgroundColor: aiIdea.trim() ? 'var(--color-primary)' : 'var(--color-border)' }}
          >
            {aiLoading ? 'Generating...' : 'Generate Campaign Options'}
          </button>
        </div>
      </Layout>
    );
  }

  if (mode === 'ai-results') {
    return (
      <Layout title="Choose a Campaign" showBack>
        <div className="space-y-4">
          <button onClick={() => setMode('ai-input')} className="text-sm mb-2"
            style={{ background: 'none', color: 'var(--color-primary)' }}>
            &larr; Try a different idea
          </button>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Select one of the generated campaigns:
          </p>
          {aiOptions.map((opt, i) => (
            <div key={i} className="rounded-lg p-4"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>{opt.name}</h3>
              <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <p><strong style={{ color: 'var(--color-text)' }}>World:</strong> {opt.base.worldDescription}</p>
                <p><strong style={{ color: 'var(--color-text)' }}>Start:</strong> {opt.base.startingScenario}</p>
                <p><strong style={{ color: 'var(--color-text)' }}>Conflict:</strong> {opt.base.mainConflict}</p>
                <p><strong style={{ color: 'var(--color-text)' }}>Tone:</strong> {opt.base.tone}</p>
              </div>
              <button
                onClick={() => createCampaign(opt.name, opt.base.tone, opt.base)}
                className="w-full py-2 mt-3 text-white rounded-lg"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Select This Campaign
              </button>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  return null;
}
