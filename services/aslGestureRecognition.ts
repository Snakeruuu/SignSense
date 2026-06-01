import { signs, Sign } from "@/constants/signData";

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandLandmarks {
  landmarks: HandLandmark[];
  handedness: "Left" | "Right";
  confidence: number;
}

export interface DetectedGesture {
  signId: string;
  word: string;
  confidence: number;
  matchedPattern: string;
  landmarkData?: HandLandmarks;
}

export interface GestureFrame {
  timestamp: number;
  gesture: DetectedGesture | null;
  landmarks: HandLandmarks | null;
}

const LANDMARK_INDICES = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
};

interface HandFeatures {
  thumbExtended: boolean;
  indexExtended: boolean;
  middleExtended: boolean;
  ringExtended: boolean;
  pinkyExtended: boolean;
  thumbToIndexDistance: number;
  palmOrientation: "forward" | "backward" | "side" | "up" | "down";
  handOpenness: number;
  fingerSpread: number;
  thumbCrossed: boolean;
}

interface ASLPattern {
  signId: string;
  features: Partial<HandFeatures>;
  priority: number;
}

const ASL_ALPHABET_PATTERNS: ASLPattern[] = [
  {
    signId: "a",
    features: {
      thumbExtended: true,
      indexExtended: false,
      middleExtended: false,
      ringExtended: false,
      pinkyExtended: false,
      handOpenness: 0.2,
    },
    priority: 1,
  },
  {
    signId: "b",
    features: {
      thumbExtended: false,
      indexExtended: true,
      middleExtended: true,
      ringExtended: true,
      pinkyExtended: true,
      thumbCrossed: true,
      handOpenness: 0.9,
    },
    priority: 1,
  },
  {
    signId: "c",
    features: {
      thumbExtended: true,
      indexExtended: true,
      middleExtended: true,
      ringExtended: true,
      pinkyExtended: true,
      handOpenness: 0.5,
    },
    priority: 2,
  },
  {
    signId: "d",
    features: {
      thumbExtended: false,
      indexExtended: true,
      middleExtended: false,
      ringExtended: false,
      pinkyExtended: false,
      thumbToIndexDistance: 0.3,
    },
    priority: 1,
  },
  {
    signId: "e",
    features: {
      thumbExtended: false,
      indexExtended: false,
      middleExtended: false,
      ringExtended: false,
      pinkyExtended: false,
      handOpenness: 0.1,
    },
    priority: 1,
  },
  {
    signId: "f",
    features: {
      thumbExtended: true,
      indexExtended: false,
      middleExtended: true,
      ringExtended: true,
      pinkyExtended: true,
      thumbToIndexDistance: 0.1,
    },
    priority: 2,
  },
  {
    signId: "iLoveYou",
    features: {
      thumbExtended: true,
      indexExtended: true,
      middleExtended: false,
      ringExtended: false,
      pinkyExtended: true,
      handOpenness: 0.7,
    },
    priority: 3,
  },
  {
    signId: "v",
    features: {
      thumbExtended: false,
      indexExtended: true,
      middleExtended: true,
      ringExtended: false,
      pinkyExtended: false,
      fingerSpread: 0.5,
    },
    priority: 2,
  },
  {
    signId: "l",
    features: {
      thumbExtended: true,
      indexExtended: true,
      middleExtended: false,
      ringExtended: false,
      pinkyExtended: false,
      handOpenness: 0.4,
    },
    priority: 2,
  },
  {
    signId: "o",
    features: {
      thumbExtended: true,
      indexExtended: true,
      middleExtended: true,
      ringExtended: true,
      pinkyExtended: true,
      thumbToIndexDistance: 0.15,
      handOpenness: 0.4,
    },
    priority: 2,
  },
];

const NUMBER_PATTERNS: ASLPattern[] = [
  {
    signId: "1",
    features: {
      thumbExtended: false,
      indexExtended: true,
      middleExtended: false,
      ringExtended: false,
      pinkyExtended: false,
    },
    priority: 1,
  },
  {
    signId: "2",
    features: {
      thumbExtended: false,
      indexExtended: true,
      middleExtended: true,
      ringExtended: false,
      pinkyExtended: false,
      fingerSpread: 0.4,
    },
    priority: 1,
  },
  {
    signId: "3",
    features: {
      thumbExtended: true,
      indexExtended: true,
      middleExtended: true,
      ringExtended: false,
      pinkyExtended: false,
    },
    priority: 1,
  },
  {
    signId: "4",
    features: {
      thumbExtended: false,
      indexExtended: true,
      middleExtended: true,
      ringExtended: true,
      pinkyExtended: true,
    },
    priority: 1,
  },
  {
    signId: "5",
    features: {
      thumbExtended: true,
      indexExtended: true,
      middleExtended: true,
      ringExtended: true,
      pinkyExtended: true,
      fingerSpread: 0.6,
      handOpenness: 0.9,
    },
    priority: 1,
  },
];

const ALL_PATTERNS = [...ASL_ALPHABET_PATTERNS, ...NUMBER_PATTERNS];

function euclideanDistance(p1: HandLandmark, p2: HandLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function isFingerExtended(
  landmarks: HandLandmark[],
  tipIndex: number,
  pipIndex: number,
  mcpIndex: number
): boolean {
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  const mcp = landmarks[mcpIndex];
  const tipToPip = euclideanDistance(tip, pip);
  const pipToMcp = euclideanDistance(pip, mcp);
  return tip.y < pip.y && tipToPip > pipToMcp * 0.7;
}

function isThumbExtended(landmarks: HandLandmark[]): boolean {
  const thumbTip = landmarks[LANDMARK_INDICES.THUMB_TIP];
  const thumbIp = landmarks[LANDMARK_INDICES.THUMB_IP];
  const thumbMcp = landmarks[LANDMARK_INDICES.THUMB_MCP];
  const indexMcp = landmarks[LANDMARK_INDICES.INDEX_MCP];
  const distance = euclideanDistance(thumbTip, indexMcp);
  return distance > 0.1;
}

export function extractHandFeatures(landmarks: HandLandmark[]): HandFeatures {
  if (landmarks.length < 21) {
    return {
      thumbExtended: false,
      indexExtended: false,
      middleExtended: false,
      ringExtended: false,
      pinkyExtended: false,
      thumbToIndexDistance: 0,
      palmOrientation: "forward",
      handOpenness: 0,
      fingerSpread: 0,
      thumbCrossed: false,
    };
  }

  const thumbExtended = isThumbExtended(landmarks);
  const indexExtended = isFingerExtended(
    landmarks,
    LANDMARK_INDICES.INDEX_TIP,
    LANDMARK_INDICES.INDEX_PIP,
    LANDMARK_INDICES.INDEX_MCP
  );
  const middleExtended = isFingerExtended(
    landmarks,
    LANDMARK_INDICES.MIDDLE_TIP,
    LANDMARK_INDICES.MIDDLE_PIP,
    LANDMARK_INDICES.MIDDLE_MCP
  );
  const ringExtended = isFingerExtended(
    landmarks,
    LANDMARK_INDICES.RING_TIP,
    LANDMARK_INDICES.RING_PIP,
    LANDMARK_INDICES.RING_MCP
  );
  const pinkyExtended = isFingerExtended(
    landmarks,
    LANDMARK_INDICES.PINKY_TIP,
    LANDMARK_INDICES.PINKY_PIP,
    LANDMARK_INDICES.PINKY_MCP
  );

  const thumbTip = landmarks[LANDMARK_INDICES.THUMB_TIP];
  const indexTip = landmarks[LANDMARK_INDICES.INDEX_TIP];
  const thumbToIndexDistance = euclideanDistance(thumbTip, indexTip);

  const wrist = landmarks[LANDMARK_INDICES.WRIST];
  const middleMcp = landmarks[LANDMARK_INDICES.MIDDLE_MCP];
  let palmOrientation: HandFeatures["palmOrientation"] = "forward";
  if (wrist.z < middleMcp.z - 0.05) {
    palmOrientation = "forward";
  } else if (wrist.z > middleMcp.z + 0.05) {
    palmOrientation = "backward";
  }

  const extendedCount = [
    thumbExtended,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
  ].filter(Boolean).length;
  const handOpenness = extendedCount / 5;

  const indexMiddleSpread = euclideanDistance(
    landmarks[LANDMARK_INDICES.INDEX_TIP],
    landmarks[LANDMARK_INDICES.MIDDLE_TIP]
  );
  const fingerSpread = Math.min(indexMiddleSpread * 5, 1);

  const thumbCrossed =
    thumbTip.x > landmarks[LANDMARK_INDICES.INDEX_MCP].x &&
    thumbTip.x < landmarks[LANDMARK_INDICES.PINKY_MCP].x;

  return {
    thumbExtended,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
    thumbToIndexDistance,
    palmOrientation,
    handOpenness,
    fingerSpread,
    thumbCrossed,
  };
}

function matchPatternScore(
  features: HandFeatures,
  pattern: ASLPattern
): number {
  let score = 0;
  let totalWeight = 0;

  const patternFeatures = pattern.features;

  if (patternFeatures.thumbExtended !== undefined) {
    totalWeight += 2;
    if (features.thumbExtended === patternFeatures.thumbExtended) {
      score += 2;
    }
  }

  if (patternFeatures.indexExtended !== undefined) {
    totalWeight += 2;
    if (features.indexExtended === patternFeatures.indexExtended) {
      score += 2;
    }
  }

  if (patternFeatures.middleExtended !== undefined) {
    totalWeight += 2;
    if (features.middleExtended === patternFeatures.middleExtended) {
      score += 2;
    }
  }

  if (patternFeatures.ringExtended !== undefined) {
    totalWeight += 2;
    if (features.ringExtended === patternFeatures.ringExtended) {
      score += 2;
    }
  }

  if (patternFeatures.pinkyExtended !== undefined) {
    totalWeight += 2;
    if (features.pinkyExtended === patternFeatures.pinkyExtended) {
      score += 2;
    }
  }

  if (patternFeatures.handOpenness !== undefined) {
    totalWeight += 1;
    const diff = Math.abs(features.handOpenness - patternFeatures.handOpenness);
    score += Math.max(0, 1 - diff * 2);
  }

  if (patternFeatures.thumbToIndexDistance !== undefined) {
    totalWeight += 1;
    const diff = Math.abs(
      features.thumbToIndexDistance - patternFeatures.thumbToIndexDistance
    );
    score += Math.max(0, 1 - diff * 3);
  }

  if (patternFeatures.fingerSpread !== undefined) {
    totalWeight += 1;
    const diff = Math.abs(features.fingerSpread - patternFeatures.fingerSpread);
    score += Math.max(0, 1 - diff * 2);
  }

  if (patternFeatures.thumbCrossed !== undefined) {
    totalWeight += 1;
    if (features.thumbCrossed === patternFeatures.thumbCrossed) {
      score += 1;
    }
  }

  return totalWeight > 0 ? score / totalWeight : 0;
}

export function recognizeGesture(
  landmarks: HandLandmark[],
  language: "en" | "tl"
): DetectedGesture | null {
  if (landmarks.length < 21) {
    return null;
  }

  const features = extractHandFeatures(landmarks);

  let bestMatch: { pattern: ASLPattern; score: number } | null = null;

  for (const pattern of ALL_PATTERNS) {
    const score = matchPatternScore(features, pattern);
    if (score > 0.6) {
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { pattern, score };
      }
    }
  }

  if (bestMatch) {
    const sign = signs.find((s) => s.id === bestMatch!.pattern.signId);
    if (sign) {
      return {
        signId: sign.id,
        word: language === "en" ? sign.wordEn : sign.wordTl,
        confidence: bestMatch.score,
        matchedPattern: bestMatch.pattern.signId,
      };
    }
  }

  return null;
}

export class AdvancedGestureAnalyzer {
  private frameHistory: GestureFrame[] = [];
  private maxHistoryLength = 30;
  private smoothingWindow = 5;
  private stabilityThreshold = 3;
  private lastStableGesture: DetectedGesture | null = null;
  private consecutiveMatches = 0;
  private lastGestureTimestamp = 0;
  private gestureTimeout = 800; // ms - reset gesture if no confirmation for 800ms

  addFrame(
    landmarks: HandLandmarks | null,
    language: "en" | "tl"
  ): DetectedGesture | null {
    const timestamp = Date.now();
    let gesture: DetectedGesture | null = null;

    if (landmarks && landmarks.landmarks.length >= 21) {
      gesture = recognizeGesture(landmarks.landmarks, language);
      if (gesture) {
        gesture.landmarkData = landmarks;
      }
    }

    this.frameHistory.push({ timestamp, gesture, landmarks });
    if (this.frameHistory.length > this.maxHistoryLength) {
      this.frameHistory.shift();
    }

    return this.getSmoothedGesture();
  }

  private getSmoothedGesture(): DetectedGesture | null {
    const now = Date.now();
    
    // Reset stale gesture if no new confirmation within timeout
    if (
      this.lastStableGesture &&
      now - this.lastGestureTimestamp > this.gestureTimeout
    ) {
      this.lastStableGesture = null;
      this.consecutiveMatches = 0;
    }

    const recentFrames = this.frameHistory.slice(-this.smoothingWindow);
    const gestureCounts: Map<string, { count: number; totalConfidence: number; gesture: DetectedGesture }> = new Map();

    for (const frame of recentFrames) {
      if (frame.gesture) {
        const existing = gestureCounts.get(frame.gesture.signId);
        if (existing) {
          existing.count++;
          existing.totalConfidence += frame.gesture.confidence;
        } else {
          gestureCounts.set(frame.gesture.signId, {
            count: 1,
            totalConfidence: frame.gesture.confidence,
            gesture: frame.gesture,
          });
        }
      }
    }

    let bestGesture: { signId: string; count: number; avgConfidence: number; gesture: DetectedGesture } | null = null;

    gestureCounts.forEach((value, signId) => {
      const avgConfidence = value.totalConfidence / value.count;
      if (
        !bestGesture ||
        value.count > bestGesture.count ||
        (value.count === bestGesture.count && avgConfidence > bestGesture.avgConfidence)
      ) {
        bestGesture = { signId, count: value.count, avgConfidence, gesture: value.gesture };
      }
    });

    if (bestGesture && bestGesture.count >= this.stabilityThreshold) {
      // Gesture must be same as last one OR be a strong new gesture (avoid flip-flopping)
      if (this.lastStableGesture?.signId === bestGesture.signId) {
        this.consecutiveMatches++;
      } else if (bestGesture.avgConfidence > 0.75) {
        // Allow switching to strong gesture
        this.consecutiveMatches = 1;
      } else {
        // Weak gesture while one exists - stick with last one
        return this.lastStableGesture;
      }

      this.lastStableGesture = {
        ...bestGesture.gesture,
        confidence: bestGesture.avgConfidence,
      };
      this.lastGestureTimestamp = now;
      return this.lastStableGesture;
    }

    return null;
  }

  getMotionDirection(): { dx: number; dy: number } | null {
    if (this.frameHistory.length < 2) return null;

    const recentFrames = this.frameHistory.slice(-5);
    const validFrames = recentFrames.filter((f) => f.landmarks);

    if (validFrames.length < 2) return null;

    const first = validFrames[0].landmarks!.landmarks[LANDMARK_INDICES.WRIST];
    const last = validFrames[validFrames.length - 1].landmarks!.landmarks[LANDMARK_INDICES.WRIST];

    return {
      dx: last.x - first.x,
      dy: last.y - first.y,
    };
  }

  isHandStable(): boolean {
    const motion = this.getMotionDirection();
    if (!motion) return false;
    return Math.abs(motion.dx) < 0.02 && Math.abs(motion.dy) < 0.02;
  }

  reset(): void {
    this.frameHistory = [];
    this.lastStableGesture = null;
    this.consecutiveMatches = 0;
  }

  getConfidenceHistory(): number[] {
    return this.frameHistory
      .filter((f) => f.gesture)
      .map((f) => f.gesture!.confidence);
  }
}

export function generateMockLandmarks(): HandLandmarks {
  const landmarks: HandLandmark[] = [];

  const baseX = 0.5 + (Math.random() - 0.5) * 0.1;
  const baseY = 0.5 + (Math.random() - 0.5) * 0.1;

  for (let i = 0; i < 21; i++) {
    landmarks.push({
      x: baseX + (Math.random() - 0.5) * 0.2,
      y: baseY + (Math.random() - 0.5) * 0.2,
      z: Math.random() * 0.1,
      visibility: 0.9 + Math.random() * 0.1,
    });
  }

  return {
    landmarks,
    handedness: Math.random() > 0.5 ? "Left" : "Right",
    confidence: 0.8 + Math.random() * 0.2,
  };
}

export function simulateASLGesture(
  signId: string,
  language: "en" | "tl"
): { gesture: DetectedGesture; landmarks: HandLandmarks } {
  const sign = signs.find((s) => s.id === signId) || signs[0];

  const landmarks: HandLandmark[] = [];
  const baseX = 0.5;
  const baseY = 0.5;

  landmarks.push({ x: baseX, y: baseY + 0.15, z: 0 });

  const pattern = ALL_PATTERNS.find((p) => p.signId === signId);
  const features = pattern?.features || {};

  for (let finger = 0; finger < 4; finger++) {
    for (let joint = 0; joint < 4; joint++) {
      const fingerNames = ["thumb", "index", "middle", "ring", "pinky"];
      const extended =
        (finger === 0 && features.thumbExtended) ||
        (finger === 1 && features.indexExtended) ||
        (finger === 2 && features.middleExtended) ||
        (finger === 3 && features.ringExtended) ||
        (finger === 4 && features.pinkyExtended);

      const yOffset = extended ? -0.03 * joint : -0.01 * joint;
      const xOffset = (finger - 2) * 0.04;

      landmarks.push({
        x: baseX + xOffset + (Math.random() - 0.5) * 0.01,
        y: baseY + yOffset + (Math.random() - 0.5) * 0.01,
        z: Math.random() * 0.02,
        visibility: 0.95,
      });
    }
  }

  while (landmarks.length < 21) {
    landmarks.push({
      x: baseX + (Math.random() - 0.5) * 0.1,
      y: baseY + (Math.random() - 0.5) * 0.1,
      z: Math.random() * 0.05,
      visibility: 0.9,
    });
  }

  return {
    gesture: {
      signId: sign.id,
      word: language === "en" ? sign.wordEn : sign.wordTl,
      confidence: 0.85 + Math.random() * 0.1,
      matchedPattern: signId,
      landmarkData: {
        landmarks,
        handedness: "Right",
        confidence: 0.95,
      },
    },
    landmarks: {
      landmarks,
      handedness: "Right",
      confidence: 0.95,
    },
  };
}
