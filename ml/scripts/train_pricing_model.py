import json
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os

data_file = "ml/data/pricing_training.json"
model_out = "ml/models/pricing_predictor.joblib"

def train_pricing_predictor():
    # Load data
    with open(data_file, 'r') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    # Feature Engineering: One-hot encode service_type
    df = pd.get_dummies(df, columns=["service_type"])
    
    # Select features
    X = df.drop("price", axis=1)
    y = df["price"]
    
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
    print(f"--- Pricing Predictor Performance ---")
    print(f"Mean Absolute Error: ${mae:.2f}")
    
    # Save model and feature names
    os.makedirs("ml/models", exist_ok=True)
    joblib.dump({"model": model, "features": feature_names}, model_out)
    print(f"Pricing model saved to {model_out}")

if __name__ == "__main__":
    train_pricing_predictor()
