# SignSense App Testing & Standalone Build Guide

Hello! Here is the guide you requested para madaling ma-test yung app natin, step-by-step. Since we are using Custom Native Modules (like `react-native-fast-tflite` para sa AI Sign Language model natin), **hindi natin pwedeng gamitin ang normal na "Expo Go" app** para mag-test. Kailangan natin mag-build ng standalone app (APK) para smooth ang testing at walang errors.

## 1. How to Build a Standalone App (APK) for Testing

Para mabilis mo ma-install sa Android phone mo at ma-test without errors:

1. Open your terminal at the root of your project folder.
2. Run this command to build an Android APK using EAS (Expo Application Services):
   ```bash
   eas build -p android --profile preview
   ```
3. Maghihintay ka ng konting oras. Pagkatapos, bibigyan ka ng link para ma-download yung `.apk` file.
4. I-download at i-install ang APK sa Android device mo. Yan na yung standalone app mo! Wala na siyang kinalaman sa Expo Go, kaya mas mabilis at walang weird errors pagdating sa AI model.

*(Kung wala ka pang EAS account, baka hingin sayo na mag-login sa `expo.dev` gamit ang `eas login`).*

## 2. Testing the New Features

### ✅ Flashlight (Torch)
Sa `TranslateScreen` (yung camera page natin), may button ka na makikita na icon na **kidlat (zap)** sa taas-kaliwa. 
- Pag tinap mo yon, magta-toggle yun as flashlight (Torch Mode) para pag madilim, pwede mo pa rin makita ang gesture ng kamay mo.
- Ginawa nating `enableTorch` sa code kaya continuous ang ilaw habang nagca-capture.

### ✅ Warning Pop-up (Failed Extraction)
Pag nag-capture ka ng gesture at malabo ang kamay, walang kamay sa frame, o hindi ma-recognize ng model ang gesture:
- Lalabas yung warning popup: **"⚠️ No Sign Detected"** na may mensaheng "Could not extract a clear letter from the gesture...".
- Meron ding fallback na **"⚠️ Extraction Failed"** if mag-fail talaga yung processing mismo.

### ✅ Faster Camera Switch Response
Yung button na pang-switch ng front at back camera (icon na umiikot sa taas-kanan):
- Nilagyan natin ng visual feedback (magdi-dim nang konti) para malaman mo na nag-click siya at pino-proseso yung pag-switch. Binabawasan nito yung pakiramdam na nag-ha-hang yung button.

### ✅ Offline Capability (Internet not needed!)
**Good news!** Hindi po tayo dependent sa internet para gumana yung app. 
- Yung AI model natin (`best_float32.tflite`) ay **naka-bundle (included)** na sa loob mismo ng app. 
- Pagka-install mo ng standalone APK, gagana na yung detection ng sign language kahit patayin mo ang Wi-Fi o mobile data.

## 3. Pages & Credentials
- **Home / Landing:** Wala pong login requirement sa ngayon based sa current structure na nakita ko. Pwede kang dumiretso sa pag-test ng translation.
- **Translate Screen:** Dito ginagawa ang lahat ng gesture detection. Make sure na mag-grant ka ng Camera Permission pag unang bukas ng app.

Sana makatulong itong guide! Pag na-build mo na yung APK, napakadali na lang i-test ang lahat ng features offline.
