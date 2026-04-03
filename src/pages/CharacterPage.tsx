import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';
import StatControl from '../components/StatControl';
import type { Campaign, Character, CustomStat } from '../types';
import { getCampaign, saveCampaign } from '../services/storage';

export default function CharacterPage() {
  const { id: campaignId, charId } = useParams<{ id: string; charId: string }>();
  const navigate = useNavigate();
  const isNew = charId === 'new';

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [char, setChar] = useState<Character>({
    id: uuidv4(),
    name: '',
    hp: 10,
    maxHp: 10,
    gold: 0,
    xp: 0,
    characterClass: '',
    level: 1,
    status: '',
    customStats: [],
    notes: '',
    createdAt: new Date().toISOString(),
  });
  const [newStatName, setNewStatName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    const c = getCampaign(campaignId);
    if (!c) { navigate('/'); return; }
    setCampaign(c);
    if (!isNew) {
      const existing = c.characters.find(ch => ch.id === charId);
      if (existing) setChar(existing);
      else navigate(`/campaign/${campaignId}`);
    }
  }, [campaignId, charId, isNew, navigate]);

  function saveChar(updated: Character) {
    if (!campaign) return;
    const chars = isNew
      ? [...campaign.characters, updated]
      : campaign.characters.map(c => c.id === updated.id ? updated : c);
    const updatedCampaign = { ...campaign, characters: chars };
    saveCampaign(updatedCampaign);
    setCampaign(updatedCampaign);
    setChar(updated);
  }

  function handleSave() {
    if (!char.name.trim()) return;
    saveChar(char);
    if (isNew) navigate(`/campaign/${campaignId}`);
  }

  function handleDelete() {
    if (!campaign) return;
    const chars = campaign.characters.filter(c => c.id !== char.id);
    saveCampaign({ ...campaign, characters: chars });
    navigate(`/campaign/${campaignId}`);
  }

  function updateStat(field: keyof Character, value: number) {
    const updated = { ...char, [field]: value };
    setChar(updated);
    if (!isNew) saveChar(updated);
  }

  function addCustomStat() {
    if (!newStatName.trim()) return;
    const stat: CustomStat = { id: uuidv4(), name: newStatName.trim(), value: 0 };
    const updated = { ...char, customStats: [...char.customStats, stat] };
    setChar(updated);
    if (!isNew) saveChar(updated);
    setNewStatName('');
  }

  function updateCustomStat(statId: string, value: number) {
    const updated = {
      ...char,
      customStats: char.customStats.map(s => s.id === statId ? { ...s, value } : s)
    };
    setChar(updated);
    if (!isNew) saveChar(updated);
  }

  function removeCustomStat(statId: string) {
    const updated = {
      ...char,
      customStats: char.customStats.filter(s => s.id !== statId)
    };
    setChar(updated);
    if (!isNew) saveChar(updated);
  }

  if (!campaign) return null;

  return (
    <Layout title={isNew ? 'New Character' : char.name} showBack>
      <div className="space-y-4">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Name *</label>
          <input value={char.name} onChange={e => setChar({ ...char, name: e.target.value })} placeholder="Character name" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Class</label>
            <input value={char.characterClass || ''} onChange={e => setChar({ ...char, characterClass: e.target.value })} placeholder="e.g. Wizard" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Level</label>
            <input type="number" value={char.level || ''} onChange={e => setChar({ ...char, level: parseInt(e.target.value) || 0 })} min={1} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Status</label>
          <input value={char.status || ''} onChange={e => setChar({ ...char, status: e.target.value })} placeholder="e.g. Poisoned, Blessed" />
        </div>

        {/* Core Stats */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Core Stats
          </h3>
          <StatControl label="HP" value={char.hp} maxValue={char.maxHp} onChange={v => updateStat('hp', v)} color="var(--color-danger)" />
          <div className="flex items-center gap-2 px-3">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Max HP:</span>
            <input
              type="number"
              value={char.maxHp}
              onChange={e => updateStat('maxHp', parseInt(e.target.value) || 0)}
              className="w-20 text-center text-sm"
              min={1}
            />
          </div>
          <StatControl label="Gold" value={char.gold} onChange={v => updateStat('gold', v)} color="var(--color-warning)" />
          <StatControl label="XP" value={char.xp} onChange={v => updateStat('xp', v)} color="var(--color-success)" />
        </div>

        {/* Custom Stats */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Custom Stats
          </h3>
          {char.customStats.map(stat => (
            <div key={stat.id} className="flex items-center gap-2">
              <div className="flex-1">
                <StatControl label={stat.name} value={stat.value} onChange={v => updateCustomStat(stat.id, v)} />
              </div>
              <button
                onClick={() => removeCustomStat(stat.id)}
                className="text-xs px-2 py-1"
                style={{ background: 'none', color: 'var(--color-danger)' }}
              >
                X
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={newStatName}
              onChange={e => setNewStatName(e.target.value)}
              placeholder="New stat name..."
              className="flex-1"
            />
            <button
              onClick={addCustomStat}
              disabled={!newStatName.trim()}
              className="px-4 py-2 text-white rounded-lg"
              style={{ backgroundColor: newStatName.trim() ? 'var(--color-primary)' : 'var(--color-border)' }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Character Notes */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Notes
          </h3>
          <textarea
            value={char.notes}
            onChange={e => {
              const updated = { ...char, notes: e.target.value };
              setChar(updated);
              if (!isNew) saveChar(updated);
            }}
            rows={4}
            placeholder="Character notes..."
          />
        </div>

        {/* Actions */}
        {isNew ? (
          <button
            onClick={handleSave}
            disabled={!char.name.trim()}
            className="w-full py-3 text-white font-bold rounded-lg"
            style={{ backgroundColor: char.name.trim() ? 'var(--color-primary)' : 'var(--color-border)' }}
          >
            Create Character
          </button>
        ) : (
          <div className="pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            {showDeleteConfirm ? (
              <div className="space-y-2">
                <p className="text-center text-sm" style={{ color: 'var(--color-danger)' }}>
                  Are you sure you want to delete {char.name}?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 rounded-lg"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 text-white rounded-lg"
                    style={{ backgroundColor: 'var(--color-danger)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2 rounded-lg"
                style={{ backgroundColor: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}
              >
                Delete Character
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
