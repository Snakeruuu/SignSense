import React, { useState, useRef, useEffect, useCallback } from "react";
import { StyleSheet, View, Pressable, Platform, Dimensions, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { HandLandmarkOverlay, AnalysisOverlay } from "@/components/HandLandmarkOverlay";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Spacing } from "@/constants/theme";
import { signs } from "@/constants/signData";
import {
  AdvancedGestureAnalyzer,
  HandLandmarks,
  DetectedGesture,
  simulateASLGesture,
} from "@/services/aslGestureRecognition";
import {
  checkBackendHealth,
  recognizeGestureFromImage,
  BackendStatus,
  GestureRecognitionResult,
  loadBackendUrl,
} from "@/services/gestureBackendService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function TranslateScreen() {
  const { theme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [permission, requestPermission] = useCameraPermissions();
  const [recognizedText, setRecognizedText] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [currentLandmarks, setCurrentLandmarks] = useState<any>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({ isOnline: false, modelLoaded: false });
  const [useSimulation, setUseSimulation] = useState(true);
  
  // This powers the editable text input box from your screenshot
  const [sentence, setSentence] = useState("");

  const cameraRef = useRef<CameraView>(null);
  const continuousDetectionRef = useRef<NodeJS.Timeout | null>(null);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(1.05, { duration: 1000 }), -1, true);
    
    const initBackend = async () => {
      await loadBackendUrl();
      const status = await checkBackendHealth();
      setBackendStatus(status);
      setUseSimulation(!status.isOnline);
    };
    initBackend();

    return () => {
      if (continuousDetectionRef.current) clearInterval(continuousDetectionRef.current);
    };
  }, []);

  const speakWithAccent = useCallback((text: string) => {
    if (!settings.ttsEnabled) return;
    Speech.speak(text, { language: language === "en" ? "en-US" : "fil-PH" });
  }, [settings.ttsEnabled, language]);

  // Updated to input letters into the Editable TextInput
  const addToSentence = useCallback((letter: string) => {
    if (!letter) return;
    setSentence(prev => {
      const newChar = letter.toUpperCase();
      // Logic to prevent duplicate spamming of the same letter
      if (prev.slice(-1) === newChar) return prev;
      return prev + newChar;
    });
  }, []);

  const processGestureResult = useCallback((gesture: DetectedGesture | null, landmarks: HandLandmarks | null) => {
    setCurrentLandmarks(landmarks);
    setHandDetected(landmarks !== null);

    if (gesture && gesture.word) {
      setRecognizedText(gesture.word);
      setConfidence(gesture.confidence);
      addToSentence(gesture.word);
      if (settings.ttsEnabled && !isContinuousMode) speakWithAccent(gesture.word);
    }
  }, [settings.ttsEnabled, isContinuousMode, speakWithAccent, addToSentence]);

  const captureAndRecognize = useCallback(async () => {
    if (!cameraRef.current || useSimulation) return null;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      if (!photo?.base64) return null;
      return await recognizeGestureFromImage(photo.base64, language);
    } catch (e) { return null; }
  }, [language, useSimulation]);

  const runDetection = useCallback(async () => {
    if (useSimulation) {
      const randomSign = signs[Math.floor(Math.random() * signs.length)];
      const { gesture, landmarks } = simulateASLGesture(randomSign.id, language);
      processGestureResult(gesture, landmarks);
      return;
    }

    const result = await captureAndRecognize();
    if (result && result.gesture) {
      const word = language === "en" ? result.wordEn : result.wordTl;
      setRecognizedText(word);
      setConfidence(result.confidence);
      addToSentence(word);
    } else {
        setHandDetected(result?.handDetected || false);
    }
  }, [useSimulation, language, captureAndRecognize, processGestureResult, addToSentence]);

  const handleCapture = async () => {
    setIsDetecting(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await runDetection();
    setTimeout(() => setIsDetecting(false), 800);
  };

  const toggleContinuous = () => {
    if (isContinuousMode) {
      if (continuousDetectionRef.current) clearInterval(continuousDetectionRef.current);
      setIsContinuousMode(false);
    } else {
      setIsContinuousMode(true);
      continuousDetectionRef.current = setInterval(runDetection, 1500);
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  if (!permission?.granted) {
    return <ThemedView style={styles.container}><Button onPress={requestPermission}>Grant Camera</Button></ThemedView>;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={styles.camera} facing={cameraFacing} />
        
        {/* Top UI Overlay */}
        <View style={[styles.topControls, { marginTop: insets.top }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconCircle}><Feather name="x" size={24} color="#FFF" /></Pressable>
          <ThemedText style={styles.headerTitle}>Translate</ThemedText>
          <View style={styles.topRight}>
             <Pressable onPress={() => setShowLandmarks(!showLandmarks)} style={styles.iconCircle}><Feather name="eye" size={20} color="#FFF" /></Pressable>
             <Pressable onPress={() => setCameraFacing(cameraFacing === 'front' ? 'back' : 'front')} style={styles.iconCircle}><Feather name="rotate-cw" size={20} color="#FFF" /></Pressable>
             <Pressable onPress={() => setLanguage(language === "en" ? "tl" : "en")} style={styles.iconCircle}>
                <ThemedText style={{ color: "#FFF", fontWeight: "bold" }}>{language.toUpperCase()}</ThemedText>
             </Pressable>
          </View>
        </View>

        <View style={styles.modeToggleContainer}>
           <View style={styles.modeBadge}><Feather name="type" size={14} color="#FFF" /><ThemedText style={styles.modeText}>Text to Sign</ThemedText></View>
        </View>

        {/* Hand Guide */}
        <View style={styles.guideContainer}>
          <Animated.View style={[styles.guideFrame, pulseStyle]} />
          <ThemedText style={styles.guideText}>Position your hands in the frame</ThemedText>
          <View style={[styles.handBadge, { opacity: handDetected ? 1 : 0.5 }]}>
             <View style={styles.dot} /><ThemedText style={styles.handText}>Hand detected</ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.bottomActions}>
           <Pressable onPress={toggleContinuous} style={[styles.iconCircleLarge, isContinuousMode && {backgroundColor: '#ef4444'}]}><Feather name="video" size={28} color="#FFF" /></Pressable>
           <Pressable onPress={handleCapture} style={styles.mainCaptureBtn}><View style={styles.mainCaptureInner} /></Pressable>
           <Pressable style={styles.iconCircleLarge}><Feather name="settings" size={28} color="#FFF" /></Pressable>
        </View>
      </View>

      {/* Result Sheet */}
      <View style={[styles.resultSheet, { paddingBottom: insets.bottom + 20 }]}>
        <ThemedText style={styles.labelSmall}>Recognized</ThemedText>
        <View style={styles.recognizedRow}>
          <ThemedText style={styles.hugeText}>{recognizedText || " "}</ThemedText>
          <View style={styles.stableCircle}><Feather name="check" size={16} color="#FFF" /></View>
          <Pressable onPress={() => speakWithAccent(recognizedText)} style={{marginLeft: 'auto'}}>
             <Feather name="volume-2" size={24} color={theme.tabIconSelected} />
          </Pressable>
        </View>

        <View style={styles.confidenceRow}>
          <ThemedText style={styles.labelSmall}>Confidence</ThemedText>
          <View style={styles.barContainer}><View style={[styles.barFill, { width: `${confidence * 100}%` }]} /></View>
          <ThemedText style={styles.labelSmall}>{Math.round(confidence * 100)}%</ThemedText>
        </View>

        {/* Sentence Input Area - MATCHES SCREENSHOT */}
        <View style={styles.sentenceHeader}><ThemedText style={styles.labelSmall}>Sentence</ThemedText></View>
        
        <View style={styles.inputContainer}>
          <ThemedText style={styles.signLabel}> {recognizedText.toLowerCase()}</ThemedText>
          
          {/* THE EDITABLE TEXT BOX */}
          <TextInput
            style={styles.editableInput}
            value={sentence}
            onChangeText={setSentence}
            placeholder="-"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputActions}>
            <Pressable onPress={() => speakWithAccent(sentence)}><Feather name="volume-2" size={24} color="#6366f1" /></Pressable>
            <Pressable onPress={() => setSentence("")}><Feather name="trash-2" size={24} color="#ef4444" /></Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { flex: 1 },
  camera: { ...StyleSheet.absoluteFillObject },
  topControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '600' },
  topRight: { flexDirection: 'row', gap: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modeToggleContainer: { alignItems: 'center', marginTop: 10 },
  modeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 8 },
  modeText: { color: '#FFF', fontSize: 14 },
  guideContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  guideFrame: { width: SCREEN_WIDTH * 0.7, height: SCREEN_WIDTH * 0.85, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 25, borderStyle: 'dashed' },
  guideText: { color: '#FFF', marginTop: 15, fontSize: 16 },
  handBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4ade80', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginTop: 10, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  handText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  bottomActions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40, gap: 25 },
  iconCircleLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(30,41,59,0.7)', justifyContent: 'center', alignItems: 'center' },
  mainCaptureBtn: { width: 85, height: 85, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  mainCaptureInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF' },
  resultSheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, marginTop: -35 },
  labelSmall: { color: '#94a3b8', fontSize: 14, marginBottom: 5 },
  recognizedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  hugeText: { fontSize: 42, fontWeight: 'bold', color: '#FFF' },
  stableCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4ade80', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  barContainer: { flex: 1, height: 6, backgroundColor: '#334155', borderRadius: 3 },
  barFill: { height: '100%', backgroundColor: '#4ade80', borderRadius: 3 },
  sentenceHeader: { alignItems: 'flex-end', width: '62%' },
  inputContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  signLabel: { color: '#94a3b8', fontSize: 16 },
  editableInput: { backgroundColor: '#334155', width: 300, height: 60, borderRadius: 15, color: '#FFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', borderWidth: 1, borderColor: '#475569' },
  inputActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 15 }
});