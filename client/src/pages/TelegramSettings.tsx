import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface TelegramSettings {
  bot_token: string;
  chat_id: string;
  bot_enabled: boolean;
}

export default function TelegramSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<TelegramSettings>({
    bot_token: '',
    chat_id: '',
    bot_enabled: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/telegram-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings({
            bot_token: data.settings.bot_token || '',
            chat_id: data.settings.chat_id || '',
            bot_enabled: data.settings.bot_enabled || false,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch Telegram settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Telegram settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/telegram-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: settings.bot_token,
          chatId: settings.chat_id,
          botEnabled: settings.bot_enabled,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Telegram settings saved successfully',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save Telegram settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save Telegram settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/admin/telegram-settings/test', {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Test notification sent! Check your Telegram group.',
        });
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test notification. Check your settings.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Telegram Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Configure Telegram bot to receive notifications when users authenticate
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bot Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive alerts when users join via Twitter OAuth
              </div>
            </div>
            <Switch
              checked={settings.bot_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, bot_enabled: checked })
              }
            />
          </div>

          {/* Bot Token */}
          <div className="space-y-2">
            <Label htmlFor="bot_token">Bot Token</Label>
            <Input
              id="bot_token"
              type="password"
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={settings.bot_token}
              onChange={(e) =>
                setSettings({ ...settings, bot_token: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Get your bot token from{' '}
              <a
                href="https://t.me/botfather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @BotFather
              </a>{' '}
              on Telegram
            </p>
          </div>

          {/* Chat ID */}
          <div className="space-y-2">
            <Label htmlFor="chat_id">Chat ID</Label>
            <Input
              id="chat_id"
              placeholder="-1001234567890"
              value={settings.chat_id}
              onChange={(e) =>
                setSettings({ ...settings, chat_id: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Add your bot to the "Tasker Chat ID" group and get the chat ID
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !settings.bot_enabled}
            >
              {testing ? 'Sending...' : 'Send Test Message'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="font-semibold min-w-[30px]">1.</div>
              <div>
                Open Telegram and search for{' '}
                <code className="bg-muted px-2 py-1 rounded">@BotFather</code>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-semibold min-w-[30px]">2.</div>
              <div>
                Send <code className="bg-muted px-2 py-1 rounded">/newbot</code>{' '}
                and follow the instructions. Name it "Credential Task Bot"
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-semibold min-w-[30px]">3.</div>
              <div>Copy the bot token and paste it above</div>
            </div>
            <div className="flex gap-3">
              <div className="font-semibold min-w-[30px]">4.</div>
              <div>
                Create a new group called "Tasker Chat ID" and add your bot to
                it
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-semibold min-w-[30px]">5.</div>
              <div>
                Get the chat ID using{' '}
                <code className="bg-muted px-2 py-1 rounded">
                  @userinfobot
                </code>{' '}
                or by sending a message and checking the bot API
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-semibold min-w-[30px]">6.</div>
              <div>Enter the chat ID above and enable notifications</div>
            </div>
            <div className="flex gap-3">
              <div className="font-semibold min-w-[30px]">7.</div>
              <div>Click "Send Test Message" to verify everything works</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
            <div className="font-bold">🆕 New User Authenticated</div>
            <div className="space-y-1 text-muted-foreground">
              <div>👤 <strong>Username:</strong> @example_user</div>
              <div>🆔 <strong>Twitter ID:</strong> 1234567890</div>
              <div>👥 <strong>Followers:</strong> 1,250</div>
              <div>⏰ <strong>Time:</strong> {new Date().toLocaleString()}</div>
            </div>
            <div className="text-xs italic text-muted-foreground mt-2">
              🤖 Credential Task Bot
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
