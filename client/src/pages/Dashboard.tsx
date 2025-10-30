import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { logger } from '../utils/logger';

export default function Dashboard() {
  const [stats, setStats] = useState({
    twitterApps: 0,
    users: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [appsRes, usersRes] = await Promise.all([
        fetch('/api/twitter-apps'),
        fetch('/api/users'),
      ]);

      const appsData = await appsRes.json();
      const usersData = await usersRes.json();

      const stats = {
        twitterApps: appsData.data?.length || 0,
        users: usersData.data?.length || 0,
        activeUsers: usersData.data?.filter((u: any) => u.isActive).length || 0,
      };
      setStats(stats);
      logger.success('Dashboard stats loaded', stats);
    } catch (error) {
      logger.error('Failed to fetch dashboard stats', error);
    }
  };

  const StatCard = ({ title, value, icon }: any) => (
    <div style={{
      background: '#1e293b',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #334155',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ color: '#94a3b8', fontSize: '14px' }}>{title}</div>
    </div>
  );

  return (
    <Layout>
      <h1 style={{ marginBottom: '30px', fontSize: '32px', color: '#fff' }}>
        Dashboard
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
      }}>
        <StatCard
          icon="🐦"
          title="Twitter Apps"
          value={stats.twitterApps}
        />
        <StatCard
          icon="👥"
          title="Total Users"
          value={stats.users}
        />
        <StatCard
          icon="✅"
          title="Active Users"
          value={stats.activeUsers}
        />
      </div>

      <div style={{
        background: '#1e293b',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #334155',
      }}>
        <h2 style={{ marginBottom: '16px', color: '#fff' }}>Welcome to Tasker</h2>
        <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
          Tasker is your Twitter automation platform. Manage multiple Twitter apps,
          authenticate users, and automate tweet posting with ease.
        </p>
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '12px', color: '#cbd5e1', fontSize: '16px' }}>
            Quick Start:
          </h3>
          <ol style={{ color: '#94a3b8', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Create a Twitter app in the Twitter Apps section</li>
            <li>Configure your OAuth callback URL</li>
            <li>Start authenticating users</li>
            <li>Post tweets automatically</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}
