import React, { useLayoutEffect } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProgress } from "@/contexts/ProgressContext";
import { BorderRadius, Spacing, Shadows, Colors } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}

function FeatureCard({ icon, title, subtitle, color, onPress }: FeatureCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.featureCard, animatedStyle]}
    >
      <View
        style={[
          styles.featureIconContainer,
          { backgroundColor: color },
        ]}
      >
        <Feather name={icon as any} size={32} color="#FFFFFF" />
      </View>
      <ThemedText type="h4" style={styles.featureTitle}>
        {title}
      </ThemedText>
      <ThemedText type="caption" style={styles.featureSubtitle}>
        {subtitle}
      </ThemedText>
    </AnimatedPressable>
  );
}

interface StatBoxProps {
  label: string;
  value: string | number;
  color?: string;
}

function StatBox({ label, value, color }: StatBoxProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: color || theme.backgroundSecondary }]}>
      <ThemedText type="h2" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="caption" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

export default function HomeScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<any, "Home">;
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { learned, favorited } = useProgress();
  const insets = useSafeAreaInsets();

  const totalSigns = 50; // From your sign data

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="caption" style={styles.headerSubtitle}>
          Learn Sign Language Today
        </ThemedText>
        <ThemedText type="h1" style={styles.headerTitle}>
          SignSpeak
        </ThemedText>
        <ThemedText type="body" style={styles.headerDescription}>
          Your interactive guide to American Sign Language. Learn, practice, and
          communicate with confidence.
        </ThemedText>
      </View>

      {/* Progress Section */}
      <View style={[styles.progressSection, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.progressContent}>
          <View style={styles.progressLeft}>
            <View
              style={[
                styles.progressCircle,
                { borderColor: theme.tabIconSelected },
              ]}
            >
              <ThemedText type="h2" style={styles.progressValue}>
                {learned}
              </ThemedText>
              <ThemedText type="caption" style={styles.progressTotal}>
                /{totalSigns}
              </ThemedText>
            </View>
            <View style={styles.progressText}>
              <ThemedText type="h3">Your Progress</ThemedText>
              <ThemedText type="body" style={styles.progressMessage}>
                Great job! You've learned {learned} signs.
              </ThemedText>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate("LearnTab")}
            style={[
              styles.continueButton,
              { backgroundColor: theme.tabIconSelected },
            ]}
          >
            <ThemedText type="button" style={{ color: "#FFFFFF" }}>
              Continue Learning
            </ThemedText>
            <Feather name="chevron-right" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label={t.library.categories} value={totalSigns} />
          <StatBox label="Learned" value={learned} color="#00C853" />
          <StatBox label="Favorites" value={favorited} color="#FF1744" />
        </View>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresSection}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Features
        </ThemedText>

        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="camera"
            title="Detect"
            subtitle="Live camera detection"
            color="#1ABC9C"
            onPress={() => navigation.navigate("TranslateModal")}
          />
          <FeatureCard
            icon="book"
            title="Dictionary"
            subtitle="Browse all signs"
            color="#5C6BC0"
            onPress={() => navigation.navigate("LibraryTab")}
          />
        </View>

        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="graduation-cap"
            title="Learn"
            subtitle="Step-by-step lessons"
            color="#D946A6"
            onPress={() => navigation.navigate("LearnTab")}
          />
          <FeatureCard
            icon="zap"
            title="Practice"
            subtitle="Test your knowledge"
            color="#FF9D00"
            onPress={() => navigation.navigate("PracticeTab")}
          />
        </View>

        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="heart"
            title="Favorites"
            subtitle="{favorited} saved signs"
            color="#E91E63"
            onPress={() => navigation.navigate("LibraryTab")}
          />
          <FeatureCard
            icon="settings"
            title="Settings"
            subtitle="Customize your experience"
            color="#757575"
            onPress={() => navigation.navigate("ProfileTab")}
          />
        </View>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerSubtitle: {
    marginBottom: Spacing.sm,
    opacity: 0.7,
  },
  headerTitle: {
    marginBottom: Spacing.sm,
  },
  headerDescription: {
    lineHeight: 22,
    opacity: 0.75,
  },
  progressSection: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  progressContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  progressLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  progressValue: {
    fontSize: 28,
    fontWeight: "600",
  },
  progressTotal: {
    fontSize: 14,
    marginTop: -4,
  },
  progressText: {
    flex: 1,
  },
  progressMessage: {
    marginTop: Spacing.xs,
    opacity: 0.75,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.large,
    gap: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600",
  },
  statLabel: {
    marginTop: Spacing.xs,
    opacity: 0.75,
  },
  featuresSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  featuresGrid: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  featureCard: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    alignItems: "center",
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  featureTitle: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  featureSubtitle: {
    textAlign: "center",
    opacity: 0.6,
  },
});
