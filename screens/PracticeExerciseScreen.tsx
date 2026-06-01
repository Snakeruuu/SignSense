import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, Platform } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProgress } from "@/contexts/ProgressContext";
import { BorderRadius, Spacing, Shadows, Colors } from "@/constants/theme";
import { signs, Sign } from "@/constants/signData";
import { PracticeStackParamList } from "@/navigation/PracticeStackNavigator";

type PracticeExerciseScreenProps = {
  navigation: NativeStackNavigationProp<
    PracticeStackParamList,
    "PracticeExercise"
  >;
  route: RouteProp<PracticeStackParamList, "PracticeExercise">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const QUESTIONS_PER_ROUND = 5;

interface Question {
  sign: Sign;
  options: string[];
  correctAnswer: string;
}

function generateQuestions(
  mode: string,
  language: "en" | "tl"
): Question[] {
  let filteredSigns: Sign[] = [];

  switch (mode) {
    case "alphabetQuiz":
      filteredSigns = signs.filter((s) => s.category === "alphabet");
      break;
    case "numberRecognition":
      filteredSigns = signs.filter((s) => s.category === "numbers");
      break;
    case "phraseMatch":
      filteredSigns = signs.filter(
        (s) => s.category === "commonPhrases" || s.category === "greetings"
      );
      break;
    case "cameraChallenge":
      filteredSigns = signs.filter(
        (s) => s.category === "greetings" || s.category === "emotions"
      );
      break;
    default:
      filteredSigns = signs;
  }

  if (filteredSigns.length < 4) {
    filteredSigns = signs.slice(0, Math.max(signs.length, 4));
  }

  const shuffled = [...filteredSigns].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(
    0,
    Math.min(QUESTIONS_PER_ROUND, shuffled.length)
  );

  return selected.map((sign) => {
    const correctAnswer = language === "en" ? sign.wordEn : sign.wordTl;
    const otherSigns = filteredSigns
      .filter((s) => s.id !== sign.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [
      correctAnswer,
      ...otherSigns.map((s) => (language === "en" ? s.wordEn : s.wordTl)),
    ].sort(() => Math.random() - 0.5);

    return {
      sign,
      options,
      correctAnswer,
    };
  });
}

export default function PracticeExerciseScreen({
  navigation,
  route,
}: PracticeExerciseScreenProps) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { updatePracticeScore } = useProgress();
  const insets = useSafeAreaInsets();
  const { mode } = route.params;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const shakeX = useSharedValue(0);
  const feedbackScale = useSharedValue(0);

  useEffect(() => {
    setQuestions(generateQuestions(mode, language));
  }, [mode, language]);

  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const feedbackAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: feedbackScale.value }],
    opacity: feedbackScale.value,
  }));

  const handleAnswer = (answer: string) => {
    if (showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === questions[currentIndex].correctAnswer;

    if (isCorrect) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setScore((prev) => prev + 1);
      feedbackScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  };

  const handleNext = () => {
    feedbackScale.value = 0;
    setSelectedAnswer(null);
    setShowResult(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      updatePracticeScore(mode, score);
      setIsFinished(true);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleRestart = () => {
    setQuestions(generateQuestions(mode, language));
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsFinished(false);
  };

  if (questions.length === 0) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText type="body">{t.common.loading}</ThemedText>
      </ThemedView>
    );
  }

  if (isFinished) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.resultContainer}>
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather
              name="award"
              size={48}
              color={
                score >= questions.length / 2
                  ? Colors.light.success
                  : Colors.light.accent
              }
            />
          </View>

          <ThemedText type="h2" style={styles.resultTitle}>
            {t.practice.yourScore}
          </ThemedText>

          <ThemedText type="h1" style={styles.resultScore}>
            {score} / {questions.length}
          </ThemedText>

          <View style={styles.resultButtons}>
            <Button onPress={handleRestart} style={styles.resultButton}>
              {t.practice.tryAgain}
            </Button>
            <Button
              onPress={handleClose}
              style={[styles.resultButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              {t.practice.backToPractice}
            </Button>
          </View>
        </View>
      </ThemedView>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.scoreDisplay}>
          <Feather name="star" size={18} color={Colors.light.accent} />
          <ThemedText type="h4">{score}</ThemedText>
        </View>
      </View>

      <View
        style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.tabIconSelected,
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            },
          ]}
        />
      </View>

      <Animated.View style={[styles.questionContainer, shakeAnimatedStyle]}>
        <View
          style={[
            styles.signPreview,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="edit-3" size={64} color={theme.tabIconSelected} />
        </View>

        <ThemedText type="h3" style={styles.questionText}>
          {language === "en"
            ? currentQuestion.sign.descriptionEn
            : currentQuestion.sign.descriptionTl}
        </ThemedText>
      </Animated.View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === currentQuestion.correctAnswer;
          const showCorrect = showResult && isCorrect;
          const showIncorrect = showResult && isSelected && !isCorrect;

          return (
            <OptionButton
              key={index}
              option={option}
              onPress={() => handleAnswer(option)}
              isSelected={isSelected}
              showCorrect={showCorrect}
              showIncorrect={showIncorrect}
              disabled={showResult}
            />
          );
        })}
      </View>

      {showResult ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <Animated.View style={[styles.feedbackContainer, feedbackAnimatedStyle]}>
            <ThemedText
              type="h4"
              style={{
                color:
                  selectedAnswer === currentQuestion.correctAnswer
                    ? Colors.light.success
                    : Colors.light.error,
              }}
            >
              {selectedAnswer === currentQuestion.correctAnswer
                ? t.practice.correct
                : t.practice.incorrect}
            </ThemedText>
          </Animated.View>

          <Button onPress={handleNext} style={styles.nextButton}>
            {currentIndex < questions.length - 1
              ? t.practice.nextQuestion
              : t.practice.finish}
          </Button>
        </View>
      ) : null}
    </ThemedView>
  );
}

interface OptionButtonProps {
  option: string;
  onPress: () => void;
  isSelected: boolean;
  showCorrect: boolean;
  showIncorrect: boolean;
  disabled: boolean;
}

function OptionButton({
  option,
  onPress,
  isSelected,
  showCorrect,
  showIncorrect,
  disabled,
}: OptionButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getBackgroundColor = () => {
    if (showCorrect) return Colors.light.success;
    if (showIncorrect) return Colors.light.error;
    if (isSelected) return theme.tabIconSelected;
    return theme.backgroundDefault;
  };

  const getTextColor = () => {
    if (showCorrect || showIncorrect || isSelected) return "#FFFFFF";
    return theme.text;
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.optionButton,
        { backgroundColor: getBackgroundColor() },
        animatedStyle,
      ]}
    >
      <ThemedText
        type="body"
        style={[styles.optionText, { color: getTextColor() }]}
      >
        {option}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: Spacing.touchTarget,
    height: Spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
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
  questionContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  signPreview: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  questionText: {
    textAlign: "center",
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
    ...Shadows.small,
  },
  optionText: {
    textAlign: "center",
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  feedbackContainer: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  nextButton: {
    ...Shadows.small,
  },
  resultContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  resultIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  resultTitle: {
    marginBottom: Spacing.md,
  },
  resultScore: {
    marginBottom: Spacing["3xl"],
  },
  resultButtons: {
    width: "100%",
    gap: Spacing.md,
  },
  resultButton: {
    width: "100%",
  },
});
