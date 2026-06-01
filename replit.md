# SignSpeak - Sign Language Learning Application

## Overview
SignSpeak is a comprehensive mobile-first sign language learning application designed to help people with hearing impairments and those who want to learn sign language. The app supports both English and Tagalog languages.

## Features
- **Learn Tab**: Browse sign language lessons organized by categories (Greetings, Alphabet, Numbers, Common Phrases, Emotions, Daily Activities)
- **Practice Tab**: Test your knowledge with interactive quizzes and exercises
- **Translate Tab**: Use camera to recognize sign language gestures (with text-to-speech output) or translate text to sign language animations
- **Library Tab**: Search and browse the complete sign language dictionary with favorites support
- **Profile Tab**: Customize settings including language preference, TTS, animation speed, and accessibility options

## Technical Stack
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation 7 with bottom tabs
- **State Management**: React Context API
- **Storage**: AsyncStorage for local persistence
- **Camera**: expo-camera for gesture recognition
- **Speech**: expo-speech for text-to-speech functionality
- **Animations**: react-native-reanimated for smooth UI animations

## Project Structure
```
/constants
  - theme.ts          # Design system (colors, spacing, typography)
  - translations.ts   # English/Tagalog translations
  - signData.ts       # Sign language data and utilities

/contexts
  - LanguageContext.tsx   # Language switching (EN/TL)
  - SettingsContext.tsx   # User preferences
  - ProgressContext.tsx   # Learning progress tracking

/navigation
  - MainTabNavigator.tsx      # Bottom tab navigation with FAB
  - LearnStackNavigator.tsx   # Learn tab screens
  - PracticeStackNavigator.tsx # Practice tab screens
  - LibraryStackNavigator.tsx  # Library tab screens
  - ProfileStackNavigator.tsx  # Profile tab screens

/screens
  - LearnScreen.tsx           # Category grid for lessons
  - LessonScreen.tsx          # Signs list for a category
  - SignDetailScreen.tsx      # Individual sign details
  - PracticeScreen.tsx        # Practice mode selection
  - PracticeExerciseScreen.tsx # Quiz/exercise interface
  - LibraryScreen.tsx         # Searchable sign dictionary
  - TranslateScreen.tsx       # Camera translation
  - ProfileScreen.tsx         # User settings

/components
  - ThemedText.tsx           # Themed text component
  - ThemedView.tsx           # Themed view component
  - Button.tsx               # Animated button component
  - Card.tsx                 # Card component with elevation
  - HeaderTitle.tsx          # App header with logo
  - ScreenScrollView.tsx     # Safe area scroll view
  - ErrorBoundary.tsx        # App error boundary
```

## Design System
- **Primary Color**: #2563EB (Deep Blue)
- **Secondary Color**: #14B8A6 (Teal)
- **Accent Color**: #F59E0B (Amber - CTAs)
- **Success**: #10B981
- **Error**: #EF4444
- **Touch Targets**: Minimum 44x44 points
- **Accessibility**: WCAG AA compliant

## User Preferences
All preferences are stored locally and persist across sessions:
- Language: English or Tagalog
- Display name and avatar
- Text-to-speech enabled/disabled
- Animation speed (slow/normal/fast)
- High contrast mode
- Larger text option

## Recent Changes
- Initial implementation of SignSpeak application
- Complete navigation with 4 tabs + floating action button
- Sign language data for greetings, alphabet, numbers, phrases, emotions, and daily activities
- Full English and Tagalog translation support
- Camera integration for gesture recognition (simulated in Expo Go)
- Practice quizzes with score tracking
- Favorites and progress tracking
- Added camera flip button for front/back camera toggling
- Created comprehensive export and MediaPipe integration guides
- **Backend Architecture Update**: TFLite model outputs (1, 300, 42) landmark detection format - built rule-based ASL classifier to interpret finger positions
- **Voice-over with Accents**: Added speakWithAccent function that uses Speech.getAvailableVoicesAsync() to select appropriate American English or Filipino/Tagalog voices
- **Landmark Overlay**: Disabled by default (skeleton overlay not calibrated to camera frame coordinates - toggle available via eye icon)

## Export & Local Development
**Status:** Ready for export with CUSTOM TFLITE GESTURE RECOGNITION

**Architecture:** The app uses a Python backend server running your custom TensorFlow Lite model for real-time gesture classification. This approach works with Expo Go without requiring custom native modules.

**Backend Server:**
- `server.py` - Python Flask server with TFLite inference
- Uses your custom gesture classification model: `assets/models/gesture-model.tflite`
- Preprocesses camera frames and runs model inference
- Returns gesture predictions with confidence scores

**Quick Start for Real Recognition:**
1. Ensure you have Python 3.8+ installed
2. Install dependencies: `pip install flask flask-cors tensorflow numpy opencv-python`
3. Start backend: `python server.py`
4. Find your computer's IP address:
   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig` (look for IPv4 Address)
   - Linux: `hostname -I`
5. In the app, go to Profile > Backend Server
6. Enter your server URL: `http://YOUR_IP:5000` (e.g., http://192.168.1.5:5000)
7. Press "Test Connection" to verify
8. Start using real gesture recognition with your custom model!

**Important Notes:**
- Mobile devices cannot connect to "localhost" - use your computer's actual IP address
- Both devices must be on the same WiFi network
- The backend captures frames at ~1.5s intervals to balance latency and accuracy

**Custom Model Integration:**
Your TFLite model has been added to `assets/models/gesture-model.tflite`. To customize gesture labels:

1. Open `server.py`
2. Find the `GESTURE_LABELS` list (line ~35)
3. Update with your model's class names in order:
```python
GESTURE_LABELS = [
    "gesture_1", "gesture_2", "gesture_3", ...
]
```
4. The labels must match your model's output class order exactly
5. Restart the backend server

**Server Response Format:**
```json
{
  "hand_detected": true,
  "gesture": "hello",
  "confidence": 0.92
}
```

**Troubleshooting:**
- If you get "Model output too large" error, your model may be a detector rather than a classifier. Use a classification model instead.
- If gestures aren't recognized, verify the `GESTURE_LABELS` match your model's output classes.
- Check the server console output for preprocessing and inference details.

## Notes
- Camera features work best on mobile devices via Expo Go
- Web version has fallback UI for camera features
- Real hand gesture recognition requires local development setup
- The app uses the iOS 26 liquid glass design aesthetic
- MediaPipe Tasks Vision library (`@mediapipe/tasks-vision`) already included in dependencies
