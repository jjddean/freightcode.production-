import joblib
import os
import pandas as pd
from pathlib import Path

MODELS_DIR = Path(__file__).parent.parent / "models"

def test_all_models():
    print("=== Testing FreightCode ML Models ===\n")
    
    # 1. HS Classifier
    hs_path = MODELS_DIR / "hs_classifier.joblib"
    vec_path = MODELS_DIR / "hs_vectorizer.joblib"
    if hs_path.exists() and vec_path.exists():
        print("1. Testing HS Classifier...")
        clf = joblib.load(hs_path)
        vec = joblib.load(vec_path)
        desc = "Cotton T-shirt, blue, 100% organic"
        X = vec.transform([desc])
        pred = clf.predict(X)[0]
        print(f"   Input: {desc}")
        print(f"   Predicted HS Code: {pred}\n")
    else:
        print("1. HS Classifier markers missing.\n")

    # 2. Pricing
    pricing_path = MODELS_DIR / "pricing_predictor.joblib"
    if pricing_path.exists():
        print("2. Testing Pricing Predictor...")
        bundle = joblib.load(pricing_path)
        model = bundle["model"]
        features = bundle["features"]
        # Dummy data matching feature names
        test_data = pd.DataFrame([0] * len(features)).T
        test_data.columns = features
        price = model.predict(test_data)[0]
        print(f"   Predicted Price: £{price:.2f}\n")

    # 3. ETA
    eta_path = MODELS_DIR / "eta_predictor.joblib"
    if eta_path.exists():
        print("3. Testing ETA Predictor...")
        bundle = joblib.load(eta_path)
        model = bundle["model"]
        features = bundle["features"]
        test_data = pd.DataFrame([0] * len(features)).T
        test_data.columns = features
        days = model.predict(test_data)[0]
        print(f"   Predicted ETA: {days:.1f} days\n")

    # 4. CDS Compliance
    cds_path = MODELS_DIR / "cds_compliance_model.joblib"
    if cds_path.exists():
        print("4. Testing CDS Compliance...")
        model = joblib.load(cds_path)
        # Assuming model takes 7 features (6 doc types + 1 value)
        dummy_input = [[1, 0, 0, 0, 0, 0, 5000.0]] 
        try:
            res = model.predict(dummy_input)[0]
            print(f"   Compliance status: {'✓ PASS' if res else '✗ FAIL'}\n")
        except Exception as e:
            print(f"   CDS Test failed (shape mismatch?): {e}\n")

    print("=== End of Testing ===")

if __name__ == "__main__":
    test_all_models()
