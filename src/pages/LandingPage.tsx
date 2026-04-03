import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Layout title="DnD.ai">
      <div className="space-y-6 stagger-in">
        <div className="text-center py-8 animate-in">
          <h2 className="text-2xl mb-2 glow-pulse inline-block px-4 py-1 rounded-lg" style={{ color: 'var(--color-accent)', fontFamily: "var(--font-heading)", fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            DnD.ai
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Choose your adventure mode
          </p>
        </div>

        <button
          onClick={() => navigate('/ai-dm')}
          className="w-full py-6 px-5 rounded-lg text-left card-hover"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: '1px solid var(--color-accent)' }}
        >
          <div className="font-bold text-xl" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
            AI DM
          </div>
          <div className="text-sm mt-1 opacity-80">
            The AI runs the game. It sets the scene, you choose your actions, roll dice, and the story unfolds automatically. Just play.
          </div>
        </button>

        <button
          onClick={() => navigate('/dm-helper')}
          className="w-full py-6 px-5 rounded-lg text-left card-hover"
          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
        >
          <div className="font-bold text-xl" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
            DM Helper
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            You're the DM. Create campaigns, track characters, manage stats, and use the progression helper as a tool during your sessions.
          </div>
        </button>

        <p className="text-center text-xs py-4" style={{ color: 'var(--color-text-muted)', opacity: 0.35 }}>
          made by daniel
        </p>
      </div>
    </Layout>
  );
}
