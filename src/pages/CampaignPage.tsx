import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';
import type { Campaign, EventLogEntry } from '../types';
import { getCampaign, saveCampaign } from '../services/storage';

type Tab = 'story' | 'characters' | 'log' | 'notes';

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [tab, setTab] = useState<Tab>('story');
  const [newEvent, setNewEvent] = useState('');
  const [eventType, setEventType] = useState<EventLogEntry['type']>('note');
  const [editing, setEditing] = useState(false);
  const [editWorld, setEditWorld] = useState('');
  const [editStory, setEditStory] = useState('');
  const [editConflict, setEditConflict] = useState('');
  const [editTone, setEditTone] = useState('');

  function startEditing() {
    if (!campaign) return;
    setEditWorld(campaign.campaignBase.worldDescription);
    setEditStory(campaign.storyProgress);
    setEditConflict(campaign.campaignBase.mainConflict);
    setEditTone(campaign.campaignBase.tone);
    setEditing(true);
  }

  function saveStory() {
    if (!campaign) return;
    save({
      ...campaign,
      storyProgress: editStory,
      campaignBase: {
        ...campaign.campaignBase,
        worldDescription: editWorld,
        mainConflict: editConflict,
        tone: editTone,
      },
    });
    setEditing(false);
  }

  useEffect(() => {
    if (id) {
      const c = getCampaign(id);
      if (c) setCampaign(c);
      else navigate('/');
    }
  }, [id, navigate]);

  function save(updated: Campaign) {
    saveCampaign(updated);
    setCampaign({ ...updated });
  }

  function addEvent() {
    if (!campaign || !newEvent.trim()) return;
    const entry: EventLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      text: newEvent.trim(),
      type: eventType,
    };
    save({ ...campaign, eventLog: [...campaign.eventLog, entry] });
    setNewEvent('');
  }

  if (!campaign) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'story', label: 'Story' },
    { key: 'characters', label: `Characters (${campaign.characters.length})` },
    { key: 'log', label: 'Log' },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <Layout title={campaign.name} showBack>
      {/* Progression Helper Button */}
      <button
        onClick={() => navigate(`/campaign/${campaign.id}/progression`)}
        className="w-full py-3 mb-4 font-bold rounded-lg text-sm"
        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
      >
        Progression Helper
      </button>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-4 overflow-x-auto -mx-4 px-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
            style={{
              backgroundColor: tab === t.key ? 'var(--color-primary)' : 'var(--color-surface)',
              color: tab === t.key ? 'white' : 'var(--color-text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Story Tab */}
      {tab === 'story' && (
        <div className="space-y-4">
          {!editing ? (
            <>
              <button
                onClick={startEditing}
                className="w-full py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
              >
                Edit Campaign Details
              </button>
              <Section title="World">
                <p className="text-sm">{campaign.campaignBase.worldDescription}</p>
              </Section>
              <Section title="Current Story">
                <p className="text-sm">{campaign.storyProgress || <span style={{ color: 'var(--color-text-muted)' }}>No story progress yet...</span>}</p>
              </Section>
              <Section title="Main Conflict">
                <p className="text-sm">{campaign.campaignBase.mainConflict}</p>
              </Section>
              <Section title="Tone">
                <p className="text-sm">{campaign.campaignBase.tone}</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="World">
                <textarea value={editWorld} onChange={e => setEditWorld(e.target.value)} rows={4} placeholder="World description..." />
              </Section>
              <Section title="Current Story">
                <textarea value={editStory} onChange={e => setEditStory(e.target.value)} rows={6} placeholder="Story progress..." />
              </Section>
              <Section title="Main Conflict">
                <textarea value={editConflict} onChange={e => setEditConflict(e.target.value)} rows={3} placeholder="Main conflict..." />
              </Section>
              <Section title="Tone">
                <input value={editTone} onChange={e => setEditTone(e.target.value)} placeholder="e.g. Dark fantasy, Heroic..." />
              </Section>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-lg font-bold"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveStory}
                  className="flex-1 py-3 text-white font-bold rounded-lg"
                  style={{ backgroundColor: 'var(--color-success)' }}
                >
                  Save
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Characters Tab */}
      {tab === 'characters' && (
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/campaign/${campaign.id}/character/new`)}
            className="w-full py-3 text-white font-bold rounded-lg"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            + Add Character
          </button>
          {campaign.characters.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
              No characters yet. Add one to get started!
            </p>
          ) : (
            campaign.characters.map(char => (
              <div
                key={char.id}
                className="rounded-lg p-4 cursor-pointer"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                onClick={() => navigate(`/campaign/${campaign.id}/character/${char.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold" style={{ color: 'var(--color-text)' }}>{char.name}</h4>
                    {char.characterClass && (
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {char.characterClass} {char.level ? `Lvl ${char.level}` : ''}
                      </p>
                    )}
                  </div>
                  {char.status && (
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-surface-light)', color: 'var(--color-warning)' }}>
                      {char.status}
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span style={{ color: 'var(--color-danger)' }}>HP: {char.hp}/{char.maxHp}</span>
                  <span style={{ color: 'var(--color-warning)' }}>Gold: {char.gold}</span>
                  <span style={{ color: 'var(--color-success)' }}>XP: {char.xp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Log Tab */}
      {tab === 'log' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <textarea
              value={newEvent}
              onChange={e => setNewEvent(e.target.value)}
              rows={2}
              placeholder="Add a new event..."
            />
            <div className="flex gap-2">
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value as EventLogEntry['type'])}
                className="flex-1"
              >
                <option value="note">Note</option>
                <option value="story">Story</option>
                <option value="combat">Combat</option>
                <option value="custom">Custom</option>
              </select>
              <button
                onClick={addEvent}
                disabled={!newEvent.trim()}
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: newEvent.trim() ? 'var(--color-primary)' : 'var(--color-border)' }}
              >
                Add
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {[...campaign.eventLog].reverse().map(entry => (
              <div key={entry.id} className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--color-surface)', borderLeft: `3px solid ${typeColor(entry.type)}` }}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium uppercase" style={{ color: typeColor(entry.type) }}>
                    {entry.type}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{entry.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {tab === 'notes' && (
        <div className="space-y-4">
          <Section title="DM Notes">
            <textarea
              value={campaign.dmNotes}
              onChange={e => save({ ...campaign, dmNotes: e.target.value })}
              rows={10}
              placeholder="Your private DM notes..."
            />
          </Section>
        </div>
      )}
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </h3>
      <div style={{ color: 'var(--color-text)' }}>{children}</div>
    </div>
  );
}

function typeColor(type: EventLogEntry['type']): string {
  switch (type) {
    case 'story': return 'var(--color-primary)';
    case 'combat': return 'var(--color-danger)';
    case 'note': return 'var(--color-warning)';
    case 'custom': return 'var(--color-success)';
  }
}
