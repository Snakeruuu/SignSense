"""
SignSpeak Backend Server - Real-time Hand Gesture Recognition
Uses YOLO for hand landmark detection and gesture classification
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import numpy as np
import base64
import cv2
import os
import tempfile

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max request size
CORS(app)

# Load YOLO model
model = None
MODEL_AVAILABLE = False

try:
    model_path = "assets/models/best_float32.tflite"
    if os.path.exists(model_path):
        model = YOLO(model_path)
        MODEL_AVAILABLE = True
        print("✓ YOLO model loaded successfully")
    else:
        print(f"✗ Model not found at {model_path}")
except Exception as e:
    print(f"✗ Failed to load YOLO model: {str(e)}")
    MODEL_AVAILABLE = False

# YOLO model uses its own classification
# The model will output gesture labels directly


def get_available_gestures():
    """Get gesture labels from YOLO model"""
    try:
        if model and hasattr(model, 'names'):
            return list(model.names.values())
        return []
    except Exception as e:
        print(f"[ERROR] Failed to get gesture labels: {str(e)}")
        return []


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "model_loaded": MODEL_AVAILABLE,
        "model_type": "YOLO",
        "classifier": "YOLO_gesture_recognition",
        "version": "5.0"
    })


@app.route('/recognize-gesture', methods=['POST'])
def recognize_gesture():
    """Receive camera frame and return recognized gesture using YOLO"""
    if not MODEL_AVAILABLE:
        return jsonify({
            "error": "YOLO model not loaded",
            "hand_detected": False
        }), 500

    try:
        image = None
        saved_path = "single_gesture_test.png"

        # Prefer multipart/form-data file upload (Postman key: "postman")
        if request.files:
            upload = None
            if 'postman' in request.files:
                upload = request.files['postman']
            elif len(request.files) > 0:
                # Fallback to the first uploaded file
                upload = next(iter(request.files.values()))
            if upload:
                file_bytes = upload.read()
                nparr = np.frombuffer(file_bytes, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if image is None:
                    return jsonify({"error": "Failed to decode uploaded file"}), 400
                # Save for test as PNG
                try:
                    cv2.imwrite(saved_path, image)
                except Exception as e:
                    print(f"[WARN] Failed to save {saved_path}: {str(e)}")

        # If no file upload, try base64 JSON payload under 'image'
        if image is None:
            data = request.get_json(silent=True) or {}
            if 'image' not in data:
                return jsonify({"error": "No image provided via 'image' base64 JSON or 'postman' file upload"}), 400
            image_data = base64.b64decode(data['image'])
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                return jsonify({"error": "Failed to decode base64 image"}), 400
            # Save for test as PNG
            try:
                cv2.imwrite(saved_path, image)
            except Exception as e:
                print(f"[WARN] Failed to save {saved_path}: {str(e)}")

        # Run YOLO inference on the image
        # YOLO handles preprocessing automatically
        results = model.predict(source=image, verbose=False)
        
        if results is None or len(results) == 0:
            return jsonify({
                "gesture": None,
                "confidence": 0.0,
                "hand_detected": False,
                "message": "No results from YOLO inference",
                "saved_file": saved_path
            })
        
        result = results[0]
        
        # Check if any detections were made
        if result.boxes is None or len(result.boxes) == 0:
            return jsonify({
                "gesture": None,
                "confidence": 0.0,
                "hand_detected": False,
                "message": "No gesture detected",
                "saved_file": saved_path
            })
        
        # Get the top detection
        top_detection = result.boxes[0]
        confidence = float(top_detection.conf)
        class_id = int(top_detection.cls)
        gesture = result.names[class_id]
        
        # Extract landmarks if available
        landmarks = None
        if result.keypoints is not None and len(result.keypoints) > 0:
            keypoints = result.keypoints[0]
            if keypoints.xy is not None:
                landmarks = [[float(pt[0]), float(pt[1])] for pt in keypoints.xy[0].cpu().numpy()]
        
        print(f"[RESULT] Gesture: {gesture}, Confidence: {confidence:.2f}")
        
        # Save annotated image using YOLO's visualization
        annotated_path = None
        try:
            annotated_image = result.plot()
            annotated_path = "single_gesture_test_annotated.png"
            cv2.imwrite(annotated_path, annotated_image)
        except Exception as e:
            print(f"[WARN] Failed to create annotated image: {str(e)}")
        
        if confidence > 0.3:
            return jsonify({
                "gesture": gesture,
                "confidence": float(confidence),
                "hand_detected": True,
                "landmarks": landmarks,
                "saved_file": saved_path,
                "annotated_file": annotated_path
            })
        else:
            return jsonify({
                "gesture": gesture,
                "confidence": float(confidence),
                "hand_detected": False,
                "landmarks": landmarks,
                "message": "Confidence below threshold",
                "saved_file": saved_path,
                "annotated_file": annotated_path
            })

    except Exception as e:
        import traceback
        print(f"[ERROR] Recognition failed:\n{traceback.format_exc()}")
        return jsonify({"error": f"Recognition failed: {str(e)}"}), 500


@app.route('/get-labels', methods=['GET'])
def get_labels():
    """Get all available gesture labels"""
    labels = get_available_gestures()
    return jsonify({
        "labels": labels,
        "count": len(labels)
    })


if __name__ == '__main__':
    print("\n" + "="*60)
    print("SignSpeak Backend Server v5.0")
    print("YOLO-based Hand Gesture Recognition")
    print("="*60)
    print(f"YOLO Model Available: {MODEL_AVAILABLE}")
    available_gestures = get_available_gestures()
    print(f"Available gestures: {len(available_gestures)}")
    if available_gestures:
        print(f"  {available_gestures}")
    print("\nEndpoints:")
    print("  GET  /health              - Health check")
    print("  POST /recognize-gesture   - Recognize gesture from image")
    print("  GET  /get-labels          - Get all gesture labels")
    print("\nStarting server on http://0.0.0.0:5000")
    print("="*60 + "\n")
    
    if not MODEL_AVAILABLE:
        print("⚠️  WARNING: YOLO model not loaded!")
        print("")
    
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
