from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import os

app = FastAPI(title="FreightCode ML Brain Gateway")

# Model Paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
HS_CLF_PATH = os.path.join(MODELS_DIR, "hs_classifier.joblib")
HS_VEC_PATH = os.path.join(MODELS_DIR, "hs_vectorizer.joblib")
ANOMALY_PATH = os.path.join(MODELS_DIR, "anomaly_detector.joblib")
PRICING_PATH = os.path.join(MODELS_DIR, "pricing_predictor.joblib")
ETA_PATH = os.path.join(MODELS_DIR, "eta_predictor.joblib")

# Load Models (Singleton logic)
models = {}

def load_models():
    try:
        if os.path.exists(HS_CLF_PATH):
            models["hs_clf"] = joblib.load(HS_CLF_PATH)
            models["hs_vec"] = joblib.load(HS_VEC_PATH)
        if os.path.exists(ANOMALY_PATH):
            models["anomaly_clf"] = joblib.load(ANOMALY_PATH)
        if os.path.exists(PRICING_PATH):
            models["pricing_bundle"] = joblib.load(PRICING_PATH)
        if os.path.exists(ETA_PATH):
            models["eta_bundle"] = joblib.load(ETA_PATH)
    except Exception as e:
        print(f"Error loading models: {e}")

@app.on_event("startup")
async def startup_event():
    load_models()

# Request Models
class HSRequest(BaseModel):
    description: str

class AnomalyRequest(BaseModel):
    bol_weight: float
    inv_value: float
    pl_weight: float
    weight_diff: float

class PricingRequest(BaseModel):
    service_type: str # standard_ocean, express_air, trucking
    weight: float
    distance: float

class ETARequest(BaseModel):
    carrier: str
    service_type: str
    distance: float
    congestion_index: float = 0.5
    weather_risk: float = 0.2

# Endpoints
@app.post("/classify-hs")
async def classify_hs(req: HSRequest):
    if "hs_clf" not in models:
        raise HTTPException(status_code=503, detail="HS Classifier not loaded")
    
    X = models["hs_vec"].transform([req.description])
    prediction = models["hs_clf"].predict(X)[0]
    return {"hs_code": prediction}

@app.post("/detect-anomalies")
async def detect_anomalies(req: AnomalyRequest):
    if "anomaly_clf" not in models:
        raise HTTPException(status_code=503, detail="Anomaly Detector not loaded")
    
    # Feature Engineering (consistent with training)
    val_weight_ratio = req.inv_value / (req.bol_weight if req.bol_weight != 0 else 1.0)
    
    data = {
        "bol_weight": [req.bol_weight],
        "inv_value": [req.inv_value],
        "pl_weight": [req.pl_weight],
        "weight_diff": [req.weight_diff],
        "val_weight_ratio": [val_weight_ratio]
    }
    X = pd.DataFrame(data)
    
    # Predict (-1 is anomaly, 1 is normal)
    score = models["anomaly_clf"].predict(X)[0]
    return {
        "is_anomaly": bool(score == -1),
        "score": float(score)
    }

@app.post("/predict-pricing")
async def predict_pricing(req: PricingRequest):
    if "pricing_bundle" not in models:
        raise HTTPException(status_code=503, detail="Pricing Predictor not loaded")
    
    bundle = models["pricing_bundle"]
    model = bundle["model"]
    features = bundle["features"]
    
    # Prepare input for one-hot encoded model
    input_data = pd.DataFrame([{
        "weight": req.weight,
        "distance": req.distance,
        f"service_type_{req.service_type}": 1
    }])
    
    # Align features (add missing columns as 0)
    for feat in features:
        if feat not in input_data.columns:
            input_data[feat] = 0
    input_data = input_data[features]
    
    prediction = model.predict(input_data)[0]
    return {"predicted_price": round(float(prediction), 2)}

@app.post("/predict-eta")
async def predict_eta(req: ETARequest):
    if "eta_bundle" not in models:
        raise HTTPException(status_code=503, detail="ETA Predictor not loaded")
    
    bundle = models["eta_bundle"]
    model = bundle["model"]
    features = bundle["features"]
    
    # Prepare input for one-hot encoded model
    input_data = pd.DataFrame([{
        "distance": req.distance,
        "congestion_index": req.congestion_index,
        "weather_risk": req.weather_risk,
        f"carrier_{req.carrier}": 1,
        f"service_type_{req.service_type}": 1
    }])
    
    # Align features
    for feat in features:
        if feat not in input_data.columns:
            input_data[feat] = 0
    input_data = input_data[features]
    
    prediction = model.predict(input_data)[0]
    return {"predicted_days": round(float(prediction), 1)}

@app.get("/health")
async def health():
    return {"status": "ok", "models_loaded": list(models.keys())}
