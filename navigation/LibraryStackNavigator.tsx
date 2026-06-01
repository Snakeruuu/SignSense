import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LibraryScreen from "@/screens/LibraryScreen";
import SignDetailScreen from "@/screens/SignDetailScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type LibraryStackParamList = {
  Library: undefined;
  SignDetail: { signId: string };
};

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export default function LibraryStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="SignDetail"
        component={SignDetailScreen}
        options={{
          presentation: "modal",
          headerTitle: "",
        }}
      />
    </Stack.Navigator>
  );
}
