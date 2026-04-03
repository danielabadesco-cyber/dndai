import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import type { Campaign } from '../types';
import { getAllCampaigns, deleteCampaign } from '../services/storage';

type Filter = 'all' | 'recent' | 'most-characters';

export default function HomePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setCampaigns(getAllCampaigns());
  }, []);

  function handleDelete(id: string, name: string) {
    if (confirm(`Delete campaign "${name}"? This cannot be undone.`)) {
      deleteCampaign(id);
      setCampaigns(getAllCampaigns());
    }
  }

  const filtered = [...campaigns].sort((a, b) => {
    if (filter === 'recent') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (filter === 'most-characters') return b.characters.length - a.characters.length;
    return 0;
  });

  return (
    <Layout title="DnD.ai">
      <div className="space-y-6 stagger-in">
        <div className="text-center py-6 animate-in">
          <h2 className="text-2xl mb-2 glow-pulse inline-block px-4 py-1 rounded-lg" style={{ color: 'var(--color-accent)', fontFamily: "var(--font-heading)", fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            AI Dungeon Master
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Create and manage your D&D campaigns
          </p>
        </div>

        {/* Creation Buttons */}
        <div className="space-y-3 stagger-in">
          <button
            onClick={() => navigate('/campaign/new?mode=ai')}
            className="w-full py-4 px-4 rounded-lg text-left"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            <div className="font-bold text-lg">AI Generated</div>
            <div className="text-sm opacity-80">Describe an idea and get 3 campaign options</div>
          </button>
          <button
            onClick={() => navigate('/campaign/new?mode=premade')}
            className="w-full py-4 px-4 rounded-lg text-left"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          >
            <div className="font-bold text-lg">Pre-Made Campaign</div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Choose from built-in campaigns</div>
          </button>
          <button
            onClick={() => navigate('/campaign/new?mode=custom')}
            className="w-full py-4 px-4 rounded-lg text-left"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          >
            <div className="font-bold text-lg">Custom Campaign</div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Build everything from scratch</div>
          </button>
        </div>

        {/* My Campaigns */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}>
              My Campaigns
            </h3>
            <div className="relative">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="text-xs px-3 py-1 rounded flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--color-surface-light)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 4h18M7 9h10M10 14h4M11 19h2" />
                </svg>
                {filter === 'all' ? 'Filter' : filter === 'recent' ? 'Recent' : 'Most Chars'}
              </button>
              {showFilter && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                  <div className="absolute right-0 top-8 z-20 rounded-lg py-1 min-w-[130px]"
                    style={{ backgroundColor: 'var(--color-surface-light)', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                    {([['all', 'All'], ['recent', 'Recent'], ['most-characters', 'Most Chars']] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => { setFilter(key); setShowFilter(false); }}
                        className="w-full text-left text-sm px-3 py-2"
                        style={{
                          background: filter === key ? 'var(--color-accent)' : 'transparent',
                          color: filter === key ? 'white' : 'var(--color-text)',
                          borderRadius: 0,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          {campaigns.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
              <p className="text-sm">No campaigns yet. Create one above to get started!</p>
            </div>
          ) : (
            filtered.map(campaign => (
              <div
                key={campaign.id}
                className="rounded-lg p-4 card-hover"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                  >
                    <h4 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                      {campaign.name}
                    </h4>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {campaign.description || campaign.campaignBase.tone}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span>{campaign.characters.length} characters</span>
                      <span>{campaign.eventLog.length} events</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id, campaign.name); }}
                    className="text-sm px-2 py-1 rounded"
                    style={{ backgroundColor: 'transparent', color: 'var(--color-danger)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs py-4" style={{ color: 'var(--color-text-muted)', opacity: 0.35 }}>
          made by daniel
        </p>
      </div>
    </Layout>
  );
}
