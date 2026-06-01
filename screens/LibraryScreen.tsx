import React, { useState, useMemo } from "react";
import { StyleSheet, View, TextInput, Pressable, FlatList, Image } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProgress } from "@/contexts/ProgressContext";
import { BorderRadius, Spacing, Shadows, Colors } from "@/constants/theme";
import { signs, Sign, categories, SignCategory } from "@/constants/signData";
import { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";

type LibraryScreenProps = {
  navigation: NativeStackNavigationProp<LibraryStackParamList, "Library">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SignListItemProps {
  sign: Sign;
  onPress: () => void;
  isFavorite: boolean;
  language: "en" | "tl";
  categoryLabel: string;
}

function SignListItem({
  sign,
  onPress,
  isFavorite,
  language,
  categoryLabel,
}: SignListItemProps) {
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
        {sign.emoji ? (
          <ThemedText style={{ fontSize: 32 }}>{sign.emoji}</ThemedText>
        ) : (
          <Feather name="edit-3" size={24} color={theme.tabIconSelected} />
        )}
      </View>
      <View style={styles.signInfo}>
        <View style={styles.signTitleRow}>
          <ThemedText type="body" style={styles.signWord}>
            {language === "en" ? sign.wordEn : sign.wordTl}
          </ThemedText>
          {isFavorite ? (
            <Feather name="heart" size={14} color={Colors.light.error} />
          ) : null}
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {language === "en" ? sign.wordTl : sign.wordEn}
        </ThemedText>
        <View
          style={[
            styles.categoryTag,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {categoryLabel}
          </ThemedText>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </AnimatedPressable>
  );
}

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

function FilterChip({ label, isSelected, onPress }: FilterChipProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: isSelected
            ? theme.tabIconSelected
            : theme.backgroundDefault,
        },
      ]}
    >
      <ThemedText
        type="small"
        style={{
          color: isSelected ? "#FFFFFF" : theme.text,
          fontWeight: isSelected ? "600" : "400",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function LibraryScreen({ navigation }: LibraryScreenProps) {
  const { theme, isDark } = useTheme();
  const { t, language } = useLanguage();
  const { isFavorite } = useProgress();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    SignCategory | "all" | "favorites"
  >("all");

  const filteredSigns = useMemo(() => {
    let result = [...signs];

    if (selectedFilter === "favorites") {
      result = result.filter((sign) => isFavorite(sign.id));
    } else if (selectedFilter !== "all") {
      result = result.filter((sign) => sign.category === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((sign) => {
        const wordEn = sign.wordEn.toLowerCase();
        const wordTl = sign.wordTl.toLowerCase();
        return wordEn.includes(query) || wordTl.includes(query);
      });
    }

    return result.sort((a, b) => {
      const wordA = language === "en" ? a.wordEn : a.wordTl;
      const wordB = language === "en" ? b.wordEn : b.wordTl;
      return wordA.localeCompare(wordB);
    });
  }, [searchQuery, selectedFilter, language, isFavorite]);

  const handleSignPress = (signId: string) => {
    navigation.navigate("SignDetail", { signId });
  };

  const filters: { id: SignCategory | "all" | "favorites"; label: string }[] = [
    { id: "all", label: t.library.all },
    { id: "favorites", label: t.library.favorites },
    ...categories.map((cat) => ({
      id: cat.id,
      label: t.learn.categories[cat.id],
    })),
  ];

  const renderItem = ({ item }: { item: Sign }) => (
    <SignListItem
      sign={item}
      onPress={() => handleSignPress(item.id)}
      isFavorite={isFavorite(item.id)}
      language={language}
      categoryLabel={t.learn.categories[item.category]}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.searchSection,
          {
            paddingTop: headerHeight + Spacing.md,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <ThemedText type="h2" style={styles.title}>
          {t.library.title}
        </ThemedText>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={t.library.searchPlaceholder}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              isSelected={selectedFilter === item.id}
              onPress={() => setSelectedFilter(item.id)}
            />
          )}
          style={styles.filtersContainer}
        />
      </View>

      <FlatList
        data={filteredSigns}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather
              name="search"
              size={48}
              color={theme.textSecondary}
              style={{ opacity: 0.5 }}
            />
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              {t.library.noResults}
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.touchTarget,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    marginTop: Spacing.md,
  },
  filtersContent: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
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
    overflow: "hidden",
  },
  signImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  signInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  signTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  signWord: {
    fontWeight: "600",
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing["5xl"],
    gap: Spacing.md,
  },
  emptyText: {
    textAlign: "center",
  },
});
