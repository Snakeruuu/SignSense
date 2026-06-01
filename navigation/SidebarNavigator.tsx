import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import {
  createDrawerNavigator,
  DrawerNavigationProp,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import LearnStackNavigator from "@/navigation/LearnStackNavigator";
import PracticeStackNavigator from "@/navigation/PracticeStackNavigator";
import LibraryStackNavigator from "@/navigation/LibraryStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import HomeScreen from "@/screens/HomeScreen";
import TranslateScreen from "@/screens/TranslateScreen";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

export type SidebarParamList = {
  Home: undefined;
  LearnTab: undefined;
  PracticeTab: undefined;
  LibraryTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Sidebar: undefined;
  TranslateModal: undefined;
};

const Drawer = createDrawerNavigator<SidebarParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function CustomDrawerContent(props: any) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: theme.backgroundDefault }}
    >
      {/* App Header */}
      <View style={styles.drawerHeader}>
        <View
          style={[
            styles.appIcon,
            { backgroundColor: Colors.accent },
          ]}
        >
          <Feather name="edit-3" size={28} color="#FFFFFF" />
        </View>
        <ThemedText type="h2" style={styles.appName}>
          SignSpeak
        </ThemedText>
      </View>

      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function DrawerNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Drawer.Navigator
      drawerContent={CustomDrawerContent}
      screenOptions={{
        drawerType: "slide",
        drawerStyle: {
          backgroundColor: theme.backgroundDefault,
          width: "70%",
        },
        drawerLabelStyle: {
          marginLeft: -20,
        },
        drawerActiveTintColor: theme.tabIconSelected,
        drawerInactiveTintColor: theme.tabIconDefault,
        headerStyle: {
          backgroundColor: theme.backgroundDefault,
          borderBottomColor: theme.backgroundSecondary,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          drawerIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="LearnTab"
        component={LearnStackNavigator}
        options={{
          title: t.tabs.learn,
          drawerIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="PracticeTab"
        component={PracticeStackNavigator}
        options={{
          title: t.tabs.practice,
          drawerIcon: ({ color, size }) => (
            <Feather name="zap" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="LibraryTab"
        component={LibraryStackNavigator}
        options={{
          title: t.tabs.library,
          drawerIcon: ({ color, size }) => (
            <Feather name="book" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: t.tabs.profile,
          drawerIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Drawer.Navigator>
  );
}

export default function SidebarNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Group screenOptions={{ headerShown: false }}>
        <RootStack.Screen
          name="Sidebar"
          component={DrawerNavigator}
        />
      </RootStack.Group>
      <RootStack.Group
        screenOptions={{
          presentation: "modal",
          animationEnabled: true,
        }}
      >
        <RootStack.Screen
          name="TranslateModal"
          component={TranslateScreen}
          options={{
            headerShown: false,
          }}
        />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    flex: 1,
  },
});
