import { useLocation } from 'wouter';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Use client-side routing instead of page reload
    setLocation('/login');
  };

  const navItems = [
    { path: '/admin', label: '📊 Dashboard' },
    { path: '/admin/twitter-apps', label: '🐦 Twitter Apps' },
    { path: '/admin/users', label: '👥 Users' },
    { path: '/admin/landing-page', label: '🌐 Landing Page' },
    { path: '/admin/telegram-settings', label: '📱 Telegram Settings' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        background: '#1e293b',
        borderRight: '1px solid #334155',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <h2 style={{ marginBottom: '30px', color: '#fff' }}>🐦 Tasker</h2>
        
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: '8px',
                textAlign: 'left',
                border: 'none',
                borderRadius: '6px',
                background: location === item.path ? '#334155' : 'transparent',
                color: location === item.path ? '#fff' : '#94a3b8',
                fontSize: '14px',
                transition: 'all 0.2s',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px 16px',
            textAlign: 'left',
            border: '1px solid #334155',
            borderRadius: '6px',
            background: 'transparent',
            color: '#ef4444',
            fontSize: '14px',
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '30px',
        overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  );
}
