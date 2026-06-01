import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PracticeScreen from "@/screens/PracticeScreen";
import PracticeExerciseScreen from "@/screens/PracticeExerciseScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type PracticeMode =
  | "alphabetQuiz"
  | "numberRecognition"
  | "phraseMatch"
  | "cameraChallenge";

export type PracticeStackParamList = {
  Practice: undefined;
  PracticeExercise: { mode: PracticeMode };
};

const Stack = createNativeStackNavigator<PracticeStackParamList>();

export default function PracticeStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Practice"
        component={PracticeScreen}
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="PracticeExercise"
        component={PracticeExerciseScreen}
        options={{
          presentation: "modal",
          headerTitle: "",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
