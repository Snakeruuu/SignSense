import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LearnScreen from "@/screens/LearnScreen";
import LessonScreen from "@/screens/LessonScreen";
import SignDetailScreen from "@/screens/SignDetailScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { SignCategory } from "@/constants/signData";

export type LearnStackParamList = {
  Learn: undefined;
  Lesson: { category: SignCategory };
  SignDetail: { signId: string };
};

const Stack = createNativeStackNavigator<LearnStackParamList>();

export default function LearnStackNavigator() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Learn"
        component={LearnScreen}
        options={{
          headerTitle: () => <HeaderTitle title={t.appName} />,
        }}
      />
      <Stack.Screen
        name="Lesson"
        component={LessonScreen}
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
