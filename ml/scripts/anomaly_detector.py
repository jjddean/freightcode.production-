import pandas as pd
from sklearn.ensemble import IsolationForest
import numpy as np
import joblib
import os

input_file = "ml/data/training_features.csv"
model_out = "ml/models/anomaly_detector.joblib"

def detect_anomalies():
    # Load dataset
    df = pd.read_csv(input_file)
    
    # Feature Engineering
    df["val_weight_ratio"] = df["inv_value"] / df["bol_weight"].replace(0, 1)
    
    # Select features for ML model
    features = ["bol_weight", "inv_value", "pl_weight", "weight_diff", "val_weight_ratio"]
    X = df[features]
    
    # Model: Isolation Forest
    model = IsolationForest(contamination=0.25, random_state=42)
    df["anomaly_score"] = model.fit_predict(X)
    
    # IsolationForest returns -1 for anomalies and 1 for normal data
    df["detected"] = df["anomaly_score"].apply(lambda x: 1 if x == -1 else 0)
    
    # Save model
    os.makedirs("ml/models", exist_ok=True)
    joblib.dump(model, model_out)
    print(f"Anomaly model saved to {model_out}")
    
    # Evaluation
    true_anomalies = df["has_anomaly"].sum()
    detected_anomalies = df["detected"].sum()
    correct_detections = ((df["detected"] == 1) & (df["has_anomaly"] == 1)).sum()
    
    precision = correct_detections / detected_anomalies if detected_anomalies > 0 else 0
    recall = correct_detections / true_anomalies if true_anomalies > 0 else 0
    
    print(f"--- SmartAudit ML Anomaly Detection (Isolation Forest) ---")
    print(f"Total Shipments: {len(df)}")
    print(f"True Anomalies: {true_anomalies}")
    print(f"Detected Anomalies: {detected_anomalies}")
    print(f"Correct Detections: {correct_detections}")
    print(f"Precision: {precision:.2%}")
    print(f"Recall: {recall:.2%}")

if __name__ == "__main__":
    detect_anomalies()
