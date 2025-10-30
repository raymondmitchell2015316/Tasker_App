import { useEffect, useState } from 'react';
import UserHeader from '../components/UserHeader';
import UserFooter from '../components/UserFooter';

interface LandingConfig {
  id: number;
  title: string;
  subtitle: string;
  description: string | null;
  buttonText: string;
  successMessage: string;
  backgroundColor: string;
  primaryColor: string;
  logoUrl: string | null;
  isActive: boolean;
  buttonAction: string;
}

export default function Landing() {
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGeneratingAuth, setIsGeneratingAuth] = useState(false);

  useEffect(() => {
    fetchConfig();
    checkSuccessParam();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/landing-config');
      if (response.ok) {
        const data = await response.json();
        // Convert snake_case to camelCase
        const config: LandingConfig = {
          id: data.id,
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          buttonText: data.button_text,
          successMessage: data.success_message,
          backgroundColor: data.background_color,
          primaryColor: data.primary_color,
          logoUrl: data.logo_url,
          isActive: data.is_active,
          buttonAction: data.button_action
        };
        setConfig(config);
      }
    } catch (error) {
      console.error('Failed to fetch landing config:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSuccessParam = () => {
    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get('success') === 'true';
    const isReturning = params.get('returning') === 'true';
    
    if (isSuccess) {
      setShowSuccess(true);
      
      // Store returning status for success message customization
      if (isReturning) {
        sessionStorage.setItem('isReturningUser', 'true');
      }
      
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleButtonClick = async () => {
    if (!config) return;

    // Handle different button actions based on admin configuration
    switch (config.buttonAction) {
      case 'waitlist':
        // Original OAuth flow for waitlist enrollment
        setIsGeneratingAuth(true);
        try {
          const response = await fetch('/api/landing/initiate-oauth');
          if (response.ok) {
            const data = await response.json();
            if (data.authUrl) {
              window.location.href = data.authUrl;
            } else {
              setIsGeneratingAuth(false);
              alert('Failed to generate authentication URL. Please try again.');
            }
          } else {
            const errorData = await response.json();
            setIsGeneratingAuth(false);
            alert(errorData.error || 'Failed to initiate authentication. Please try again.');
          }
        } catch (error) {
          console.error('Failed to initiate OAuth:', error);
          setIsGeneratingAuth(false);
          alert('Network error. Please check your connection and try again.');
        }
        break;

      case 'coming_soon':
        // Show coming soon message
        alert('🚀 Coming soon! Stay tuned for updates.');
        break;

      case 'external_link':
        // Future: redirect to external link (would need additional config field)
        alert('🔗 External link feature coming soon!');
        break;

      case 'task_dashboard':
        // Future: navigate to task dashboard
        alert('📋 Task dashboard coming soon!');
        break;

      default:
        // Fallback to waitlist
        try {
          const response = await fetch('/api/landing/initiate-oauth');
          if (response.ok) {
            const data = await response.json();
            if (data.authUrl) {
              window.location.href = data.authUrl;
            }
          }
        } catch (error) {
          console.error('Failed to initiate OAuth:', error);
        }
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      }}>
        <div style={{ color: '#fff', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      }}>
        <div style={{ color: '#fff', fontSize: '18px' }}>Configuration not found</div>
      </div>
    );
  }

  return (
    <>
      {/* Loading Modal for OAuth URL generation */}
      {isGeneratingAuth && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '24px',
            padding: '48px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: '4px solid rgba(139, 92, 246, 0.3)',
              borderTop: '4px solid #8b5cf6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px',
            }} />
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '16px',
            }}>
              🔍 Finding Available Spot
            </h3>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.6',
              marginBottom: '8px',
            }}>
              We're scanning through our Twitter apps to find the perfect spot for you...
            </p>
            <p style={{
              fontSize: '14px',
              color: 'rgba(139, 92, 246, 0.8)',
              fontWeight: '600',
            }}>
              This will only take a moment
            </p>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
      }} />

      <UserHeader logo={config.logoUrl || undefined} siteName="Tasker" />

      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 20px 60px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ maxWidth: '1000px', width: '100%', textAlign: 'center' }}>
          {/* Hero Section */}
          <div>
            <h1 style={{
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '24px',
              lineHeight: '1.2',
            }}>
              Earn SOL by Completing <br />
              <span style={{
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Simple Social Tasks
              </span>
            </h1>
            <p style={{
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '700px',
              margin: '0 auto 40px',
              lineHeight: '1.6',
            }}>
              Complete Twitter engagements, YouTube activities, and blog reading tasks. 
              Get paid monthly in SOL directly to your wallet.
            </p>

            {/* CTA Button - Moved here from bottom */}
            {showSuccess ? (
              <div style={{
                padding: '40px',
                background: 'rgba(139, 92, 246, 0.1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '20px',
                marginBottom: '30px',
              }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>
                  {sessionStorage.getItem('isReturningUser') === 'true' ? '🎉' : '✅'}
                </div>
                <h2 style={{
                  color: '#8b5cf6',
                  fontSize: '32px',
                  fontWeight: '700',
                  marginBottom: '12px',
                }}>
                  {sessionStorage.getItem('isReturningUser') === 'true' ? 'Welcome Back!' : 'Welcome Aboard!'}
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '18px', marginBottom: '24px' }}>
                  {sessionStorage.getItem('isReturningUser') === 'true' 
                    ? 'Great to see you again! Your account details have been updated with the latest information.'
                    : config.successMessage
                  }
                </p>
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    sessionStorage.removeItem('isReturningUser'); // Clean up
                  }}
                  style={{
                    padding: '12px 32px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: '50px' }}>
                <button
                  onClick={handleButtonClick}
                  disabled={config.buttonAction === 'coming_soon'}
                  style={{
                    padding: '20px 50px',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#fff',
                    background: config.buttonAction === 'coming_soon' 
                      ? 'rgba(100, 116, 139, 0.2)' 
                      : 'rgba(139, 92, 246, 0.2)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: config.buttonAction === 'coming_soon'
                      ? '1px solid rgba(100, 116, 139, 0.3)'
                      : '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '16px',
                    cursor: config.buttonAction === 'coming_soon' ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: config.buttonAction === 'coming_soon'
                      ? '0 8px 32px rgba(100, 116, 139, 0.2)'
                      : '0 8px 32px rgba(139, 92, 246, 0.2)',
                    opacity: config.buttonAction === 'coming_soon' ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (config.buttonAction !== 'coming_soon') {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.35)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (config.buttonAction !== 'coming_soon') {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.2)';
                    }
                  }}
                >
                  {config.buttonText || (
                    config.buttonAction === 'waitlist' ? 'Join Waitlist' :
                    config.buttonAction === 'coming_soon' ? 'Coming Soon' :
                    config.buttonAction === 'external_link' ? 'Learn More' :
                    config.buttonAction === 'task_dashboard' ? 'Start Tasks' :
                    'Get Started'
                  )}
                </button>
                <p style={{
                  marginTop: '20px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                }}>
                  {config.buttonAction === 'waitlist' && '🔒 Secure Twitter authentication • Monthly withdrawals'}
                  {config.buttonAction === 'coming_soon' && '⏳ Feature launching soon'}
                  {config.buttonAction === 'external_link' && '🔗 Redirects to external platform'}
                  {config.buttonAction === 'task_dashboard' && '📋 Access your task dashboard'}
                </p>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '50px',
          }}>
            {/* Feature 1 */}
            <div style={{
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🐦</div>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Twitter Tasks
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', lineHeight: '1.6' }}>
                Like, retweet, and engage with content to earn rewards
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📺</div>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                YouTube Activities
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', lineHeight: '1.6' }}>
                Watch, like, and comment on videos for SOL
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📝</div>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Blog Reading
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', lineHeight: '1.6' }}>
                Read articles and share your insights to get paid
              </p>
            </div>
          </div>
        </div>
      </main>

      <UserFooter />
      </div>
    </>
  );
}
