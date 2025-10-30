import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { logger } from '../utils/logger';

interface TwitterApp {
  id: number;
  appName: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  redirectUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function TwitterApps() {
  const [apps, setApps] = useState<TwitterApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    appName: '',
    clientId: '',
    clientSecret: '',
    callbackUrl: '',
    redirectUrl: '',
  });

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/twitter-apps');
      const data = await response.json();
      if (data.success) {
        setApps(data.data);
        logger.app(`Loaded ${data.data?.length || 0} Twitter apps`);
      }
    } catch (error) {
      logger.error('Failed to fetch Twitter apps', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/twitter-apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowForm(false);
        setFormData({ appName: '', clientId: '', clientSecret: '', callbackUrl: '', redirectUrl: '' });
        logger.success(`Twitter app created: ${formData.appName}`);
        fetchApps();
      }
    } catch (error) {
      logger.error('Failed to create Twitter app', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Twitter app?')) return;

    try {
      await fetch(`/api/twitter-apps/${id}`, { method: 'DELETE' });
      logger.success(`Twitter app deleted (ID: ${id})`);
      fetchApps();
    } catch (error) {
      logger.error('Failed to delete Twitter app', error);
    }
  };

  const handleToggleActive = async (app: TwitterApp) => {
    try {
      await fetch(`/api/twitter-apps/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !app.isActive }),
      });
      logger.success(`Twitter app ${!app.isActive ? 'activated' : 'deactivated'}: ${app.appName}`);
      fetchApps();
    } catch (error) {
      logger.error('Failed to update Twitter app status', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', color: '#fff' }}>Twitter Apps</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          {showForm ? 'Cancel' : '+ Add App'}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: '#1e293b',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #334155',
          marginBottom: '30px',
        }}>
          <h2 style={{ marginBottom: '20px', color: '#fff' }}>Create Twitter App</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                App Name
              </label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                Client ID
              </label>
              <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                Client Secret
              </label>
              <input
                type="password"
                value={formData.clientSecret}
                onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                Callback URL
              </label>
              <input
                type="url"
                value={formData.callbackUrl}
                onChange={(e) => setFormData({ ...formData, callbackUrl: e.target.value })}
                required
                placeholder="https://yourdomain.com/auth/twitter/callback/1"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                Redirect URL (Optional)
              </label>
              <input
                type="url"
                value={formData.redirectUrl}
                onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                placeholder="https://yourdomain.com/success"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Create App
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {apps.map((app) => (
          <div
            key={app.id}
            style={{
              background: '#1e293b',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: '#fff', fontSize: '18px' }}>{app.appName}</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => handleToggleActive(app)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: app.isActive ? '#10b981' : '#64748b',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                >
                  {app.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => handleDelete(app.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px', color: '#94a3b8', fontSize: '14px' }}>
              <div>
                <strong style={{ color: '#cbd5e1' }}>Client ID:</strong>{' '}
                <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>
                  {app.clientId}
                </code>
              </div>
              <div>
                <strong style={{ color: '#cbd5e1' }}>Callback URL:</strong>{' '}
                <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>
                  {app.callbackUrl}
                </code>
              </div>
              {app.redirectUrl && (
                <div>
                  <strong style={{ color: '#cbd5e1' }}>Redirect URL:</strong>{' '}
                  <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>
                    {app.redirectUrl}
                  </code>
                </div>
              )}
              <div>
                <strong style={{ color: '#cbd5e1' }}>Created:</strong>{' '}
                {new Date(app.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}

        {apps.length === 0 && (
          <div style={{
            background: '#1e293b',
            padding: '40px',
            borderRadius: '12px',
            border: '1px solid #334155',
            textAlign: 'center',
            color: '#64748b',
          }}>
            No Twitter apps yet. Click "Add App" to create one.
          </div>
        )}
      </div>
    </Layout>
  );
}
