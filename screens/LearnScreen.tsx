import React, { useLayoutEffect } from "react";
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
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";
import { categories, SignCategory } from "@/constants/signData";
import { LearnStackParamList } from "@/navigation/LearnStackNavigator";

type LearnScreenProps = {
  navigation: NativeStackNavigationProp<LearnStackParamList, "Learn">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CategoryCardProps {
  category: {
    id: SignCategory;
    iconName: string;
    signCount: number;
  };
  onPress: () => void;
  title: string;
  description: string;
}

function CategoryCard({
  category,
  onPress,
  title,
  description,
}: CategoryCardProps) {
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
        styles.categoryCard,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}
      >
        <Feather
          name={category.iconName as any}
          size={32}
          color={theme.tabIconSelected}
        />
      </View>
      <ThemedText type="h4" style={styles.categoryTitle} numberOfLines={1}>
        {title}
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.categoryDescription, { color: theme.textSecondary }]}
        numberOfLines={2}
      >
        {description}
      </ThemedText>
      <View style={styles.signCountContainer}>
        <ThemedText
          type="caption"
          style={{ color: theme.textSecondary }}
        >
          {category.signCount} signs
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

function LanguageToggle() {
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const handleToggle = () => {
    setLanguage(language === "en" ? "tl" : "en");
  };

  return (
    <Pressable
      onPress={handleToggle}
      style={[styles.languageToggle, { backgroundColor: theme.backgroundSecondary }]}
    >
      <ThemedText type="small" style={{ fontWeight: "600" }}>
        {language === "en" ? "EN" : "TL"}
      </ThemedText>
    </Pressable>
  );
}

export default function LearnScreen({ navigation }: LearnScreenProps) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <HeaderTitle title={t.appName} />,
      headerRight: () => <LanguageToggle />,
    });
  }, [navigation, t.appName, language]);

  const handleCategoryPress = (categoryId: SignCategory) => {
    navigation.navigate("Lesson", { category: categoryId });
  };

  return (
    <ScreenScrollView>
      <ThemedText type="h2" style={styles.sectionTitle}>
        {t.learn.title}
      </ThemedText>

      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onPress={() => handleCategoryPress(category.id)}
            title={t.learn.categories[category.id]}
            description={t.learn.categoryDescriptions[category.id]}
          />
        ))}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: Spacing.xl,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.lg,
  },
  categoryCard: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  categoryTitle: {
    marginBottom: Spacing.xs,
  },
  categoryDescription: {
    marginBottom: Spacing.sm,
  },
  signCountContainer: {
    marginTop: "auto",
  },
  languageToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
});
