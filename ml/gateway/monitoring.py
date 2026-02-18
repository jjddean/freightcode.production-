import logging
import time
from prometheus_client import Counter, Histogram
from fastapi import Request

# Metrics
prediction_counter = Counter('ml_predictions_total', 'Total predictions', ['model'])
prediction_latency = Histogram('ml_prediction_latency_seconds', 'Prediction latency', ['model'])
prediction_confidence = Histogram('ml_prediction_confidence', 'Prediction confidence', ['model'])

def instrument_model_prediction(model_name: str, confidence: float = None):
    """Decorator or helper to log and track predictions"""
    prediction_counter.labels(model=model_name).inc()
    if confidence is not None:
        prediction_confidence.labels(model=model_name).observe(confidence)

class MonitoringMiddleware:
    async def __call__(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        # In a real setup, we might log specific endpoint latency here
        return response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_gateway")
