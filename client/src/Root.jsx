import { useAuth } from './context/useAuth.js';
import LoginPage from './components/LoginPage.jsx';
import App from './App.jsx';

export default function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '2.5rem' }}>📚</div>
        <div style={{ width: '36px', height: '36px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <div style={{ color: 'var(--text3)', fontSize: '.85rem', fontFamily: "'Noto Sans Tamil', sans-serif" }}>கல்வி ஏற்றுகிறது...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  return <App />;
}
