import json
import random
import os

def generate_pricing_data(count=600):
    dataset = []
    service_multipliers = {"standard_ocean": 0.5, "express_air": 5.0, "trucking": 1.5}
    
    for _ in range(count):
        service = random.choice(list(service_multipliers.keys()))
        weight = random.uniform(500, 20000) # kg
        distance = random.uniform(500, 15000) # km
        
        # Base price calculation with some random noise
        base_price = (distance * 0.1) + (weight * 0.2)
        final_price = base_price * service_multipliers[service] * random.uniform(0.9, 1.1)
        
        dataset.append({
            "service_type": service,
            "weight": weight,
            "distance": distance,
            "price": round(final_price, 2)
        })
    
    return dataset

if __name__ == "__main__":
    os.makedirs("ml/data", exist_ok=True)
    count = 1000
    dataset = generate_pricing_data(count)
    
    with open("ml/data/pricing_training.json", "w") as f:
        json.dump(dataset, f, indent=2)
        
    print(f"Generated {count} pricing samples in ml/data/pricing_training.json")
