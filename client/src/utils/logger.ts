// Client-side logger that sends logs to backend terminal instead of browser console
// Matches the main app's terminal styling with emojis and clear prefixes

type LogLevel = 'log' | 'info' | 'warn' | 'error';

class Logger {
  private sendToServer(level: LogLevel, message: string, data?: any) {
    // Send log to backend (fire and forget, don't await)
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, data }),
    }).catch(() => {
      // Silently fail if logging endpoint is unavailable
    });
  }

  // Enhanced logging methods with emoji support
  log(message: string, data?: any) {
    this.sendToServer('log', message, data);
  }

  info(message: string, data?: any) {
    this.sendToServer('info', `ℹ️ ${message}`, data);
  }

  warn(message: string, data?: any) {
    this.sendToServer('warn', `⚠️ ${message}`, data);
  }

  error(message: string, data?: any) {
    this.sendToServer('error', `❌ ${message}`, data);
  }

  success(message: string, data?: any) {
    this.sendToServer('log', `✅ ${message}`, data);
  }

  // Specific logging methods for common actions
  auth(message: string, data?: any) {
    this.sendToServer('log', `🔐 [auth] ${message}`, data);
  }

  api(method: string, endpoint: string, data?: any) {
    this.sendToServer('log', `📡 [api] ${method} ${endpoint}`, data);
  }

  fetch(resource: string, data?: any) {
    this.sendToServer('log', `📥 [fetch] ${resource}`, data);
  }

  post(action: string, data?: any) {
    this.sendToServer('log', `📤 [post] ${action}`, data);
  }

  user(action: string, data?: any) {
    this.sendToServer('log', `👤 [user] ${action}`, data);
  }

  app(action: string, data?: any) {
    this.sendToServer('log', `🐦 [app] ${action}`, data);
  }
}

// Export singleton instance
export const logger = new Logger();
