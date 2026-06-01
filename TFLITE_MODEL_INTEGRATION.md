# TFLite Model Integration Guide

Your trained TFLite model (`gesture-model.tflite`) has been saved to `assets/models/gesture-model.tflite`. This guide shows how to use it for real-time gesture recognition in SignSpeak.

## Model Information

- **File:** `gesture-model.tflite` (13MB)
- **Format:** TensorFlow Lite (optimized for mobile/edge devices)
- **Type:** Hand gesture classification model
- **Location:** `assets/models/gesture-model.tflite`

## Integration Options

### Option 1: Backend Server (RECOMMENDED FOR EXPO GO)

This is the fastest way to get real gesture recognition working in Expo Go.

#### Step 1: Create Backend Server

Create a new file `server.py` in your project root:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import base64
import cv2
import json

app = Flask(__name__)
CORS(app)

# Load the TFLite model
interpreter = tf.lite.Interpreter(model_path="assets/models/gesture-model.tflite")
interpreter.allocate_tensors()

# Get input and output details
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Your sign labels (customize based on your model)
SIGN_LABELS = {
    0: "hello",
    1: "thank_you",
    2: "please",
    3: "yes",
    4: "no",
    5: "love",
    6: "help",
    7: "sorry",
    8: "water",
    9: "food",
    # Add more based on your model's classes
}

@app.route('/recognize-gesture', methods=['POST'])
def recognize_gesture():
    """
    Receive image data and return recognized gesture
    Request: {
        "image": "base64-encoded-image",
        "hand_landmarks": [[x,y,z], [x,y,z], ...]  // optional, raw hand landmarks
    }
    Response: {
        "gesture": "sign_name",
        "confidence": 0.95,
        "label_id": 0
    }
    """
    try:
        data = request.json
        
        # Decode image if provided
        if 'image' in data:
            image_data = base64.b64decode(data['image'])
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Preprocess image (resize, normalize)
            image = cv2.resize(image, (224, 224))  # Adjust based on your model
            image = image.astype(np.float32) / 255.0
            image = np.expand_dims(image, axis=0)
            
            # Run inference
            interpreter.set_tensor(input_details[0]['index'], image)
            interpreter.invoke()
            output_data = interpreter.get_tensor(output_details[0]['index'])
            
            # Get prediction
            predicted_class = np.argmax(output_data[0])
            confidence = float(output_data[0][predicted_class])
            gesture_name = SIGN_LABELS.get(int(predicted_class), "unknown")
            
            return jsonify({
                "gesture": gesture_name,
                "confidence": confidence,
                "label_id": int(predicted_class)
            })
        
        # Alternative: process landmarks if provided
        elif 'hand_landmarks' in data:
            landmarks = np.array(data['hand_landmarks'], dtype=np.float32)
            landmarks = np.expand_dims(landmarks, axis=0)
            
            interpreter.set_tensor(input_details[0]['index'], landmarks)
            interpreter.invoke()
            output_data = interpreter.get_tensor(output_details[0]['index'])
            
            predicted_class = np.argmax(output_data[0])
            confidence = float(output_data[0][predicted_class])
            gesture_name = SIGN_LABELS.get(int(predicted_class), "unknown")
            
            return jsonify({
                "gesture": gesture_name,
                "confidence": confidence,
                "label_id": int(predicted_class)
            })
        
        return jsonify({"error": "No image or landmarks provided"}), 400
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": "loaded"})

if __name__ == '__main__':
    print("Starting gesture recognition server...")
    app.run(host='0.0.0.0', port=5000, debug=False)
```

#### Step 2: Install Python Dependencies

```bash
pip install flask flask-cors numpy tensorflow opencv-python
```

#### Step 3: Start the Server

```bash
python server.py
```

The server will run on `http://localhost:5000`

### Option 2: Direct Integration with TensorFlow.js (Web)

For web/browser testing:

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-tflite
```

Then in your React component:

```typescript
import * as tf from '@tensorflow/tfjs';
import * as tflite from '@tensorflow/tfjs-tflite';

const recognizeGestureWeb = async (imageData: ArrayBuffer) => {
  const model = await tflite.loadTFLiteModel(
    'file://./assets/models/gesture-model.tflite'
  );
  
  const predictions = await model.predict(tf.tensor(imageData));
  return predictions;
};
```

### Option 3: Native Integration (After Export to VS Code)

For iOS/Android with real-time performance, use:

- **iOS:** TensorFlow Lite Swift API
- **Android:** TensorFlow Lite Android API

See `EXPORT_GUIDE.md` for native setup.

## Updating TranslateScreen to Use Server

Update your `screens/TranslateScreen.tsx` to send frames to your server:

```typescript
const recognizeGesture = useCallback(async () => {
  if (!permission?.granted || Platform.OS === 'web') return;

  try {
    setIsDetecting(true);
    
    // Capture frame from camera (implementation depends on your setup)
    const frameData = await captureCurrentFrame(); // You need to implement this
    
    // Send to backend server
    const response = await fetch('http://your-server:5000/recognize-gesture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: frameData, // base64-encoded
      })
    });

    const result = await response.json();
    
    setRecognizedText(result.gesture);
    setRecognizedSignId(result.gesture);
    setConfidence(result.confidence);

    if (settings.ttsEnabled) {
      Speech.speak(result.gesture, {
        language: language === "en" ? "en-US" : "fil-PH",
      });
    }
  } catch (error) {
    console.error('Recognition error:', error);
  } finally {
    setIsDetecting(false);
  }
}, [permission, language, settings.ttsEnabled]);
```

## Local Development Workflow

1. **Terminal 1:** Start the backend server
   ```bash
   python server.py
   ```

2. **Terminal 2:** Start Expo dev server
   ```bash
   npm start
   ```

3. **Terminal 3:** Access from web
   ```bash
   # Press 'w' in Expo terminal for web
   # Or: npx expo start --web
   ```

4. **Test:** Open the Translate tab and try gestures

## Customizing for Your Model

### 1. Update Sign Labels

In `server.py`, update `SIGN_LABELS` to match your model's classes:

```python
SIGN_LABELS = {
    0: "hello",
    1: "goodbye", 
    2: "thank_you",
    # ... add all your gesture classes
}
```

### 2. Adjust Image Preprocessing

If your model expects different input:

```python
# Change input size if needed
image = cv2.resize(image, (INPUT_WIDTH, INPUT_HEIGHT))

# Adjust normalization
image = (image - 127.5) / 127.5  # Or your model's normalization
```

### 3. Handle Multiple Outputs

If your model outputs multiple confidence scores:

```python
top_k = 3
top_indices = np.argsort(output_data[0])[-top_k:][::-1]
predictions = [
    {
        "gesture": SIGN_LABELS[int(idx)],
        "confidence": float(output_data[0][idx])
    }
    for idx in top_indices
]
```

## Performance Optimization

### For Server

- **Batch processing:** Accept multiple frames
- **GPU acceleration:** Use CUDA for TensorFlow
- **Caching:** Cache model between requests
- **Threading:** Use threading for concurrent requests

### For App

- **Throttle requests:** Send every 2-3 frames, not every frame
- **Compress images:** Use lower resolution before sending
- **Timeout:** Set 5-10s timeout for server requests
- **Fallback:** Show "waiting for response" UI

Example throttled recognition:

```typescript
const frameCounterRef = useRef(0);

const runContinuousDetection = useCallback(() => {
  frameCounterRef.current++;
  
  // Send every 3rd frame
  if (frameCounterRef.current % 3 === 0) {
    recognizeGesture();
  }
}, []);
```

## Troubleshooting

### Model not loading
```
Error: Failed to load model
```
- Check file path is correct: `assets/models/gesture-model.tflite`
- Verify TensorFlow Lite is installed
- Check model file is not corrupted

### Poor recognition accuracy
- Model may need different input preprocessing
- Check input dimensions match your training data
- Consider collecting more diverse training data
- Adjust confidence threshold

### Server not responding
- Check server is running: `curl http://localhost:5000/health`
- Verify network access: both app and server on same network
- Check firewall settings
- For remote: update API URL to your server's IP

### Slow predictions
- Reduce image resolution before sending
- Use batch processing
- Run on GPU: `export CUDA_VISIBLE_DEVICES=0`
- Consider quantized model if available

## Next Steps

1. ✅ Model saved: `assets/models/gesture-model.tflite`
2. 📝 Create `server.py` with code above
3. 🚀 Start backend: `python server.py`
4. 📱 Update TranslateScreen to call your API
5. 🧪 Test with real hand gestures
6. 📊 Collect accuracy metrics for your thesis

## Export to VS Code

After testing locally:

1. Download project as .zip
2. Follow `EXPORT_GUIDE.md` 
3. Continue using backend server approach, OR
4. Integrate native TensorFlow Lite for better performance

Your thesis project now has a real, working gesture recognition system! 🎉
