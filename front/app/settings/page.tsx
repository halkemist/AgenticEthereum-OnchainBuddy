'use client';

import { useState } from 'react';

// MUI Icons and Components
import { 
  Psychology as BrainIcon,
  Notifications as NotificationIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { 
  Switch,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';

// Types
interface NotificationSettings {
  riskAlerts: boolean;
  dailySuggestions: boolean;
  levelProgress: boolean;
}
interface AIPreferences {
  explanationLevel: 'beginner' | 'intermediate' | 'advanced';
  language: 'english' | 'french';
}
interface SecurityPreferences {
  maxTransactionValue: number;
}

const Settings: React.FC = () => {

  // State
  const [notifications, setNotifications] = useState<NotificationSettings>({
    riskAlerts: true,
    dailySuggestions: true,
    levelProgress: true
  });

  const [aiPreferences, setAiPreferences] = useState<AIPreferences>({
    explanationLevel: 'beginner',
    language: 'english'
  });

  const [securityPreferences, setSecurityPreferences] = useState<SecurityPreferences>({
    maxTransactionValue: 1.0
  });

  // Handlers
  const handleNotificationChange = (key: keyof NotificationSettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(prev => ({
      ...prev,
      [key]: event.target.checked
    }));
  };

  const handleAIPreferenceChange = (key: keyof AIPreferences) => (event: SelectChangeEvent) => {
    setAiPreferences(prev => ({
      ...prev,
      [key]: event.target.value
    }));
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* AI Assistant Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BrainIcon className="text-blue-500" />
            <h2 className="text-xl font-semibold">AI Assistant Settings</h2>
          </div>
          
          <div className="space-y-4">
            <FormControl fullWidth>
              <InputLabel>Explanation Level</InputLabel>
              <Select
                value={aiPreferences.explanationLevel}
                onChange={handleAIPreferenceChange('explanationLevel')}
                label="Explanation Level"
              >
                <MenuItem value="beginner">Beginner - Simple explanations</MenuItem>
                <MenuItem value="intermediate">Intermediate - More technical details</MenuItem>
                <MenuItem value="advanced">Advanced - Full technical breakdown</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={aiPreferences.language}
                onChange={handleAIPreferenceChange('language')}
                label="Language"
              >
                <MenuItem value="english">English</MenuItem>
                <MenuItem value="french">Français</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <NotificationIcon className="text-blue-500" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-700">
                  {key.split(/(?=[A-Z])/).join(' ')}
                </span>
                <Switch
                  checked={value}
                  onChange={handleNotificationChange(key as keyof NotificationSettings)}
                  color="primary"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ShieldIcon className="text-blue-500" />
            <h2 className="text-xl font-semibold">Security</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Transaction Value (ETH)
              </label>
              <Slider
                value={securityPreferences.maxTransactionValue}
                onChange={(_, newValue) => 
                  setSecurityPreferences(prev => ({
                    ...prev,
                    maxTransactionValue: newValue as number
                  }))
                }
                min={0}
                max={10}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Settings;