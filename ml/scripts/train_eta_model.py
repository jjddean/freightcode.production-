import json
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os

data_file = "ml/data/transit_training.json"
model_out = "ml/models/eta_predictor.joblib"

def train_eta_predictor():
    # Load data
    with open(data_file, 'r') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    # Feature Engineering: One-hot encode carrier and service_type
    df = pd.get_dummies(df, columns=["carrier", "service_type"])
    
    # Select features (excluding quoted_days as we want to predict actuals independently)
    X = df.drop(["actual_days", "quoted_days"], axis=1)
    y = df["actual_days"]
    
    # Save feature names for consistent inference
    feature_names = X.columns.tolist()
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Model: Random Forest Regressor
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Validate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"--- ETA Predictor Performance ---")
    print(f"Mean Absolute Error: {mae:.2f} days")
    
    # Save model and feature names
    os.makedirs("ml/models", exist_ok=True)
    joblib.dump({"model": model, "features": feature_names}, model_out)
    print(f"ETA model saved to {model_out}")

if __name__ == "__main__":
    train_eta_predictor()
