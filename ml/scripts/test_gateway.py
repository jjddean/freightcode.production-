import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_gateway():
    print("--- Testing ML Gateway Health ---")
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"Health: {r.json()}")
    except Exception as e:
        print(f"Gateway not responding: {e}")
        return

    print("\n--- Testing HS Classification ---")
    hs_data = {"description": "High quality Laptop computers for export"}
    r = requests.post(f"{BASE_URL}/classify-hs", json=hs_data)
    print(f"Description: {hs_data['description']}")
    print(f"Predicted HS Code: {r.json().get('hs_code')}")

    print("\n--- Testing Anomaly Detection (Normal) ---")
    normal_data = {
        "bol_weight": 500.0,
        "inv_value": 5000.0,
        "pl_weight": 500.0,
        "weight_diff": 0.0
    }
    r = requests.post(f"{BASE_URL}/detect-anomalies", json=normal_data)
    print(f"Input: {normal_data}")
    print(f"Result: {r.json()}")

    print("\n--- Testing Anomaly Detection (Anomaly) ---")
    anomaly_data = {
        "bol_weight": 500.0,
        "inv_value": 50000.0, # Massive value for low weight
        "pl_weight": 400.0,    # Weight mismatch
        "weight_diff": 100.0
    }
    r = requests.post(f"{BASE_URL}/detect-anomalies", json=anomaly_data)
    print(f"Input: {anomaly_data}")
    print(f"Result: {r.json()}")

    print("\n--- Testing Pricing Prediction ---")
    pricing_data = {
        "service_type": "standard_ocean",
        "weight": 5000.0,
        "distance": 10000.0
    }
    r = requests.post(f"{BASE_URL}/predict-pricing", json=pricing_data)
    print(f"Input: {pricing_data}")
    print(f"Predicted Price: ${r.json().get('predicted_price')}")

    print("\n--- Testing ETA Prediction ---")
    eta_data = {
        "carrier": "Maersk",
        "service_type": "standard_ocean",
        "distance": 12000.0,
        "congestion_index": 0.8,
        "weather_risk": 0.1
    }
    r = requests.post(f"{BASE_URL}/predict-eta", json=eta_data)
    print(f"Input: {eta_data}")
    print(f"Predicted Days: {r.json().get('predicted_days')}")

if __name__ == "__main__":
    test_gateway()
