import React, { useLayoutEffect } from "react";
import { StyleSheet, View, Pressable, Platform, Image } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProgress } from "@/contexts/ProgressContext";
import { useSettings } from "@/contexts/SettingsContext";
import { BorderRadius, Spacing, Shadows, Colors } from "@/constants/theme";
import { getSignById, signs } from "@/constants/signData";
import { LearnStackParamList } from "@/navigation/LearnStackNavigator";

type SignDetailScreenProps = {
  navigation: NativeStackNavigationProp<LearnStackParamList, "SignDetail">;
  route: RouteProp<LearnStackParamList, "SignDetail">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignDetailScreen({
  navigation,
  route,
}: SignDetailScreenProps) {
  const { theme, isDark } = useTheme();
  const { t, language } = useLanguage();
  const { toggleFavorite, isFavorite, addCompletedSign } = useProgress();
  const { settings } = useSettings();
  const { signId } = route.params;

  const sign = getSignById(signId);
  const handRotation = useSharedValue(0);
  const handScale = useSharedValue(1);

  useLayoutEffect(() => {
    if (sign) {
      navigation.setOptions({
        headerTitle: language === "en" ? sign.wordEn : sign.wordTl,
        headerRight: () => (
          <Pressable
            onPress={handleFavoritePress}
            style={styles.headerButton}
            hitSlop={8}
          >
            <Feather
              name={isFavorite(signId) ? "heart" : "heart"}
              size={22}
              color={isFavorite(signId) ? Colors.light.error : theme.text}
              style={{ opacity: isFavorite(signId) ? 1 : 0.7 }}
            />
          </Pressable>
        ),
      });
    }
  }, [navigation, sign, language, signId, isFavorite(signId)]);

  React.useEffect(() => {
    handRotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    handScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const handAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${handRotation.value}deg` },
      { scale: handScale.value },
    ],
  }));

  if (!sign) {
    return (
      <ScreenScrollView>
        <ThemedText type="body">{t.common.error}</ThemedText>
      </ScreenScrollView>
    );
  }

  const handleFavoritePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleFavorite(signId);
  };

  const handleSpeak = () => {
    if (settings.ttsEnabled) {
      const text = language === "en" ? sign.wordEn : sign.wordTl;
      Speech.speak(text, {
        language: language === "en" ? "en-US" : "fil-PH",
      });
    }
  };

  const handleMarkComplete = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    addCompletedSign(signId);
  };

  const word = language === "en" ? sign.wordEn : sign.wordTl;
  const altWord = language === "en" ? sign.wordTl : sign.wordEn;
  const description =
    language === "en" ? sign.descriptionEn : sign.descriptionTl;
  const steps = language === "en" ? sign.steps : sign.stepsTl;

  const relatedSignsData = sign.relatedSigns
    .map((id) => signs.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <ScreenScrollView>
      <View
        style={[
          styles.animationContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        {sign.emoji ? (
          <Animated.View style={[styles.handIcon, handAnimatedStyle]}>
            <ThemedText type="h1" style={{ fontSize: 80 }}>
              {sign.emoji}
            </ThemedText>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.handIcon, handAnimatedStyle]}>
            <Feather name="edit-3" size={80} color={theme.tabIconSelected} />
          </Animated.View>
        )}
      </View>

      <View style={styles.wordContainer}>
        <View style={styles.wordRow}>
          <ThemedText type="h1">{word}</ThemedText>
          <Pressable
            onPress={handleSpeak}
            style={[styles.speakButton, { backgroundColor: theme.backgroundSecondary }]}
            hitSlop={8}
          >
            <Feather name="volume-2" size={20} color={theme.tabIconSelected} />
          </Pressable>
        </View>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {altWord}
        </ThemedText>
      </View>

      <ThemedText type="body" style={styles.description}>
        {description}
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          {t.library.stepByStep}
        </ThemedText>
        {steps.map((step, index) => (
          <View
            key={index}
            style={[styles.stepItem, { backgroundColor: theme.backgroundDefault }]}
          >
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: theme.tabIconSelected },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: "#FFFFFF", fontWeight: "600" }}
              >
                {index + 1}
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.stepText}>
              {step}
            </ThemedText>
          </View>
        ))}
      </View>

      {relatedSignsData.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            {t.library.relatedSigns}
          </ThemedText>
          <View style={styles.relatedSignsRow}>
            {relatedSignsData.map((relatedSign) =>
              relatedSign ? (
                <Pressable
                  key={relatedSign.id}
                  onPress={() =>
                    navigation.push("SignDetail", { signId: relatedSign.id })
                  }
                  style={[
                    styles.relatedSignCard,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <View
                    style={[
                      styles.relatedSignIcon,
                      { backgroundColor: theme.backgroundSecondary },
                    ]}
                  >
                    <Feather
                      name="edit-3"
                      size={20}
                      color={theme.tabIconSelected}
                    />
                  </View>
                  <ThemedText type="small" numberOfLines={1}>
                    {language === "en" ? relatedSign.wordEn : relatedSign.wordTl}
                  </ThemedText>
                </Pressable>
              ) : null
            )}
          </View>
        </View>
      ) : null}

      <Button onPress={handleMarkComplete} style={styles.practiceButton}>
        {t.library.practiceThis}
      </Button>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  animationContainer: {
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  handIcon: {
    opacity: 0.9,
  },
  wordContainer: {
    marginBottom: Spacing.lg,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  speakButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    marginBottom: Spacing.xl,
    opacity: 0.8,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  stepText: {
    flex: 1,
  },
  relatedSignsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  relatedSignCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    minWidth: 80,
    ...Shadows.small,
  },
  relatedSignIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  practiceButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  headerButton: {
    padding: Spacing.xs,
  },
});
