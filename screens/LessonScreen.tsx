import React, { useLayoutEffect } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
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
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";
import { getSignsByCategory, Sign } from "@/constants/signData";
import { LearnStackParamList } from "@/navigation/LearnStackNavigator";

type LessonScreenProps = {
  navigation: NativeStackNavigationProp<LearnStackParamList, "Lesson">;
  route: RouteProp<LearnStackParamList, "Lesson">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SignListItemProps {
  sign: Sign;
  onPress: () => void;
  isCompleted: boolean;
  language: "en" | "tl";
}

function SignListItem({ sign, onPress, isCompleted, language }: SignListItemProps) {
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

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.signItem,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.signThumbnail,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="edit-3" size={24} color={theme.tabIconSelected} />
      </View>
      <View style={styles.signInfo}>
        <ThemedText type="body" style={styles.signWord}>
          {language === "en" ? sign.wordEn : sign.wordTl}
        </ThemedText>
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary }}
        >
          {language === "en" ? sign.wordTl : sign.wordEn}
        </ThemedText>
      </View>
      <View style={styles.signStatus}>
        {isCompleted ? (
          <View
            style={[styles.completedBadge, { backgroundColor: theme.success }]}
          >
            <Feather name="check" size={16} color="#FFFFFF" />
          </View>
        ) : (
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        )}
      </View>
    </AnimatedPressable>
  );
}

export default function LessonScreen({ navigation, route }: LessonScreenProps) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { progress } = useProgress();
  const { category } = route.params;

  const signs = getSignsByCategory(category);
  const categoryTitle = t.learn.categories[category];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: categoryTitle,
    });
  }, [navigation, categoryTitle]);

  const handleSignPress = (signId: string) => {
    navigation.navigate("SignDetail", { signId });
  };

  const completedCount = signs.filter((sign) =>
    progress.completedSigns.includes(sign.id)
  ).length;

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="h2">{categoryTitle}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {completedCount} / {signs.length} completed
        </ThemedText>
      </View>

      <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.success,
              width: `${(completedCount / signs.length) * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.signsList}>
        {signs.map((sign) => (
          <SignListItem
            key={sign.id}
            sign={sign}
            onPress={() => handleSignPress(sign.id)}
            isCompleted={progress.completedSigns.includes(sign.id)}
            language={language}
          />
        ))}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  signsList: {
    gap: Spacing.md,
  },
  signItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    ...Shadows.small,
  },
  signThumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  signInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  signWord: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  signStatus: {
    marginLeft: Spacing.sm,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
