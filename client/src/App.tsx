import { useState, useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TwitterApps from './pages/TwitterApps';
import Users from './pages/Users';
import LandingPageConfig from './pages/LandingPageConfig';
import TelegramSettings from './pages/TelegramSettings';
import { logger } from './utils/logger';

function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [location] = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    logger.auth('Checking authentication');
    try {
      logger.api('GET', '/api/auth/session');
      const response = await fetch('/api/auth/session');
      logger.fetch('Auth session response received', { status: response.status });
      const data = await response.json();
      setAuthenticated(data.authenticated || false);
      logger.success(`Authentication check complete: ${data.authenticated ? 'authenticated' : 'not authenticated'}`);
    } catch (error) {
      logger.error('Auth check failed', error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const isAdminRoute = location.startsWith('/admin');

  if (loading && isAdminRoute) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAdminRoute && !authenticated && !loading) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/admin">
        {authenticated ? <Dashboard /> : <Login onLogin={() => setAuthenticated(true)} />}
      </Route>
      <Route path="/admin/twitter-apps">
        {authenticated ? <TwitterApps /> : <Login onLogin={() => setAuthenticated(true)} />}
      </Route>
      <Route path="/admin/users">
        {authenticated ? <Users /> : <Login onLogin={() => setAuthenticated(true)} />}
      </Route>
      <Route path="/admin/landing-page">
        {authenticated ? <LandingPageConfig /> : <Login onLogin={() => setAuthenticated(true)} />}
      </Route>
      <Route path="/admin/telegram-settings">
        {authenticated ? <TelegramSettings /> : <Login onLogin={() => setAuthenticated(true)} />}
      </Route>
      <Route>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>404 - Page Not Found</h1>
          <a href="/">Return Home</a>
        </div>
      </Route>
    </Switch>
  );
}

export default App;
