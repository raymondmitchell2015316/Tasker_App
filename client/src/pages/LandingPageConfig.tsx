import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { logger } from '../utils/logger';

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

export default function LandingPageConfig() {
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/landing-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        logger.success('Landing config loaded');
      }
    } catch (error) {
      logger.error('Failed to fetch landing config', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/landing-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        logger.success('Landing page config saved successfully');
        alert('✅ Landing page configuration saved successfully!');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      logger.error('Failed to save landing config', error);
      alert('❌ Failed to save landing page configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof LandingConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#fff' }}>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!config) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#fff' }}>Configuration not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '900px' }}>
        <h1 style={{ marginBottom: '30px', fontSize: '32px', color: '#fff' }}>
          Landing Page Configuration
        </h1>

        <div style={{
          background: '#1e293b',
          padding: '30px',
          borderRadius: '12px',
          border: '1px solid #334155',
        }}>
          {/* Title */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>
              Page Title
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => updateConfig('title', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
              }}
              placeholder="Join the Waitlist"
            />
          </div>

          {/* Subtitle */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>
              Subtitle
            </label>
            <input
              type="text"
              value={config.subtitle}
              onChange={(e) => updateConfig('subtitle', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
              }}
              placeholder="Connect your Twitter account to get started"
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>
              Description (Optional)
            </label>
            <textarea
              value={config.description || ''}
              onChange={(e) => updateConfig('description', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                resize: 'vertical',
              }}
              placeholder="Be among the first to access our platform"
            />
          </div>

          {/* Button Text */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>
              Button Text (Optional)
            </label>
            <input
              type="text"
              value={config.buttonText}
              onChange={(e) => updateConfig('buttonText', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
              }}
              placeholder="Auto-populated based on button action"
            />
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
              Leave empty to auto-populate: Waitlist = "Join Waitlist" • Coming Soon = "Coming Soon" • External Link = "Learn More" • Task Dashboard = "Start Tasks"
            </p>
          </div>

          {/* Button Action */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>
              Button Action
            </label>
            <select
              value={config.buttonAction || 'waitlist'}
              onChange={(e) => updateConfig('buttonAction', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="waitlist">Waitlist Enrollment (OAuth)</option>
              <option value="coming_soon">Coming Soon (Disabled)</option>
              <option value="external_link">External Link (Future)</option>
              <option value="task_dashboard">Task Dashboard (Future)</option>
            </select>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
              Configure what happens when users click the button. Currently only "Waitlist Enrollment" is active.
            </p>
          </div>

          {/* Success Message */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>
              Success Message
            </label>
            <input
              type="text"
              value={config.successMessage}
              onChange={(e) => updateConfig('successMessage', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
              }}
              placeholder="You've been enrolled in the waitlist!"
            />
          </div>

          {/* Colors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>
                Background Color
              </label>
              <input
                type="text"
                value={config.backgroundColor}
                onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                }}
                placeholder="#0f172a"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>
                Primary Color (Button)
              </label>
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) => updateConfig('primaryColor', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                }}
                placeholder="#8b5cf6"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>
              Logo URL (Optional)
            </label>
            <input
              type="text"
              value={config.logoUrl || ''}
              onChange={(e) => updateConfig('logoUrl', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
              }}
              placeholder="https://example.com/logo.png"
            />
          </div>

          {/* Active Toggle */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', color: '#cbd5e1', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.isActive}
                onChange={(e) => updateConfig('isActive', e.target.checked)}
                style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Landing page is active</span>
            </label>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px',
              background: '#8b5cf6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : '💾 Save Configuration'}
          </button>
        </div>

        {/* Preview Link */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#8b5cf6', textDecoration: 'none', fontSize: '14px' }}
          >
            🔗 Preview Landing Page
          </a>
        </div>
      </div>
    </Layout>
  );
}
