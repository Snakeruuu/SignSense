"""
Inspect TFLite model to get output classes and shape
"""
import tensorflow as tf
import numpy as np

model_path = "assets/models/gesture-model.tflite"

try:
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    print("\n" + "="*60)
    print("TFLite Model Information")
    print("="*60)
    
    print("\nINPUT Details:")
    print(f"  Shape: {input_details[0]['shape']}")
    print(f"  Type: {input_details[0]['dtype']}")
    
    print("\nOUTPUT Details:")
    print(f"  Shape: {output_details[0]['shape']}")
    print(f"  Type: {output_details[0]['dtype']}")
    
    # Calculate number of output classes
    output_shape = output_details[0]['shape']
    if len(output_shape) == 2:
        num_classes = output_shape[1]
    elif len(output_shape) == 1:
        num_classes = output_shape[0]
    else:
        num_classes = np.prod(output_shape[1:])
    
    print(f"\n  Number of gesture classes: {num_classes}")
    print("\nUpdate GESTURE_LABELS in server.py with your class names:")
    print(f"  GESTURE_LABELS = [")
    print(f"    # Add {int(num_classes)} gesture names here in order")
    for i in range(int(num_classes)):
        print(f"    'gesture_{i}',")
    print(f"  ]")
    
    print("\n" + "="*60)
    
except Exception as e:
    print(f"Error: {str(e)}")
