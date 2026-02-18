import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

data_file = "ml/data/cds_training.json"
model_out = "ml/models/cds_compliance_model.joblib"

def train_cds_model():
    # Load data
    if not os.path.exists(data_file):
        print(f"Error: Data file {data_file} not found. Run generate_cds_data.py first.")
        return

    with open(data_file, 'r') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    # Simple feature engineering for training
    # Convert categorical document_type to dummy variables
    df = pd.get_dummies(df, columns=["document_type"])
    
    # Select features
    # Note: EORI and MRN are strings, we might want to use their presence/format as features
    # For now, let's use the created dummy variables and value
    features = [col for col in df.columns if col.startswith("document_type_")] + ["value"]
    X = df[features]
    y = df["is_compliant"]
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Model
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    # Validate
    y_pred = clf.predict(X_test)
    print("--- CDS Compliance Classifier Performance ---")
    print(classification_report(y_test, y_pred))
    
    # Save model
    os.makedirs("ml/models", exist_ok=True)
    joblib.dump(clf, model_out)
    print(f"Model saved to {model_out}")

if __name__ == "__main__":
    train_cds_model()
