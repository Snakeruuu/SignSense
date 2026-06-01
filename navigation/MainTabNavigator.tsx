import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import {
  createBottomTabNavigator,
  BottomTabNavigationProp,
} from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import LearnStackNavigator from "@/navigation/LearnStackNavigator";
import PracticeStackNavigator from "@/navigation/PracticeStackNavigator";
import LibraryStackNavigator from "@/navigation/LibraryStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import TranslateScreen from "@/screens/TranslateScreen";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Colors, Spacing, Shadows } from "@/constants/theme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type MainTabParamList = {
  LearnTab: undefined;
  PracticeTab: undefined;
  LibraryTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Sidebar: undefined;
  TranslateModal: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

export function TranslateModalStack() {
  return (
    <RootStack.Navigator
      screenOptions={{
        presentation: "modal",
        headerShown: false,
      }}
    >
      <RootStack.Screen
        name="TranslateModal"
        component={TranslateScreen}
        options={{
          animationEnabled: true,
        }}
      />
    </RootStack.Navigator>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FloatingActionButton() {
  const scale = useSharedValue(1);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    navigation.navigate("TranslateModal");
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.fab,
        { bottom: 49 + insets.bottom / 2 + Spacing.sm },
        animatedStyle,
      ]}
    >
      <Feather name="camera" size={24} color="#FFFFFF" />
    </AnimatedPressable>
  );
}

function TabNavigator() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="LearnTab"
        screenOptions={{
          tabBarActiveTintColor: theme.tabIconSelected,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.select({
              ios: "transparent",
              android: theme.backgroundDefault,
              web: theme.backgroundDefault,
            }),
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : null,
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="LearnTab"
          component={LearnStackNavigator}
          options={{
            title: t.tabs.learn,
            tabBarIcon: ({ color, size }) => (
              <Feather name="book-open" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="PracticeTab"
          component={PracticeStackNavigator}
          options={{
            title: t.tabs.practice,
            tabBarIcon: ({ color, size }) => (
              <Feather name="target" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="LibraryTab"
          component={LibraryStackNavigator}
          options={{
            title: t.tabs.library,
            tabBarIcon: ({ color, size }) => (
              <Feather name="grid" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackNavigator}
          options={{
            title: t.tabs.profile,
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <FloatingActionButton />
    </View>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={TabNavigator} />
      <RootStack.Screen
        name="TranslateModal"
        component={TranslateScreen}
        options={{
          presentation: "modal",
          ...getCommonScreenOptions({ theme, isDark, transparent: false }),
          headerShown: false,
        }}
      />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    alignSelf: "center",
    width: Spacing.fabSize,
    height: Spacing.fabSize,
    borderRadius: Spacing.fabSize / 2,
    backgroundColor: Colors.light.accent,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.medium,
  },
});
