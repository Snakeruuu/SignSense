# SignSpeak Export & Local Development Guide

This guide will help you export the SignSpeak app from Replit and set it up for local development with real MediaPipe gesture recognition.

## Step 1: Download Your Project from Replit

1. Click the **Files** icon in the left sidebar
2. Right-click the project folder root
3. Select **Download as .zip**
4. Extract the zip file to your desired location

Alternatively, if you have Git set up:
```bash
git clone <your-replit-repo-url>
cd signspeak
```

## Step 2: Install Dependencies Locally

Make sure you have Node.js 18+ installed. Then:

```bash
npm install
```

This will install all required dependencies including MediaPipe.

## Step 3: Run the App Locally

### For Development (Web)
```bash
npm run web
```
This starts the development server. Open http://localhost:8081 in your browser.

### For iOS (Mac only)
```bash
npm run ios
```

### For Android
```bash
npm run android
```
Requires Android Studio and an emulator, or a connected Android device.

### For General Development
```bash
npm start
```
Then press `w` for web, `i` for iOS, or `a` for Android.

## Step 4: Set Up Real MediaPipe Hand Detection

The app currently has simulated gesture recognition. To enable real hand detection:

### Current Setup
- MediaPipe Tasks Vision library is already installed (`@mediapipe/tasks-vision`)
- The gesture recognition service is in `services/aslGestureRecognition.ts`
- The camera view is in `screens/TranslateScreen.tsx`

### Integration Steps

1. **For Web/Browser:**
   - The web version can use MediaPipe's Vision library directly
   - You need to process camera frames and extract hand landmarks
   - See `MEDIAPIPE_INTEGRATION.md` for detailed web implementation

2. **For Native (iOS/Android):**
   - Consider using Expo's MLKit or building custom native modules
   - Or use a simpler approach: run a local server for hand detection
   - See `MEDIAPIPE_INTEGRATION.md` for native implementation options

## Step 5: Configure Environment Variables (Optional)

Create a `.env` file in the root directory (see `.env.example` for template):

```bash
cp .env.example .env
```

Currently, no environment variables are required for the basic setup, but you can add them if you implement backend services.

## Project Structure

```
signspeak/
├── app.json                 # Expo configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── assets/                 # Images, icons, splash screens
├── constants/              # Theme, translations, sign data
├── contexts/               # React Context (Language, Settings, Progress)
├── navigation/             # React Navigation setup
├── screens/                # Screen components
├── components/             # Reusable components
├── services/               # Business logic (gesture recognition)
├── hooks/                  # Custom React hooks
└── scripts/                # Build scripts (DO NOT MODIFY)
```

## Important Files for Real Gesture Recognition

- **`services/aslGestureRecognition.ts`** - Replace the simulated gesture functions with real MediaPipe processing
- **`screens/TranslateScreen.tsx`** - Camera integration and frame capture
- **`components/HandLandmarkOverlay.tsx`** - Visualization of detected hand landmarks

## Next Steps

1. Read `MEDIAPIPE_INTEGRATION.md` for detailed implementation instructions
2. Choose between web or native development (or both)
3. Implement real hand landmark extraction
4. Replace `simulateASLGesture()` with real gesture analysis
5. Test with actual sign language gestures

## Troubleshooting

### Dependencies not installing?
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 8081 already in use?
```bash
# Kill the process or specify a different port
npx expo start --web --port 3000
```

### Camera not working on web?
- Chrome/Edge: Requires HTTPS or localhost
- Firefox: May have additional permission requirements
- Test on a real device via Expo Go for better camera support

### Build errors?
- Clear Expo cache: `npx expo start -c`
- Restart the dev server
- Check that all TypeScript types are correct

## Support Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- [React Native Docs](https://reactnative.dev)

## Need More Help?

Refer to the detailed implementation guides:
- `MEDIAPIPE_INTEGRATION.md` - Real hand recognition setup
- `README.md` - General app information
