# MediaPipe Integration Guide for SignSpeak

This guide explains how to integrate real hand gesture recognition using MediaPipe into your exported SignSpeak project.

## Overview

MediaPipe provides machine learning solutions for hand detection and landmark estimation. We'll integrate it to replace the current simulated gesture recognition.

## Option 1: Web Implementation (Recommended for Testing)

### Step 1: Install Additional Dependencies

```bash
npm install @mediapipe/tasks-vision
npm install --save-dev @types/mediapipe__tasks-vision
```

(Already included in the project, but verify with `npm list @mediapipe/tasks-vision`)

### Step 2: Update Camera Frame Processing

In `screens/TranslateScreen.tsx`, replace the simulated gesture detection with real MediaPipe processing:

```typescript
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Add this to your component initialization
const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);

// Initialize MediaPipe HandLandmarker
useEffect(() => {
  const initializeHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
    );
    const landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 2,
    });
    setHandLandmarker(landmarker);
  };

  initializeHandLandmarker();
}, []);
```

### Step 3: Process Camera Frames

Replace the `runContinuousDetection` function to use real camera frames:

```typescript
const runContinuousDetection = useCallback(async () => {
  if (!handLandmarker || Platform.OS === 'web') return;

  try {
    // Capture frame from camera
    const frame = await captureFrameFromCamera();
    
    // Run MediaPipe detection
    const detectionResult = handLandmarker.detectForVideo(frame, Date.now());
    
    if (detectionResult.landmarks && detectionResult.landmarks.length > 0) {
      // Convert MediaPipe landmarks to your format
      const landmarks: HandLandmarks = {
        landmarks: detectionResult.landmarks[0].map(lm => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility
        })),
        handedness: detectionResult.handedness?.[0]?.categoryName === 'Right' ? 'Right' : 'Left',
        confidence: detectionResult.handedness?.[0]?.score || 0.8
      };

      // Analyze gesture
      const gesture = gestureAnalyzerRef.current.addFrame(landmarks, language);
      processGestureResult(gesture, landmarks);
    }
  } catch (error) {
    console.error('Hand detection error:', error);
  }
}, [handLandmarker, language, processGestureResult]);
```

### Step 4: Update Gesture Recognition Service

Modify `services/aslGestureRecognition.ts` to analyze real MediaPipe landmarks:

Replace the `simulateASLGesture` function with real analysis:

```typescript
export function analyzeRealGesture(
  landmarks: HandLandmarks,
  language: 'en' | 'tl'
): DetectedGesture | null {
  const features = extractHandFeatures(landmarks);
  const matchedSigns = findMatchingPatterns(features, landmarks);
  
  if (matchedSigns.length === 0) return null;

  const bestMatch = matchedSigns[0];
  const signData = signs.find(s => s.id === bestMatch.signId);

  return {
    signId: bestMatch.signId,
    word: signData?.[language === 'en' ? 'english' : 'tagalog'] || bestMatch.signId,
    confidence: bestMatch.confidence,
    matchedPattern: `Pattern matched with ${bestMatch.confidence * 100}% confidence`,
    landmarkData: landmarks
  };
}
```

## Option 2: Native Implementation (iOS/Android)

### Using Expo with Native Modules

For production mobile apps, you have options:

1. **Use Expo with native module support:**
   - Create a custom Expo config
   - Add native MediaPipe or ML Kit bindings
   - Build with EAS (Expo Application Services)

2. **Use React Native Camera with ML Kit:**
   ```bash
   npm install @react-native-ml-kit/core
   ```

3. **Backend API Approach (Simplest for MVP):**
   - Send camera frames to a backend server
   - Process with Python + MediaPipe
   - Return landmarks to the app

### Backend Server Example

Create a simple Python server with Flask + MediaPipe:

```python
# server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import mediapipe as mp
import cv2
import numpy as np
import base64

app = Flask(__name__)
CORS(app)

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2)

@app.route('/detect-hands', methods=['POST'])
def detect_hands():
    data = request.json
    image_data = base64.b64decode(data['image'])
    
    nparr = np.frombuffer(image_data, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    results = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    
    if results.multi_hand_landmarks:
        landmarks = []
        for hand_landmarks in results.multi_hand_landmarks:
            hand_data = []
            for lm in hand_landmarks.landmark:
                hand_data.append({'x': lm.x, 'y': lm.y, 'z': lm.z})
            landmarks.append(hand_data)
        return jsonify({'landmarks': landmarks, 'detected': True})
    
    return jsonify({'detected': False})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

## Option 3: Hybrid Approach (Recommended for Your Thesis)

Combine web + native for maximum compatibility:

1. **Web Version:**
   - Use MediaPipe Tasks Vision for real-time detection
   - Good for presentation and cross-platform testing

2. **Mobile Version (iOS/Android):**
   - Use backend API or native modules
   - More reliable for gesture recognition accuracy

## Testing Your Integration

### 1. Test with Sample Gestures
```bash
npm run web
# Open dev tools, test camera permission
# Make different hand gestures
```

### 2. Verify Landmarks Are Captured
Add logging to check landmark data:

```typescript
if (landmarks) {
  console.log('Detected landmarks:', landmarks);
  console.log('Hand confidence:', landmarks.confidence);
}
```

### 3. Calibration
The ASL patterns in `services/aslGestureRecognition.ts` may need tuning:
- Test each sign multiple times
- Adjust distance thresholds
- Refine feature extraction logic

## Troubleshooting

### MediaPipe Model Not Loading
```
Error: Failed to load the model
```
**Solution:** Check that the model URL is correct and CORS is enabled. Use the CDN URL provided in the initialization code.

### Low Detection Accuracy
- Improve lighting conditions
- Ensure hand is fully visible
- Adjust the gesture matching thresholds in `services/aslGestureRecognition.ts`

### Performance Issues
- Reduce detection frequency (increase interval in `runContinuousDetection`)
- Process every Nth frame instead of every frame
- Use GPU acceleration (already configured)

### Web Camera Permissions
- Chrome requires HTTPS or localhost
- Firefox may prompt for permissions
- Safari has stricter requirements

## Next Steps After Integration

1. Train/calibrate gesture recognition with real hand data
2. Add visual feedback for successful recognition
3. Implement confidence thresholds
4. Create gesture dictionary from user input
5. Add data logging for thesis research

## Performance Optimization Tips

- **Throttle detection:** Process every 2-3 frames instead of every frame
- **Cache model:** Initialize HandLandmarker once, reuse instance
- **Batch processing:** Process multiple hands simultaneously
- **GPU acceleration:** Enabled by default, verify it's working
- **Memory management:** Clean up old frames from the gesture history

## Resources

- [MediaPipe Documentation](https://mediapipe.dev)
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision)
- [Hand Landmarker Guide](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- [ML Kit for React Native](https://react-native-ml-kit.firebaseapp.com)

## Support

For integration issues:
1. Check console logs for specific error messages
2. Verify all dependencies are installed
3. Test in browser DevTools
4. Try the backend API approach if native integration is complex
