# SignSense — Error Log & Solutions Reference
# Last updated: 2026-08-06
# PURPOSE: Persistent memory. Read this at the start of every new session.
# AI context resets between conversations — this file is the ground truth.

---

## PROJECT STACK (read this first)

| Item | Value |
|---|---|
| Framework | Expo SDK 54 (Managed Workflow via EAS) |
| React Native | 0.81.5 |
| Architecture | New Architecture enabled (`"newArchEnabled": true` in app.json) |
| TFLite library | `react-native-fast-tflite` v3.0.1 (uses Nitro Modules / JSI) |
| Nitro peer dep | `react-native-nitro-modules` v0.36.5 |
| Model file | `assets/models/best_float32.tflite` (13.3 MB, YOLOv8 float32) |
| Build system | EAS Build (cloud), profile: `preview` |
| Target | Android APK (internal distribution) |

---

## ERROR #1 — "Unable to load script. Make sure you're running Metro..."

**When:** After a 10-hour EAS cloud build. APK installed but shows this error on launch.

**Root cause:** `eas.json` preview profile was MISSING `"developmentClient": false`. EAS built a
Development Client shell (empty app that tries to connect to a Metro server on your PC) instead of
a standalone APK with JS bundled inside.

**Fix applied to `eas.json`:**
```json
"preview": {
  "distribution": "internal",
  "developmentClient": false,
  "android": {
    "buildType": "apk"
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Rule:** ALWAYS verify `eas.json` preview profile has `"developmentClient": false` AND
`"buildType": "apk"` before any build. If either is missing, you WILL waste hours.

---

## ERROR #2 — Gradle Build Failure (deprecated warnings + FAILURE at build end)

**When:** Earlier EAS cloud build. Log showed ~284 tasks executed then FAILURE.

**Root cause:** Installing native packages incompatible with the project's Gradle/SDK version config.
The project targets `compileSdkVersion 34`, `minSdkVersion 26`. Native packages with different
Gradle requirements break the build.

**Fix:** Revert to pure JS for image processing:
- `expo-image-manipulator` — already in Expo SDK, zero Gradle risk
- `jpeg-js` — pure JS JPEG decoder, zero native code

**Rule:** If a package requires Gradle/podspec changes or is NOT in the Expo SDK, test in isolation
first. Prefer pure-JS packages for data processing around TFLite.

---

## ERROR #3 — TFLite model `state: "error"` with ZERO debug logs

**When:** After the first successful standalone APK build. Model badge showed "Model Error ✗".
Debug console showed nothing even when opened.

**Root causes (TWO separate issues — both were fixed):**

### 3A — Expo config plugin NOT registered in app.json

`react-native-fast-tflite` ships `app.plugin.js` that EAS MUST run at prebuild time to wire TFLite
JNI/native bindings into the Android APK. Without it the native `.so` library is never linked.
The model fails at the JNI layer before any JS runs = zero logs, silent death.

**Fix added to `app.json` plugins array:**
```json
[
  "react-native-fast-tflite",
  {
    "enableAndroidGpuLibraries": false
  }
]
```

NOTE: `enableAndroidGpuLibraries: false` = CPU mode. Safe on 100% of devices.

### 3B — `useTensorflowModel` called without delegates argument

Hook signature: `useTensorflowModel(source, delegates: TensorflowModelDelegate[])`
Calling it without the second arg passes `undefined` — native code crashes silently.

```ts
// WRONG — undefined delegates, silent native crash:
const tfModel = useTensorflowModel(require("...tflite"));

// WRONG — NNAPI deprecated on Android 15, silently fails on many devices:
const tfModel = useTensorflowModel(require("...tflite"), ["nnapi"]);

// CORRECT — CPU mode, works on 100% of devices:
const tfModel = useTensorflowModel(require("...tflite"), []);
```

### 3C — NNAPI deprecated on Android 15+

From the official react-native-fast-tflite README:
"NNAPI is deprecated on Android 15. GPU delegate is preferred."
Never use `["nnapi"]`. Use `[]` (CPU) or `["android-gpu"]` (with GPU libs enabled in plugin).

---

## ERROR #4 — Debug console empty on model error

**When:** Model in `state: "error"` but hidden debug console was empty.

**Root cause:** The useEffect watching `tfModel.state` didn't call `addLog()`, and `setShowDebug`
was not triggered automatically on error — user had to manually open it after the error already
happened silently.

**Fix applied to `TranslateScreen.tsx`:**
```ts
useEffect(() => {
  if (tfModel.state === "loaded") {
    setModelStatus("Model Ready ✓");
    addLog("TFLite model loaded successfully.");
  } else if (tfModel.state === "error") {
    const errMsg = (tfModel as any).error?.message ?? (tfModel as any).error ?? "unknown error";
    setModelStatus(`Error: ${String(errMsg).slice(0, 40)}`);
    addLog(`MODEL LOAD FAILED: ${errMsg}`);
    setShowDebug(true); // auto-open on error so logs are visible immediately
  } else {
    setModelStatus("Loading model...");
  }
}, [tfModel.state, addLog]);
```

---

## ERROR #5 — `hermesc EACCES` during local `npx expo export`

**When:** Running `npx expo export -p android` locally to test bundling.

**Root cause:** The `hermesc` binary missing execute permissions in the local cloud IDE environment.
LOCAL ENVIRONMENT ISSUE ONLY — does NOT affect EAS cloud builds.

**Fix (local only):**
```bash
chmod +x node_modules/react-native/sdks/hermesc/linux64-bin/hermesc
```

---

## ERROR #6 — `MalformedURLException: no protocol` on model load in production APK

**When:** After a successful EAS build. Debug log shows:
```
MODEL LOAD FAILED: java.net.MalformedURLException: no protocol: assets_models_best_float32
```

**Root cause:** `Image.resolveAssetSource(require("...model.tflite"))` behaves DIFFERENTLY in dev vs production:
- **Dev (Metro running):** Returns `http://localhost:8081/assets/...` — has a protocol ✓
- **Production APK (no Metro):** Returns a bare flattened Metro path like `assets_models_best_float32` — NO protocol ✗

The Kotlin `HybridAssetLoader.kt` does `URL(path).readBytes()` which requires a valid
protocol prefix. The bare path has none → `MalformedURLException`.

This is a **library behavior gap in react-native-fast-tflite v3**: `useTensorflowModel(require(...))` works
in dev mode but silently breaks in production APKs.

**Fix applied to `screens/TranslateScreen.tsx`:**

Replace `useTensorflowModel(require(...))` with manual asset resolution via `expo-asset`:

```ts
import { Asset } from "expo-asset";
import { loadTensorflowModel, type TfliteModel } from "react-native-fast-tflite";

// State instead of hook:
const [tfliteModel, setTfliteModel] = useState<TfliteModel | null>(null);
const [modelLoadState, setModelLoadState] = useState<"loading" | "loaded" | "error">("loading");

useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      // Asset.loadAsync copies the bundled file to device filesystem → file:// URI
      const [asset] = await Asset.loadAsync(require("../assets/models/best_float32.tflite"));
      const fileUri = asset.localUri ?? asset.uri;
      if (!fileUri) throw new Error("Asset localUri is null");
      // Pass { url: fileUri } — loadTensorflowModel accepts file:// URIs
      const model = await loadTensorflowModel({ url: fileUri }, []);
      if (!cancelled) {
        setTfliteModel(model);
        setModelLoadState("loaded");
      }
    } catch (e: any) {
      if (!cancelled) setModelLoadState("error");
    }
  })();
  return () => { cancelled = true; };
}, []);
```

**Rule:** NEVER use `useTensorflowModel(require("model.tflite"))` in a production Expo APK.
ALWAYS resolve via `expo-asset` first to get a `file://` URI, then call `loadTensorflowModel({ url: fileUri })`.

---

## CURRENT STATE (as of 2026-08-06)

| File | Status | What was fixed |
|---|---|---|
| `eas.json` | FIXED | `developmentClient: false`, `buildType: apk` |
| `app.json` | FIXED | `react-native-fast-tflite` plugin registered |
| `screens/TranslateScreen.tsx` | FIXED | expo-asset resolution → file:// URI, no more MalformedURLException |
| `metro.config.js` | OK | `.tflite` and `.task` in `assetExts` |
| `assets/models/best_float32.tflite` | OK | 13.3 MB YOLOv8 float32 present |

---

## 5-POINT CHECKLIST — RUN BEFORE EVERY BUILD

1. `eas.json` preview profile has `"developmentClient": false`?
2. `react-native-fast-tflite` is in the `plugins` array of `app.json`?
3. `useTensorflowModel` is NOT used with `require()` — using `expo-asset` + `loadTensorflowModel({ url: fileUri })`?
4. `metro.config.js` has `tflite` in `assetExts`?
5. `assets/models/best_float32.tflite` exists?

All 5 YES = safe to build.

---

## VERIFIED SAFE PACKAGES (no Gradle conflicts)

| Package | Version | Notes |
|---|---|---|
| `react-native-fast-tflite` | ^3.0.1 | Requires Expo plugin in app.json |
| `react-native-nitro-modules` | 0.36.5 | Peer dep of fast-tflite, already installed |
| `expo-image-manipulator` | ~14.0.8 | Pure Expo, zero Gradle risk |
| `jpeg-js` | ^0.4.4 | Pure JS, zero native code |
| `expo-camera` | ~17.0.10 | OK |
| `expo-speech` | ~14.0.8 | OK |
| `expo-haptics` | ~15.0.8 | OK |

---

## BUILD COMMANDS

```bash
# Standard preview APK build
eas build -p android --profile preview

# Verify JS bundle compiles locally before spending cloud minutes
npx expo export -p android

# Fix hermesc permissions if local export fails with EACCES (local env only)
chmod +x node_modules/react-native/sdks/hermesc/linux64-bin/hermesc
```

---

## HOW TO USE THE BUILT-IN DEBUG CONSOLE

1. Open app → go to Translate screen
2. Long-press the model status badge (top center) for 1 second
3. Console opens — take a picture — watch logs
4. On model load ERROR → console auto-opens immediately

Logs will show:
- Model load success or exact error message
- Photo capture → resize → JPEG decode → Float32 conversion → inference timing
- Detected class + confidence score

---

## ARCHITECTURE NOTES

- YOLOv8 output shape: `[1, (4 + num_classes), 8400]`
  Columns = anchor boxes, rows 0-3 = bbox, rows 4+ = class scores
- Input shape: `[1, 640, 640, 3]` = 1,228,800 float32 values, normalized 0.0–1.0
- Confidence threshold: 0.6 (`CONFIDENCE_THRESHOLD` in TranslateScreen.tsx)
- Image pipeline: Camera → resize 640x640 (expo-image-manipulator) → base64 → Uint8Array
  → jpeg-js decode RGBA → Float32Array RGB normalized → runSync([buffer])
- `runSync([buffer])` returns `ArrayBuffer[]` — wrap with `new Float32Array(output[0])`
