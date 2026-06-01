from ultralytics import YOLO

# Load your trained model
model = YOLO("assets/models/gesture-model.tflite")

# Predict on all images inside the folder
results = model.predict(
    source="test_images",   # folder with your test images
    show=True,               # show results while running
    save=True,               # save results to 'runs/pose/predict/'
    save_txt=False,          # set True if you also want raw keypoints in .txt files
    name="predictions"       # folder name under runs/pose/
)

print("Predictions saved in:", results[0].save_dir)

