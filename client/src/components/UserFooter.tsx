export default function UserFooter() {
  return (
    <footer style={{
      marginTop: 'auto',
      padding: '40px 20px',
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
      }}>
        {/* About Section */}
        <div>
          <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '16px' }}>
            Tasker
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', lineHeight: '1.6' }}>
            Complete social media tasks and earn SOL. Simple, secure, and rewarding.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '16px' }}>
            Quick Links
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href="/"
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'color 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#8b5cf6')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
            >
              Home
            </a>
            <a
              href="/admin"
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'color 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#8b5cf6')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
            >
              Admin Portal
            </a>
          </div>
        </div>

        {/* Social */}
        <div>
          <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '16px' }}>
            Connect
          </h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* Twitter Icon */}
            <a
              href="#"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.8)',
                textDecoration: 'none',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.color = '#8b5cf6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              }}
            >
              🐦
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto 0',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '13px',
      }}>
        © 2025 Tasker. All rights reserved.
      </div>
    </footer>
  );
}
