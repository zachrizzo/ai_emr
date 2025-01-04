'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

interface SecuritySettings {
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecialChars: boolean
  sessionTimeout: number
  mfaEnforced: boolean
}

export function SecuritySettings({organizationId}: { organizationId: string | null }) {
  const [settings, setSettings] = useState<SecuritySettings>({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    sessionTimeout: 30,
    mfaEnforced: false,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      if (!organizationId) return;

      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('organization_id', organizationId);

        if (error) throw error;

        if (data && data.length > 0) {
          const fetchedSettings: Partial<SecuritySettings> = {};
          data.forEach((setting: any) => {
            const value = setting.setting_value;
            switch (setting.setting_name) {
              case 'passwordMinLength':
                fetchedSettings.passwordMinLength = parseInt(value, 10);
                break;
              case 'passwordRequireUppercase':
                fetchedSettings.passwordRequireUppercase = value === 'true';
                break;
              case 'passwordRequireNumbers':
                fetchedSettings.passwordRequireNumbers = value === 'true';
                break;
              case 'passwordRequireSpecialChars':
                fetchedSettings.passwordRequireSpecialChars = value === 'true';
                break;
              case 'sessionTimeout':
                fetchedSettings.sessionTimeout = parseInt(value, 10);
                break;
              case 'mfaEnforced':
                fetchedSettings.mfaEnforced = value === 'true';
                break;
              default:
                break;
            }
          });
          setSettings(prevSettings => ({ ...prevSettings, ...fetchedSettings }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to fetch security settings",
          variant: "destructive",
        });
      }
    };

    fetchSettings();
  }, [organizationId]);

  const handleChange = (key: keyof SecuritySettings, value: number | boolean) => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
  
    try {
        const updates = Object.entries(settings).map(([settingName, settingValue]) => ({
            setting_name: settingName,
            setting_value: settingValue,
            organization_id: organizationId,
          }));
        const { data, error } = await supabase.from('system_settings').upsert(updates).select()

      if (error) {
        throw error;
      }
  
      toast({
        title: "Settings Saved",
        description: "Your security settings have been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error Saving Settings",
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
        <Input
          id="passwordMinLength"
          type="number"
          value={settings.passwordMinLength}
          onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value, 10))}
          min={1}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="passwordRequireUppercase"
          checked={settings.passwordRequireUppercase}
          onCheckedChange={(checked) => handleChange('passwordRequireUppercase', checked)}
        />
        <Label htmlFor="passwordRequireUppercase">Require Uppercase Letters</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="passwordRequireNumbers"
          checked={settings.passwordRequireNumbers}
          onCheckedChange={(checked) => handleChange('passwordRequireNumbers', checked)}
        />
        <Label htmlFor="passwordRequireNumbers">Require Numbers</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="passwordRequireSpecialChars"
          checked={settings.passwordRequireSpecialChars}
          onCheckedChange={(checked) => handleChange('passwordRequireSpecialChars', checked)}
        />
        <Label htmlFor="passwordRequireSpecialChars">Require Special Characters</Label>
      </div>
      <div>
        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
        <Input
          id="sessionTimeout"
          type="number"
          value={settings.sessionTimeout}
          onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value, 10))}
          min={1}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="mfaEnforced"
          checked={settings.mfaEnforced}
          onCheckedChange={(checked) => handleChange('mfaEnforced', checked)}
        />
        <Label htmlFor="mfaEnforced">Enforce Multi-Factor Authentication</Label>
      </div>
      <Button type="submit">Save Settings</Button>
    </form>
  )
}

