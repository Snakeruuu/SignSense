import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Progress {
  completedSigns: string[];
  favoriteSigns: string[];
  practiceScores: {
    alphabetQuiz: number;
    numberRecognition: number;
    phraseMatch: number;
    cameraChallenge: number;
  };
}

interface ProgressContextType {
  progress: Progress;
  addCompletedSign: (signId: string) => void;
  toggleFavorite: (signId: string) => void;
  isFavorite: (signId: string) => boolean;
  updatePracticeScore: (
    mode: keyof Progress["practiceScores"],
    score: number
  ) => void;
}

const defaultProgress: Progress = {
  completedSigns: [],
  favoriteSigns: [],
  practiceScores: {
    alphabetQuiz: 0,
    numberRecognition: 0,
    phraseMatch: 0,
    cameraChallenge: 0,
  },
};

const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined
);

const PROGRESS_KEY = "@signspeak_progress";

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem(PROGRESS_KEY);
      if (savedProgress) {
        setProgress({ ...defaultProgress, ...JSON.parse(savedProgress) });
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveProgress = async (newProgress: Progress) => {
    try {
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const addCompletedSign = (signId: string) => {
    if (!progress.completedSigns.includes(signId)) {
      const newProgress = {
        ...progress,
        completedSigns: [...progress.completedSigns, signId],
      };
      saveProgress(newProgress);
    }
  };

  const toggleFavorite = (signId: string) => {
    const newFavorites = progress.favoriteSigns.includes(signId)
      ? progress.favoriteSigns.filter((id) => id !== signId)
      : [...progress.favoriteSigns, signId];
    const newProgress = { ...progress, favoriteSigns: newFavorites };
    saveProgress(newProgress);
  };

  const isFavorite = (signId: string) => {
    return progress.favoriteSigns.includes(signId);
  };

  const updatePracticeScore = (
    mode: keyof Progress["practiceScores"],
    score: number
  ) => {
    if (score > progress.practiceScores[mode]) {
      const newProgress = {
        ...progress,
        practiceScores: { ...progress.practiceScores, [mode]: score },
      };
      saveProgress(newProgress);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <ProgressContext.Provider
      value={{
        progress,
        addCompletedSign,
        toggleFavorite,
        isFavorite,
        updatePracticeScore,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}
