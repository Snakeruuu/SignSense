import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import { BorderRadius, Spacing, Shadows, Colors } from "@/constants/theme";
import {
  getBackendUrl,
  setBackendUrl,
  loadBackendUrl,
  checkBackendHealth,
  BackendStatus,
} from "@/services/gestureBackendService";

const AVATARS = [
  { id: 0, icon: "user" },
  { id: 1, icon: "smile" },
  { id: 2, icon: "star" },
];

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
}: SettingRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.settingRow,
        { backgroundColor: theme.backgroundDefault },
        pressed && onPress ? { opacity: 0.7 } : null,
      ]}
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name={icon as any} size={18} color={theme.tabIconSelected} />
      </View>
      <ThemedText type="body" style={styles.settingLabel}>
        {label}
      </ThemedText>
      {rightElement ? (
        rightElement
      ) : value ? (
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {value}
        </ThemedText>
      ) : null}
      {onPress && !rightElement ? (
        <Feather
          name="chevron-right"
          size={20}
          color={theme.textSecondary}
        />
      ) : null}
    </Pressable>
  );
}

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingSection({ title, children }: SettingSectionProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText
        type="small"
        style={[styles.sectionTitle, { color: theme.textSecondary }]}
      >
        {title}
      </ThemedText>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { settings, updateSettings } = useSettings();

  const [displayName, setDisplayName] = useState(settings.displayName);
  const [backendUrl, setBackendUrlState] = useState("");
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({ isOnline: false, modelLoaded: false });
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    const loadUrl = async () => {
      const url = await loadBackendUrl();
      setBackendUrlState(url);
    };
    loadUrl();
  }, []);

  const handleNameChange = (name: string) => {
    setDisplayName(name);
  };

  const handleNameBlur = () => {
    updateSettings({ displayName });
  };

  const handleAvatarSelect = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    updateSettings({ avatarIndex: index });
  };

  const handleLanguageToggle = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLanguage(language === "en" ? "tl" : "en");
  };

  const handleTTSToggle = (value: boolean) => {
    updateSettings({ ttsEnabled: value });
  };

  const handleHighContrastToggle = (value: boolean) => {
    updateSettings({ highContrast: value });
  };

  const handleLargerTextToggle = (value: boolean) => {
    updateSettings({ largerText: value });
  };

  const handleSpeedChange = (speed: "slow" | "normal" | "fast") => {
    updateSettings({ animationSpeed: speed });
  };

  const handleBackendUrlChange = (url: string) => {
    setBackendUrlState(url);
  };

  const handleBackendUrlSave = async () => {
    await setBackendUrl(backendUrl);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await setBackendUrl(backendUrl);
    
    try {
      const status = await checkBackendHealth();
      setBackendStatus(status);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(
          status.isOnline 
            ? Haptics.NotificationFeedbackType.Success 
            : Haptics.NotificationFeedbackType.Error
        );
      }

      if (Platform.OS !== "web") {
        Alert.alert(
          status.isOnline ? "Connected!" : "Connection Failed",
          status.isOnline 
            ? `Server is online and model is ${status.modelLoaded ? "loaded" : "not loaded"}.`
            : status.error || "Could not connect to server.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      setBackendStatus({ isOnline: false, modelLoaded: false, error: "Connection test failed" });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <ThemedText type="h2" style={styles.title}>
        {t.profile.title}
      </ThemedText>

      <View style={styles.avatarSection}>
        <ThemedText
          type="small"
          style={[styles.avatarLabel, { color: theme.textSecondary }]}
        >
          {t.profile.avatar}
        </ThemedText>
        <View style={styles.avatarRow}>
          {AVATARS.map((avatar) => (
            <Pressable
              key={avatar.id}
              onPress={() => handleAvatarSelect(avatar.id)}
              style={[
                styles.avatarOption,
                {
                  backgroundColor:
                    settings.avatarIndex === avatar.id
                      ? theme.tabIconSelected
                      : theme.backgroundDefault,
                },
              ]}
            >
              <Feather
                name={avatar.icon as any}
                size={28}
                color={
                  settings.avatarIndex === avatar.id
                    ? "#FFFFFF"
                    : theme.text
                }
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.nameSection}>
        <ThemedText
          type="small"
          style={[styles.nameLabel, { color: theme.textSecondary }]}
        >
          {t.profile.displayName}
        </ThemedText>
        <TextInput
          style={[
            styles.nameInput,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
            },
          ]}
          value={displayName}
          onChangeText={handleNameChange}
          onBlur={handleNameBlur}
          placeholder={t.profile.enterName}
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <SettingSection title={t.profile.language}>
        <Pressable
          onPress={handleLanguageToggle}
          style={[
            styles.languageToggle,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View
            style={[
              styles.languageOption,
              language === "en"
                ? { backgroundColor: theme.tabIconSelected }
                : null,
            ]}
          >
            <ThemedText
              type="body"
              style={{
                color: language === "en" ? "#FFFFFF" : theme.text,
                fontWeight: language === "en" ? "600" : "400",
              }}
            >
              {t.profile.english}
            </ThemedText>
          </View>
          <View
            style={[
              styles.languageOption,
              language === "tl"
                ? { backgroundColor: theme.tabIconSelected }
                : null,
            ]}
          >
            <ThemedText
              type="body"
              style={{
                color: language === "tl" ? "#FFFFFF" : theme.text,
                fontWeight: language === "tl" ? "600" : "400",
              }}
            >
              {t.profile.tagalog}
            </ThemedText>
          </View>
        </Pressable>
      </SettingSection>

      <SettingSection title={t.profile.audio}>
        <SettingRow
          icon="volume-2"
          label={t.profile.ttsVoice}
          rightElement={
            <Switch
              value={settings.ttsEnabled}
              onValueChange={handleTTSToggle}
              trackColor={{
                false: theme.backgroundSecondary,
                true: Colors.light.success,
              }}
            />
          }
        />
      </SettingSection>

      <SettingSection title={t.profile.playback}>
        <View
          style={[
            styles.speedToggle,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          {(["slow", "normal", "fast"] as const).map((speed) => (
            <Pressable
              key={speed}
              onPress={() => handleSpeedChange(speed)}
              style={[
                styles.speedOption,
                settings.animationSpeed === speed
                  ? { backgroundColor: theme.tabIconSelected }
                  : null,
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color:
                    settings.animationSpeed === speed
                      ? "#FFFFFF"
                      : theme.text,
                  fontWeight:
                    settings.animationSpeed === speed ? "600" : "400",
                }}
              >
                {t.profile[speed]}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </SettingSection>

      <SettingSection title={t.profile.accessibility}>
        <SettingRow
          icon="sun"
          label={t.profile.highContrast}
          rightElement={
            <Switch
              value={settings.highContrast}
              onValueChange={handleHighContrastToggle}
              trackColor={{
                false: theme.backgroundSecondary,
                true: Colors.light.success,
              }}
            />
          }
        />
        <SettingRow
          icon="type"
          label={t.profile.largerText}
          rightElement={
            <Switch
              value={settings.largerText}
              onValueChange={handleLargerTextToggle}
              trackColor={{
                false: theme.backgroundSecondary,
                true: Colors.light.success,
              }}
            />
          }
        />
      </SettingSection>

      <SettingSection title="Backend Server">
        <View style={styles.backendSection}>
          <View style={styles.backendUrlRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              Server URL (your computer's IP address)
            </ThemedText>
            <TextInput
              style={[
                styles.backendInput,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: backendStatus.isOnline ? Colors.light.success : theme.backgroundSecondary,
                },
              ]}
              value={backendUrl}
              onChangeText={handleBackendUrlChange}
              onBlur={handleBackendUrlSave}
              placeholder="http://192.168.1.5:5000"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
          
          <Pressable
            onPress={handleTestConnection}
            disabled={isTestingConnection}
            style={[
              styles.testButton,
              {
                backgroundColor: backendStatus.isOnline ? Colors.light.success : theme.tabIconSelected,
                opacity: isTestingConnection ? 0.6 : 1,
              },
            ]}
          >
            <Feather 
              name={backendStatus.isOnline ? "check-circle" : "wifi"} 
              size={16} 
              color="#FFFFFF" 
            />
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {isTestingConnection ? "Testing..." : backendStatus.isOnline ? "Connected" : "Test Connection"}
            </ThemedText>
          </Pressable>

          <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            To find your IP: On Mac run 'ifconfig', on Windows run 'ipconfig'. Use that IP instead of localhost.
          </ThemedText>
        </View>
      </SettingSection>

      <SettingSection title={t.profile.about}>
        <SettingRow
          icon="info"
          label={t.profile.version}
          value="1.0.0"
        />
        <SettingRow
          icon="shield"
          label={t.profile.privacy}
          onPress={() => {}}
        />
        <SettingRow
          icon="help-circle"
          label={t.profile.help}
          onPress={() => {}}
        />
      </SettingSection>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.xl,
  },
  avatarSection: {
    marginBottom: Spacing.xl,
  },
  avatarLabel: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  avatarRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.small,
  },
  nameSection: {
    marginBottom: Spacing.xl,
  },
  nameLabel: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  nameInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    gap: Spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    ...Shadows.small,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingLabel: {
    flex: 1,
  },
  languageToggle: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    ...Shadows.small,
  },
  languageOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  speedToggle: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    ...Shadows.small,
  },
  speedOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  backendSection: {
    gap: Spacing.md,
  },
  backendUrlRow: {
    marginBottom: Spacing.xs,
  },
  backendInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 14,
    borderWidth: 2,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
});
