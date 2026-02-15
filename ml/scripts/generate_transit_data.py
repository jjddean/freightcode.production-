import json
import random
import os
from datetime import datetime, timedelta

def generate_eta_data(count=800):
    dataset = []
    carriers = {
        "Maersk": {"reliability": 0.95, "speed_mult": 1.0},
        "MSC": {"reliability": 0.88, "speed_mult": 1.05},
        "CMA CGM": {"reliability": 0.92, "speed_mult": 1.02},
        "Hapag-Lloyd": {"reliability": 0.96, "speed_mult": 0.98},
        "One": {"reliability": 0.90, "speed_mult": 1.1}
    }
    
    services = {"standard_ocean": 25, "express_air": 3, "trucking": 5} # Base days per 5000km
    
    for _ in range(count):
        carrier_name = random.choice(list(carriers.keys()))
        carrier_stats = carriers[carrier_name]
        
        service = random.choice(list(services.keys()))
        distance = random.uniform(500, 18000) # km
        
        # Base ETA calculation
        base_days = (distance / 5000) * services[service] * carrier_stats["speed_mult"]
        
        # Add noise based on reliability (lower reliability = more positive delay)
        delay_noise = random.uniform(0, 5) if random.random() > carrier_stats["reliability"] else random.uniform(-1, 1)
        
        # External factors (congestion/weather)
        congestion_index = random.uniform(0, 1) # 0 to 1
        weather_risk = random.uniform(0, 1) # 0 to 1
        
        actual_days = base_days + delay_noise + (congestion_index * 2) + (weather_risk * 1.5)
        
        dataset.append({
            "carrier": carrier_name,
            "service_type": service,
            "distance": round(distance, 2),
            "congestion_index": round(congestion_index, 2),
            "weather_risk": round(weather_risk, 2),
            "quoted_days": round(base_days, 1),
            "actual_days": round(actual_days, 1)
        })
    
    return dataset

if __name__ == "__main__":
    os.makedirs("ml/data", exist_ok=True)
    count = 1000
    dataset = generate_eta_data(count)
    
    with open("ml/data/transit_training.json", "w") as f:
        json.dump(dataset, f, indent=2)
        
    print(f"Generated {count} transit samples in ml/data/transit_training.json")
