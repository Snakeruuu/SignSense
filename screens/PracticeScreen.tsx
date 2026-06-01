import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProgress } from "@/contexts/ProgressContext";
import { BorderRadius, Spacing, Shadows, Colors } from "@/constants/theme";
import {
  PracticeStackParamList,
  PracticeMode,
} from "@/navigation/PracticeStackNavigator";

type PracticeScreenProps = {
  navigation: NativeStackNavigationProp<PracticeStackParamList, "Practice">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PracticeModeData {
  id: PracticeMode;
  iconName: string;
  difficulty: "easy" | "medium" | "hard";
}

const practiceModes: PracticeModeData[] = [
  { id: "alphabetQuiz", iconName: "type", difficulty: "easy" },
  { id: "numberRecognition", iconName: "hash", difficulty: "easy" },
  { id: "phraseMatch", iconName: "message-circle", difficulty: "medium" },
  { id: "cameraChallenge", iconName: "camera", difficulty: "hard" },
];

interface PracticeModeCardProps {
  mode: PracticeModeData;
  onPress: () => void;
  title: string;
  difficultyLabel: string;
  bestScore: number;
  startLabel: string;
}

function PracticeModeCard({
  mode,
  onPress,
  title,
  difficultyLabel,
  bestScore,
  startLabel,
}: PracticeModeCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getDifficultyColor = () => {
    switch (mode.difficulty) {
      case "easy":
        return Colors.light.success;
      case "medium":
        return Colors.light.accent;
      case "hard":
        return Colors.light.error;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.modeCard,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.modeCardHeader}>
        <View
          style={[
            styles.modeIconContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather
            name={mode.iconName as any}
            size={28}
            color={theme.tabIconSelected}
          />
        </View>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor() },
          ]}
        >
          <ThemedText
            type="caption"
            style={{ color: "#FFFFFF", fontWeight: "600" }}
          >
            {difficultyLabel}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="h4" style={styles.modeTitle}>
        {title}
      </ThemedText>

      <View style={styles.modeCardFooter}>
        <View style={styles.scoreContainer}>
          <Feather name="award" size={16} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {bestScore}
          </ThemedText>
        </View>
        <View style={[styles.startButton, { backgroundColor: theme.tabIconSelected }]}>
          <ThemedText
            type="small"
            style={{ color: "#FFFFFF", fontWeight: "600" }}
          >
            {startLabel}
          </ThemedText>
          <Feather name="play" size={14} color="#FFFFFF" />
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function PracticeScreen({ navigation }: PracticeScreenProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { progress } = useProgress();

  const handleModePress = (mode: PracticeMode) => {
    navigation.navigate("PracticeExercise", { mode });
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="h2">{t.practice.title}</ThemedText>
      </View>

      <View style={styles.modesGrid}>
        {practiceModes.map((mode) => (
          <PracticeModeCard
            key={mode.id}
            mode={mode}
            onPress={() => handleModePress(mode.id)}
            title={t.practice.modes[mode.id]}
            difficultyLabel={t.practice.difficulty[mode.difficulty]}
            bestScore={progress.practiceScores[mode.id]}
            startLabel={t.practice.start}
          />
        ))}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  modesGrid: {
    gap: Spacing.lg,
  },
  modeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  modeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  modeTitle: {
    marginBottom: Spacing.md,
  },
  modeCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
});
