import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export default function Layout({ children, title, showBack }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: 'var(--color-surface)', borderBottom: '2px solid var(--color-accent)', color: 'var(--color-accent)' }}>
        {!isHome && (
          <button
            onClick={() => navigate('/')}
            className="p-1"
            style={{ background: 'none', padding: '0.25rem', color: 'var(--color-text)' }}
            title="Home"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
            </svg>
          </button>
        )}
        {showBack && !isHome && (
          <button
            onClick={() => navigate(-1)}
            className="p-1"
            style={{ background: 'none', padding: '0.25rem', color: 'var(--color-text)' }}
            title="Back"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="text-lg flex-1" style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {title || 'DnD.ai'}
        </h1>
      </header>
      <main className="flex-1 p-4 pb-12 max-w-lg mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
