/**
 * Gesture Backend Service
 * Handles communication with the TFLite backend server for real gesture recognition
 */

import { signs } from "@/constants/signData";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Default backend server URL - can be configured by user
const DEFAULT_BACKEND_URL = "http://localhost:5000";
const BACKEND_URL_STORAGE_KEY = "@signspeak_backend_url";

let currentBackendUrl = DEFAULT_BACKEND_URL;

/**
 * Get the current backend URL
 */
export function getBackendUrl(): string {
  return currentBackendUrl;
}

/**
 * Set a custom backend URL (e.g., "http://192.168.1.5:5000")
 */
export async function setBackendUrl(url: string): Promise<void> {
  currentBackendUrl = url;
  try {
    await AsyncStorage.setItem(BACKEND_URL_STORAGE_KEY, url);
  } catch (error) {
    console.error("Failed to save backend URL:", error);
  }
  clearBackendStatusCache();
}

/**
 * Load the saved backend URL from storage
 */
export async function loadBackendUrl(): Promise<string> {
  try {
    const savedUrl = await AsyncStorage.getItem(BACKEND_URL_STORAGE_KEY);
    if (savedUrl) {
      currentBackendUrl = savedUrl;
      return savedUrl;
    }
  } catch (error) {
    console.error("Failed to load backend URL:", error);
  }
  return DEFAULT_BACKEND_URL;
}

export interface GestureRecognitionResult {
  gesture: string | null;
  confidence: number;
  labelId: number;
  signId: string | null;
  wordEn: string;
  wordTl: string;
  handDetected: boolean;
  landmarks: number[][] | null;
  fingerStates: boolean[] | null;
}

export interface BackendStatus {
  isOnline: boolean;
  modelLoaded: boolean;
  error?: string;
}

let cachedBackendStatus: BackendStatus | null = null;
let lastStatusCheck = 0;
const STATUS_CACHE_DURATION = 5000; // 5 seconds

/**
 * Check if the backend server is running and the model is loaded
 */
export async function checkBackendHealth(): Promise<BackendStatus> {
  const now = Date.now();
  
  // Return cached status if recent
  if (cachedBackendStatus && now - lastStatusCheck < STATUS_CACHE_DURATION) {
    return cachedBackendStatus;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${currentBackendUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      cachedBackendStatus = {
        isOnline: true,
        modelLoaded: data.model_loaded === true,
      };
    } else {
      cachedBackendStatus = {
        isOnline: false,
        modelLoaded: false,
        error: `Server responded with status ${response.status}`,
      };
    }
  } catch (error: any) {
    cachedBackendStatus = {
      isOnline: false,
      modelLoaded: false,
      error: error.name === "AbortError" ? "Connection timeout" : "Server not reachable",
    };
  }

  lastStatusCheck = now;
  return cachedBackendStatus;
}

/**
 * Clear the cached backend status to force a fresh check
 */
export function clearBackendStatusCache(): void {
  cachedBackendStatus = null;
  lastStatusCheck = 0;
}

/**
 * Send a camera frame to the backend for gesture recognition
 */
export async function recognizeGestureFromImage(
  base64Image: string,
  language: "en" | "tl" = "en"
): Promise<GestureRecognitionResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${currentBackendUrl}/recognize-gesture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("Backend error:", response.status);
      return null;
    }

    const data = await response.json();
    console.log("Backend response:", data);

    if (data.error && !data.hand_detected) {
      console.error("Recognition error:", data.error);
      return null;
    }

    // Map the gesture label to sign data
    const matchedSign = data.gesture ? findSignByLabel(data.gesture) : undefined;

    return {
      gesture: data.gesture || null,
      confidence: data.confidence || 0,
      labelId: data.label_id || -1,
      signId: matchedSign?.id || null,
      wordEn: matchedSign?.wordEn || data.gesture || "",
      wordTl: matchedSign?.wordTl || data.gesture || "",
      handDetected: data.hand_detected || false,
      landmarks: data.landmarks || null,
      fingerStates: data.finger_states || null,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("Recognition request timed out");
    } else {
      console.error("Recognition failed:", error);
    }
    return null;
  }
}

/**
 * Send hand landmarks to the backend for gesture recognition
 */
export async function recognizeGestureFromLandmarks(
  landmarks: Array<{ x: number; y: number; z: number }>,
  language: "en" | "tl" = "en"
): Promise<GestureRecognitionResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${currentBackendUrl}/recognize-landmark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        landmarks: landmarks.map((lm) => [lm.x, lm.y, lm.z]),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.error) {
      return null;
    }

    const matchedSign = data.gesture ? findSignByLabel(data.gesture) : undefined;

    return {
      gesture: data.gesture || null,
      confidence: data.confidence || 0,
      labelId: data.label_id || -1,
      signId: matchedSign?.id || null,
      wordEn: matchedSign?.wordEn || data.gesture || "",
      wordTl: matchedSign?.wordTl || data.gesture || "",
      handDetected: true,
      landmarks: null,
      fingerStates: null,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Find a sign in the database by gesture label
 */
function findSignByLabel(label: string): typeof signs[0] | undefined {
  const normalizedLabel = label.toLowerCase().replace(/_/g, " ");

  // Try exact match on ID
  let match = signs.find((s) => s.id.toLowerCase() === normalizedLabel);
  if (match) return match;

  // Try match on English word
  match = signs.find((s) => s.wordEn.toLowerCase() === normalizedLabel);
  if (match) return match;

  // Try match on Tagalog word
  match = signs.find((s) => s.wordTl.toLowerCase() === normalizedLabel);
  if (match) return match;

  // Try partial match
  match = signs.find(
    (s) =>
      s.wordEn.toLowerCase().includes(normalizedLabel) ||
      normalizedLabel.includes(s.wordEn.toLowerCase())
  );

  return match;
}

/**
 * Get available gesture labels from the backend
 */
export async function getAvailableLabels(): Promise<Record<string, string> | null> {
  try {
    const response = await fetch(`${currentBackendUrl}/get-labels`, {
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.labels;
  } catch (error) {
    return null;
  }
}
