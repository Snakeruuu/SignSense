import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Settings {
  displayName: string;
  avatarIndex: number;
  ttsEnabled: boolean;
  animationSpeed: "slow" | "normal" | "fast";
  highContrast: boolean;
  largerText: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  displayName: "",
  avatarIndex: 0,
  ttsEnabled: true,
  animationSpeed: "normal",
  highContrast: false,
  largerText: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

const SETTINGS_KEY = "@signspeak_settings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
