import React from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import { HandLandmark, HandLandmarks } from "@/services/aslGestureRecognition";
import { Colors } from "@/constants/theme";

interface HandLandmarkOverlayProps {
  landmarks: HandLandmarks | null;
  width: number;
  height: number;
  showConnections?: boolean;
  showLabels?: boolean;
  mirrorX?: boolean;
}

const LANDMARK_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

const FINGER_COLORS = {
  thumb: "#FF6B6B",
  index: "#4ECDC4",
  middle: "#45B7D1",
  ring: "#96CEB4",
  pinky: "#DDA0DD",
  palm: "#FFD93D",
};

function getLandmarkColor(index: number): string {
  if (index === 0) return FINGER_COLORS.palm;
  if (index >= 1 && index <= 4) return FINGER_COLORS.thumb;
  if (index >= 5 && index <= 8) return FINGER_COLORS.index;
  if (index >= 9 && index <= 12) return FINGER_COLORS.middle;
  if (index >= 13 && index <= 16) return FINGER_COLORS.ring;
  if (index >= 17 && index <= 20) return FINGER_COLORS.pinky;
  return "#FFFFFF";
}

function getConnectionColor(startIndex: number, endIndex: number): string {
  if (startIndex === 0 || endIndex === 0) return FINGER_COLORS.palm;
  if ((startIndex >= 1 && startIndex <= 4) || (endIndex >= 1 && endIndex <= 4)) return FINGER_COLORS.thumb;
  if ((startIndex >= 5 && startIndex <= 8) || (endIndex >= 5 && endIndex <= 8)) return FINGER_COLORS.index;
  if ((startIndex >= 9 && startIndex <= 12) || (endIndex >= 9 && endIndex <= 12)) return FINGER_COLORS.middle;
  if ((startIndex >= 13 && startIndex <= 16) || (endIndex >= 13 && endIndex <= 16)) return FINGER_COLORS.ring;
  if ((startIndex >= 17 && startIndex <= 20) || (endIndex >= 17 && endIndex <= 20)) return FINGER_COLORS.pinky;
  return "#FFFFFF";
}

export function HandLandmarkOverlay({
  landmarks,
  width,
  height,
  showConnections = true,
  showLabels = false,
  mirrorX = true,
}: HandLandmarkOverlayProps) {
  // Handle both HandLandmarks object and array of points from MediaPipe
  let landmarkArray: any[] = [];
  
  if (!landmarks) {
    return null;
  }
  
  // Check if it's a HandLandmarks object with .landmarks property
  if (Array.isArray(landmarks)) {
    landmarkArray = landmarks;
  } else if ((landmarks as any).landmarks && Array.isArray((landmarks as any).landmarks)) {
    landmarkArray = (landmarks as any).landmarks;
  } else {
    return null;
  }
  
  if (landmarkArray.length < 21) {
    return null;
  }

  const points = landmarkArray.map((lm, index) => {
    const x = mirrorX ? width - lm.x * width : lm.x * width;
    const y = lm.y * height;
    return { x, y, visibility: lm.visibility || 1, index };
  });

  // Calculate bounding box from landmarks
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;
  const padding = 15;

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {/* Bounding box */}
      <View
        style={[
          styles.boundingBox,
          {
            left: minX - padding,
            top: minY - padding,
            width: boxWidth + padding * 2,
            height: boxHeight + padding * 2,
            borderColor: "rgba(78, 205, 196, 0.8)",
          },
        ]}
      />

      {showConnections &&
        LANDMARK_CONNECTIONS.map(([startIdx, endIdx], i) => {
          const start = points[startIdx];
          const end = points[endIdx];
          if (!start || !end) return null;

          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          return (
            <View
              key={`conn-${i}`}
              style={[
                styles.connection,
                {
                  left: start.x,
                  top: start.y,
                  width: length,
                  backgroundColor: getConnectionColor(startIdx, endIdx),
                  transform: [{ rotate: `${angle}deg` }],
                  opacity: Math.min(start.visibility, end.visibility) * 0.8,
                },
              ]}
            />
          );
        })}

      {points.map((point, index) => {
        const size = index === 0 ? 12 : index % 4 === 0 ? 10 : 8;
        return (
          <View
            key={`point-${index}`}
            style={[
              styles.landmark,
              {
                left: point.x - size / 2,
                top: point.y - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: getLandmarkColor(index),
                opacity: point.visibility * 0.9,
              },
            ]}
          >
            {index === 0 || index % 4 === 0 ? (
              <View
                style={[
                  styles.landmarkInner,
                  {
                    width: size - 4,
                    height: size - 4,
                    borderRadius: (size - 4) / 2,
                  },
                ]}
              />
            ) : null}
          </View>
        );
      })}

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          <View style={[styles.statusDot, { backgroundColor: Colors.light.success }]} />
        </View>
      </View>
    </View>
  );
}

interface GestureConfidenceIndicatorProps {
  confidence: number;
  gesture: string | null;
  isStable: boolean;
}

export function GestureConfidenceIndicator({
  confidence,
  gesture,
  isStable,
}: GestureConfidenceIndicatorProps) {
  const confidenceColor =
    confidence > 0.8
      ? Colors.light.success
      : confidence > 0.6
      ? Colors.light.accent
      : Colors.light.error;

  return (
    <View style={styles.confidenceContainer}>
      <View style={[styles.confidenceBar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
        <View
          style={[
            styles.confidenceFill,
            {
              width: `${Math.round(confidence * 100)}%`,
              backgroundColor: confidenceColor,
            },
          ]}
        />
      </View>
      {gesture ? (
        <View style={styles.gestureLabel}>
          <View
            style={[
              styles.gestureLabelBg,
              { backgroundColor: isStable ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)" },
            ]}
          >
            {isStable ? <View style={[styles.stableIndicator, { backgroundColor: Colors.light.success }]} /> : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

interface AnalysisOverlayProps {
  isAnalyzing: boolean;
  handDetected: boolean;
  gestureDetected: string | null;
  confidence: number;
}

export function AnalysisOverlay({
  isAnalyzing,
  handDetected,
  gestureDetected,
  confidence,
}: AnalysisOverlayProps) {
  return (
    <View style={styles.analysisOverlay} pointerEvents="none">
      <View style={styles.analysisStatusRow}>
        <View
          style={[
            styles.analysisStatusBadge,
            {
              backgroundColor: isAnalyzing
                ? "rgba(78, 205, 196, 0.8)"
                : "rgba(0,0,0,0.5)",
            },
          ]}
        >
          <View
            style={[
              styles.analysisDot,
              {
                backgroundColor: handDetected
                  ? Colors.light.success
                  : Colors.light.textSecondary,
              },
            ]}
          />
        </View>
      </View>

      {gestureDetected ? (
        <View style={styles.detectionBadge}>
          <View
            style={[
              styles.detectionBadgeBg,
              {
                backgroundColor:
                  confidence > 0.8
                    ? "rgba(34, 197, 94, 0.9)"
                    : "rgba(251, 191, 36, 0.9)",
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 8,
  },
  landmark: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  landmarkInner: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  connection: {
    position: "absolute",
    height: 3,
    transformOrigin: "left center",
  },
  statusContainer: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  confidenceBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 2,
  },
  gestureLabel: {
    marginTop: 8,
    alignItems: "center",
  },
  gestureLabelBg: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  stableIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  analysisOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  analysisStatusRow: {
    position: "absolute",
    top: 100,
    right: 20,
  },
  analysisStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  analysisDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detectionBadge: {
    position: "absolute",
    top: 140,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  detectionBadgeBg: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
