import { signs } from "@/constants/signData";

export interface DetectedGesture {
  word: string;
  signId: string;
  confidence: number;
}

/**
 * Simulates gesture detection by selecting from common signs
 * In production, this would use MediaPipe hand pose detection
 */
export function simulateGestureDetection(language: "en" | "tl"): DetectedGesture {
  // Get common signs for demonstration
  const commonSigns = signs.filter((s) => s.difficulty === "easy");

  // Randomly select a sign (in production, this would analyze hand landmarks)
  const selectedSign = commonSigns[Math.floor(Math.random() * commonSigns.length)];

  // Generate confidence score (70-95% for realism)
  const confidence = (70 + Math.random() * 25) / 100;

  return {
    word: language === "en" ? selectedSign.wordEn : selectedSign.wordTl,
    signId: selectedSign.id,
    confidence,
  };
}

/**
 * Analyzes hand landmarks and matches to known sign patterns
 * This is a placeholder for the actual ML model integration
 */
export interface HandLandmarks {
  x: number[];
  y: number[];
  z: number[];
  visibility?: number[];
}

/**
 * In production, this function would:
 * 1. Take hand landmarks from MediaPipe
 * 2. Compute hand shape features
 * 3. Match against trained gesture patterns
 * 4. Return confidence scores for likely signs
 */
export function recognizeGestureFromLandmarks(
  landmarks: HandLandmarks
): DetectedGesture | null {
  // Placeholder - would implement actual gesture matching logic
  // This would compute features like:
  // - Distance between finger joints
  // - Hand orientation (palm facing direction)
  // - Finger curl state
  // - Hand movement direction

  if (!landmarks.x.length || landmarks.x.length < 21) {
    return null;
  }

  // In production, compute hand features and match to gesture library
  // For now, return null to trigger simulation mode
  return null;
}

/**
 * Feature extraction from hand landmarks
 * Computes discriminative features for gesture recognition
 */
export function extractHandFeatures(landmarks: HandLandmarks) {
  const features = {
    // Compute distances between key joints
    thumbToIndex: euclideanDistance(
      [landmarks.x[4], landmarks.y[4]],
      [landmarks.x[8], landmarks.y[8]]
    ),
    indexToMiddle: euclideanDistance(
      [landmarks.x[8], landmarks.y[8]],
      [landmarks.x[12], landmarks.y[12]]
    ),
    middleToRing: euclideanDistance(
      [landmarks.x[12], landmarks.y[12]],
      [landmarks.x[16], landmarks.y[16]]
    ),
    ringToPinky: euclideanDistance(
      [landmarks.x[16], landmarks.y[16]],
      [landmarks.x[20], landmarks.y[20]]
    ),

    // Hand span
    handSpan: euclideanDistance(
      [landmarks.x[0], landmarks.y[0]],
      [landmarks.x[9], landmarks.y[9]]
    ),

    // Palm orientation (based on hand normal)
    palmOrientation: computePalmOrientation(landmarks),
  };

  return features;
}

function euclideanDistance(p1: number[], p2: number[]): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function computePalmOrientation(landmarks: HandLandmarks): number {
  // Simplified orientation calculation
  // In practice, would use multiple vectors for better accuracy
  const wrist = [landmarks.x[0], landmarks.y[0]];
  const middle = [landmarks.x[9], landmarks.y[9]];
  const angle = Math.atan2(middle[1] - wrist[1], middle[0] - wrist[0]);
  return angle;
}

/**
 * Temporal filtering for gesture smoothing
 * Helps reduce false detections from jittery input
 */
export class GestureFilter {
  private history: string[] = [];
  private windowSize: number = 5;

  update(gestureId: string): string {
    this.history.push(gestureId);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }
    return this.getMostCommon();
  }

  private getMostCommon(): string {
    const counts: { [key: string]: number } = {};
    this.history.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });

    let maxCount = 0;
    let mostCommon = this.history[this.history.length - 1];

    Object.entries(counts).forEach(([id, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = id;
      }
    });

    return mostCommon;
  }
}
